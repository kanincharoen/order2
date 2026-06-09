import { Injectable, GoneException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MenuItem } from '../../entities/menu-item.entity';
import { Order } from '../../entities/order.entity';
import { TableEntity } from '../../entities/table.entity';
import { QrCodeService } from '../qr-code/qr-code.service';
import { OrdersService } from '../orders/orders.service';
import { OrderSource, TableStatus } from '@shared/enums';

@Injectable()
export class CustomerOrderService {
  constructor(
    @InjectRepository(MenuItem)
    private readonly menuItemRepository: Repository<MenuItem>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(TableEntity)
    private readonly tableRepository: Repository<TableEntity>,
    private readonly qrCodeService: QrCodeService,
    private readonly ordersService: OrdersService,
  ) {}

  async getMenuForSession(token: string) {
    const { valid, tableId } = await this.validateToken(token);
    if (!valid || !tableId) {
      throw new GoneException('This QR code is no longer valid');
    }

    const table = await this.tableRepository.findOne({ where: { id: tableId } });
    const items = await this.menuItemRepository.find({
      where: { isAvailable: true },
      order: { category: 'ASC', name: 'ASC' },
    });

    // Group by category
    const categories: Record<string, any[]> = {};
    for (const item of items) {
      if (!categories[item.category]) {
        categories[item.category] = [];
      }
      categories[item.category].push({
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        category: item.category,
      });
    }

    return {
      tableNumber: table?.tableNumber,
      categories,
    };
  }

  async placeOrder(
    token: string,
    items: Array<{ menuItemId: string; quantity: number; specialInstructions?: string }>,
  ) {
    const { valid, tableId } = await this.validateToken(token);
    if (!valid || !tableId) {
      throw new GoneException('This QR code is no longer valid');
    }

    const table = await this.tableRepository.findOne({ where: { id: tableId } });
    if (!table || table.status !== TableStatus.OCCUPIED) {
      throw new BadRequestException('Table is not currently occupied');
    }

    return this.ordersService.create({
      tableId,
      items,
      orderSource: OrderSource.CUSTOMER_QR,
      qrSessionToken: token,
    });
  }

  async getOrdersForSession(token: string) {
    const { valid, tableId } = await this.validateToken(token);
    if (!valid || !tableId) {
      throw new GoneException('This QR code is no longer valid');
    }

    const orders = await this.orderRepository.find({
      where: { qrSessionToken: token },
      relations: ['items', 'items.menuItem'],
      order: { createdAt: 'DESC' },
    });

    return orders.map((order) => ({
      orderId: order.id,
      status: order.status,
      createdAt: order.createdAt,
      totalPrice: order.totalPrice,
      items: order.items.map((item) => ({
        name: item.menuItem?.name || 'Unknown',
        quantity: item.quantity,
        price: item.unitPrice,
      })),
    }));
  }

  private async validateToken(
    token: string,
  ): Promise<{ valid: boolean; tableId?: string }> {
    return this.qrCodeService.validateSessionToken(token);
  }
}
