import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
  BadRequestException,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { TableEntity } from '../../entities/table.entity';
import { Order } from '../../entities/order.entity';
import { TableStatus, OrderStatus } from '@shared/enums';
import { VALID_TABLE_TRANSITIONS } from '@shared/transitions';
import { EventsGateway } from '../events/events.gateway';
import { QrCodeService } from '../qr-code/qr-code.service';

@Injectable()
export class TablesService {
  constructor(
    @InjectRepository(TableEntity)
    private readonly tableRepository: Repository<TableEntity>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly eventsGateway: EventsGateway,
    @Inject(forwardRef(() => QrCodeService))
    private readonly qrCodeService: QrCodeService,
  ) {}

  async findAll(): Promise<TableEntity[]> {
    return this.tableRepository.find({ order: { tableNumber: 'ASC' } });
  }

  async findById(id: string): Promise<TableEntity> {
    const table = await this.tableRepository.findOne({ where: { id } });
    if (!table) {
      throw new NotFoundException(`Table with id ${id} not found`);
    }
    return table;
  }

  async create(dto: { tableNumber: number; seatingCapacity: number }): Promise<TableEntity> {
    // Check uniqueness
    const existing = await this.tableRepository.findOne({
      where: { tableNumber: dto.tableNumber },
    });
    if (existing) {
      throw new ConflictException(
        `Table number ${dto.tableNumber} is already in use`,
      );
    }

    const table = this.tableRepository.create({
      tableNumber: dto.tableNumber,
      seatingCapacity: dto.seatingCapacity,
      status: TableStatus.AVAILABLE,
    });

    return this.tableRepository.save(table);
  }

  async update(
    id: string,
    dto: { tableNumber?: number; seatingCapacity?: number },
  ): Promise<TableEntity> {
    const table = await this.findById(id);

    if (dto.tableNumber !== undefined && dto.tableNumber !== table.tableNumber) {
      const existing = await this.tableRepository.findOne({
        where: { tableNumber: dto.tableNumber, id: Not(id) },
      });
      if (existing) {
        throw new ConflictException(
          `Table number ${dto.tableNumber} is already in use`,
        );
      }
      table.tableNumber = dto.tableNumber;
    }

    if (dto.seatingCapacity !== undefined) {
      table.seatingCapacity = dto.seatingCapacity;
    }

    return this.tableRepository.save(table);
  }

  async updateStatus(id: string, newStatus: TableStatus): Promise<TableEntity> {
    const table = await this.findById(id);
    const previousStatus = table.status;

    if (!this.validateStatusTransition(table.status, newStatus)) {
      throw new BadRequestException(
        `Cannot transition from ${table.status} to ${newStatus}. Allowed transitions: ${VALID_TABLE_TRANSITIONS[table.status].join(', ')}`,
      );
    }

    table.status = newStatus;
    const savedTable = await this.tableRepository.save(table);

    // Emit real-time event
    this.eventsGateway.emitTableStatusChange(savedTable);

    // Req 10.1: Auto-generate QR code when table becomes Occupied
    if (newStatus === TableStatus.OCCUPIED) {
      try {
        const qrCode = await this.qrCodeService.generateForTable(id);
        this.eventsGateway.emitQrCodeGenerated(id, qrCode);
      } catch (err) {
        // QR generation failure should not block status change
      }
    }

    // Req 10.6: Auto-invalidate QR code when table moves from Occupied to Needs_Cleaning
    if (previousStatus === TableStatus.OCCUPIED && newStatus === TableStatus.NEEDS_CLEANING) {
      try {
        await this.qrCodeService.invalidateForTable(id);
        this.eventsGateway.emitQrCodeInvalidated(id);
      } catch (err) {
        // QR invalidation failure should not block status change
      }
    }

    return savedTable;
  }

  async remove(id: string): Promise<void> {
    const table = await this.findById(id);

    if (await this.hasActiveOrders(id)) {
      throw new ConflictException(
        'Cannot delete table with active orders. Complete or cancel all orders first.',
      );
    }

    await this.tableRepository.remove(table);
  }

  async getStatusSummary(): Promise<Record<string, number>> {
    const tables = await this.tableRepository.find();
    const summary: Record<string, number> = {
      available: 0,
      occupied: 0,
      reserved: 0,
      needsCleaning: 0,
      total: tables.length,
    };

    for (const table of tables) {
      switch (table.status) {
        case TableStatus.AVAILABLE:
          summary['available']++;
          break;
        case TableStatus.OCCUPIED:
          summary['occupied']++;
          break;
        case TableStatus.RESERVED:
          summary['reserved']++;
          break;
        case TableStatus.NEEDS_CLEANING:
          summary['needsCleaning']++;
          break;
      }
    }

    return summary;
  }

  validateStatusTransition(currentStatus: TableStatus, newStatus: TableStatus): boolean {
    const allowedTransitions = VALID_TABLE_TRANSITIONS[currentStatus];
    return allowedTransitions.includes(newStatus);
  }

  async hasActiveOrders(tableId: string): Promise<boolean> {
    const count = await this.orderRepository.count({
      where: {
        tableId,
        status: Not(OrderStatus.COMPLETED) && Not(OrderStatus.CANCELLED) as any,
      },
    });
    // Better approach using query builder
    const activeCount = await this.orderRepository
      .createQueryBuilder('order')
      .where('order.table_id = :tableId', { tableId })
      .andWhere('order.status NOT IN (:...statuses)', {
        statuses: [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
      })
      .getCount();
    return activeCount > 0;
  }
}
