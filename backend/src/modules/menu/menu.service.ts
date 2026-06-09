import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MenuItem } from '../../entities/menu-item.entity';
import { OrderItem } from '../../entities/order-item.entity';
import { Order } from '../../entities/order.entity';
import { OrderStatus } from '@shared/enums';

@Injectable()
export class MenuService {
  constructor(
    @InjectRepository(MenuItem)
    private readonly menuItemRepository: Repository<MenuItem>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  async findAll(): Promise<MenuItem[]> {
    return this.menuItemRepository.find({
      order: { category: 'ASC', name: 'ASC' },
    });
  }

  async findById(id: string): Promise<MenuItem> {
    const item = await this.menuItemRepository.findOne({ where: { id } });
    if (!item) {
      throw new NotFoundException(`Menu item with id ${id} not found`);
    }
    return item;
  }

  async findByCategory(): Promise<Record<string, MenuItem[]>> {
    const items = await this.findAll();
    const grouped: Record<string, MenuItem[]> = {};
    for (const item of items) {
      if (!grouped[item.category]) {
        grouped[item.category] = [];
      }
      grouped[item.category].push(item);
    }
    return grouped;
  }

  async create(dto: {
    name: string;
    description: string;
    price: number;
    category: string;
  }): Promise<MenuItem> {
    this.validateFields(dto);
    const item = this.menuItemRepository.create({
      name: dto.name,
      description: dto.description,
      price: dto.price,
      category: dto.category,
      isAvailable: true,
    });
    return this.menuItemRepository.save(item);
  }

  async update(
    id: string,
    dto: {
      name?: string;
      description?: string;
      price?: number;
      category?: string;
    },
  ): Promise<MenuItem> {
    const item = await this.findById(id);

    if (dto.name !== undefined) {
      if (!dto.name || dto.name.length > 100) {
        throw new BadRequestException('Name must be between 1 and 100 characters');
      }
      item.name = dto.name;
    }
    if (dto.description !== undefined) {
      if (dto.description.length > 500) {
        throw new BadRequestException('Description must be at most 500 characters');
      }
      item.description = dto.description;
    }
    if (dto.price !== undefined) {
      if (dto.price < 0.01 || dto.price > 99999.99) {
        throw new BadRequestException('Price must be between 0.01 and 99999.99');
      }
      item.price = dto.price;
    }
    if (dto.category !== undefined) {
      if (!dto.category) {
        throw new BadRequestException('Category is required');
      }
      item.category = dto.category;
    }

    return this.menuItemRepository.save(item);
  }

  async setAvailability(id: string, available: boolean): Promise<MenuItem> {
    const item = await this.findById(id);
    item.isAvailable = available;
    return this.menuItemRepository.save(item);
  }

  async remove(id: string): Promise<void> {
    const item = await this.findById(id);

    if (await this.isPartOfActiveOrder(id)) {
      throw new ConflictException(
        'Cannot delete menu item that is part of an active order',
      );
    }

    await this.menuItemRepository.remove(item);
  }

  async isPartOfActiveOrder(menuItemId: string): Promise<boolean> {
    const count = await this.orderItemRepository
      .createQueryBuilder('orderItem')
      .innerJoin('orderItem.order', 'order')
      .where('orderItem.menu_item_id = :menuItemId', { menuItemId })
      .andWhere('order.status NOT IN (:...statuses)', {
        statuses: [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
      })
      .getCount();

    return count > 0;
  }

  private validateFields(dto: {
    name: string;
    description: string;
    price: number;
    category: string;
  }): void {
    const errors: string[] = [];
    if (!dto.name || dto.name.length > 100) {
      errors.push('Name must be between 1 and 100 characters');
    }
    if (dto.description && dto.description.length > 500) {
      errors.push('Description must be at most 500 characters');
    }
    if (dto.price < 0.01 || dto.price > 99999.99) {
      errors.push('Price must be between 0.01 and 99999.99');
    }
    if (!dto.category) {
      errors.push('Category is required');
    }
    if (errors.length > 0) {
      throw new BadRequestException(errors);
    }
  }
}
