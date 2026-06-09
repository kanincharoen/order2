import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../../entities/order.entity';
import { OrderItem } from '../../entities/order-item.entity';
import { OrderStatusHistory } from '../../entities/order-status-history.entity';
import { TableEntity } from '../../entities/table.entity';
import { MenuItem } from '../../entities/menu-item.entity';
import { OrderStatus, TableStatus, OrderSource } from '@shared/enums';
import { VALID_ORDER_TRANSITIONS } from '@shared/transitions';
import { ORDER_MODIFICATION_RULES } from '@shared/transitions';
import { PaginatedResult } from '@shared/interfaces';
import { EventsGateway } from '../events/events.gateway';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(OrderStatusHistory)
    private readonly historyRepository: Repository<OrderStatusHistory>,
    @InjectRepository(TableEntity)
    private readonly tableRepository: Repository<TableEntity>,
    @InjectRepository(MenuItem)
    private readonly menuItemRepository: Repository<MenuItem>,
    private readonly eventsGateway: EventsGateway,
  ) {}

  async findActive(): Promise<Order[]> {
    return this.orderRepository.find({
      where: [
        { status: OrderStatus.PENDING },
        { status: OrderStatus.IN_PROGRESS },
        { status: OrderStatus.READY },
        { status: OrderStatus.SERVED },
      ],
      relations: ['items', 'items.menuItem', 'table'],
      order: { createdAt: 'ASC' },
    });
  }

  async findHistory(query: {
    tableNumber?: number;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResult<Order>> {
    const page = query.page || 1;
    const limit = query.limit || 50;

    if (query.startDate && query.endDate) {
      if (new Date(query.startDate) > new Date(query.endDate)) {
        throw new BadRequestException(
          'Start date must be on or before end date',
        );
      }
    }

    const qb = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.menuItem', 'menuItem')
      .leftJoinAndSelect('order.table', 'table')
      .leftJoinAndSelect('order.statusHistory', 'history')
      .where('order.status IN (:...statuses)', {
        statuses: [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
      });

    if (query.tableNumber) {
      qb.andWhere('table.table_number = :tableNumber', {
        tableNumber: query.tableNumber,
      });
    }

    if (query.startDate) {
      qb.andWhere('order.created_at >= :startDate', {
        startDate: new Date(query.startDate),
      });
    }

    if (query.endDate) {
      const endDate = new Date(query.endDate);
      endDate.setHours(23, 59, 59, 999);
      qb.andWhere('order.created_at <= :endDate', { endDate });
    }

    qb.orderBy('order.created_at', 'DESC');

    const total = await qb.getCount();
    const data = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['items', 'items.menuItem', 'table', 'statusHistory'],
    });
    if (!order) {
      throw new NotFoundException(`Order with id ${id} not found`);
    }
    return order;
  }

  async create(dto: {
    tableId: string;
    items: Array<{ menuItemId: string; quantity: number; specialInstructions?: string }>;
    orderSource?: OrderSource;
    qrSessionToken?: string;
  }): Promise<Order> {
    // Validate table is occupied
    const table = await this.tableRepository.findOne({
      where: { id: dto.tableId },
    });
    if (!table) {
      throw new NotFoundException('Table not found');
    }
    if (table.status !== TableStatus.OCCUPIED) {
      throw new BadRequestException(
        'Orders can only be created for occupied tables',
      );
    }

    // Validate items
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('At least one order item is required');
    }

    // Build order items with price snapshot
    const orderItems: Partial<OrderItem>[] = [];
    for (const itemDto of dto.items) {
      const menuItem = await this.menuItemRepository.findOne({
        where: { id: itemDto.menuItemId },
      });
      if (!menuItem) {
        throw new NotFoundException(
          `Menu item with id ${itemDto.menuItemId} not found`,
        );
      }
      if (!menuItem.isAvailable) {
        throw new BadRequestException(
          `Menu item "${menuItem.name}" is currently unavailable`,
        );
      }
      orderItems.push({
        menuItemId: menuItem.id,
        quantity: itemDto.quantity,
        specialInstructions: itemDto.specialInstructions || null,
        unitPrice: menuItem.price,
      });
    }

    // Calculate total
    const totalPrice = orderItems.reduce(
      (sum, item) => sum + Number(item.unitPrice!) * item.quantity!,
      0,
    );

    // Create order
    const order = this.orderRepository.create({
      tableId: dto.tableId,
      status: OrderStatus.PENDING,
      totalPrice,
      orderSource: dto.orderSource || OrderSource.STAFF,
      qrSessionToken: dto.qrSessionToken || null,
    });

    const savedOrder = await this.orderRepository.save(order);

    // Save items
    for (const item of orderItems) {
      const orderItem = this.orderItemRepository.create({
        ...item,
        orderId: savedOrder.id,
      });
      await this.orderItemRepository.save(orderItem);
    }

    const fullOrder = await this.findById(savedOrder.id);

    // Emit real-time event
    this.eventsGateway.emitOrderCreated(fullOrder);

    return fullOrder;
  }

  async updateStatus(
    id: string,
    newStatus: OrderStatus,
    cancellationReason?: string,
  ): Promise<Order> {
    const order = await this.findById(id);

    if (!this.validateStatusTransition(order.status, newStatus)) {
      throw new BadRequestException(
        `Cannot transition from ${order.status} to ${newStatus}. Allowed: ${VALID_ORDER_TRANSITIONS[order.status].join(', ')}`,
      );
    }

    if (newStatus === OrderStatus.CANCELLED) {
      if (!cancellationReason || cancellationReason.length === 0 || cancellationReason.length > 200) {
        throw new BadRequestException(
          'Cancellation reason must be between 1 and 200 characters',
        );
      }
      order.cancellationReason = cancellationReason;
    }

    // Record history
    const history = this.historyRepository.create({
      orderId: order.id,
      fromStatus: order.status,
      toStatus: newStatus,
      changedAt: new Date(),
    });
    await this.historyRepository.save(history);

    order.status = newStatus;
    await this.orderRepository.save(order);

    const updatedOrder = await this.findById(id);

    // Emit real-time event
    this.eventsGateway.emitOrderStatusChange(updatedOrder);

    return updatedOrder;
  }

  async addItem(
    orderId: string,
    dto: { menuItemId: string; quantity: number; specialInstructions?: string },
  ): Promise<Order> {
    const order = await this.findById(orderId);
    const rules = ORDER_MODIFICATION_RULES[order.status];

    if (!rules.addItems) {
      throw new BadRequestException(
        `Cannot add items to an order with status ${order.status}`,
      );
    }

    const menuItem = await this.menuItemRepository.findOne({
      where: { id: dto.menuItemId },
    });
    if (!menuItem) {
      throw new NotFoundException('Menu item not found');
    }
    if (!menuItem.isAvailable) {
      throw new BadRequestException(
        `Menu item "${menuItem.name}" is currently unavailable`,
      );
    }

    const orderItem = this.orderItemRepository.create({
      orderId,
      menuItemId: menuItem.id,
      quantity: dto.quantity,
      specialInstructions: dto.specialInstructions || null,
      unitPrice: menuItem.price,
    });
    await this.orderItemRepository.save(orderItem);

    await this.recalculateTotal(orderId);
    return this.findById(orderId);
  }

  async updateItem(
    orderId: string,
    itemId: string,
    dto: { menuItemId?: string; quantity?: number; specialInstructions?: string },
  ): Promise<Order> {
    const order = await this.findById(orderId);
    const rules = ORDER_MODIFICATION_RULES[order.status];

    const item = await this.orderItemRepository.findOne({
      where: { id: itemId, orderId },
    });
    if (!item) {
      throw new NotFoundException('Order item not found');
    }

    if (dto.menuItemId && !rules.changeMenuItem) {
      throw new BadRequestException(
        `Cannot change menu item for an order with status ${order.status}`,
      );
    }

    if (dto.quantity !== undefined && !rules.changeQuantity) {
      throw new BadRequestException(
        `Cannot change quantity for an order with status ${order.status}`,
      );
    }

    if (dto.specialInstructions !== undefined && !rules.editInstructions) {
      throw new BadRequestException(
        `Cannot edit instructions for an order with status ${order.status}`,
      );
    }

    if (dto.menuItemId) {
      const menuItem = await this.menuItemRepository.findOne({
        where: { id: dto.menuItemId },
      });
      if (!menuItem) {
        throw new NotFoundException('Menu item not found');
      }
      if (!menuItem.isAvailable) {
        throw new BadRequestException(
          `Menu item "${menuItem.name}" is currently unavailable`,
        );
      }
      item.menuItemId = menuItem.id;
      item.unitPrice = menuItem.price;
    }

    if (dto.quantity !== undefined) {
      item.quantity = dto.quantity;
    }

    if (dto.specialInstructions !== undefined) {
      item.specialInstructions = dto.specialInstructions;
    }

    await this.orderItemRepository.save(item);
    await this.recalculateTotal(orderId);
    return this.findById(orderId);
  }

  async removeItem(orderId: string, itemId: string): Promise<Order> {
    const order = await this.findById(orderId);
    const rules = ORDER_MODIFICATION_RULES[order.status];

    if (!rules.removeItems) {
      throw new BadRequestException(
        `Cannot remove items from an order with status ${order.status}`,
      );
    }

    const item = await this.orderItemRepository.findOne({
      where: { id: itemId, orderId },
    });
    if (!item) {
      throw new NotFoundException('Order item not found');
    }

    await this.orderItemRepository.remove(item);
    await this.recalculateTotal(orderId);
    return this.findById(orderId);
  }

  async checkAllOrdersCompleted(tableId: string): Promise<boolean> {
    const orders = await this.orderRepository.find({
      where: { tableId },
    });

    if (orders.length === 0) return false;

    return orders.every(
      (o) =>
        o.status === OrderStatus.COMPLETED || o.status === OrderStatus.CANCELLED,
    );
  }

  validateStatusTransition(
    currentStatus: OrderStatus,
    newStatus: OrderStatus,
  ): boolean {
    return VALID_ORDER_TRANSITIONS[currentStatus].includes(newStatus);
  }

  private async recalculateTotal(orderId: string): Promise<void> {
    const items = await this.orderItemRepository.find({
      where: { orderId },
    });
    const total = items.reduce(
      (sum, item) => sum + Number(item.unitPrice) * item.quantity,
      0,
    );
    await this.orderRepository.update(orderId, { totalPrice: total });
  }
}
