import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { OrderStatus } from '@shared/enums';
import { Order } from './order.entity';

@Entity('order_status_history')
export class OrderStatusHistory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'order_id' })
  orderId!: string;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    name: 'from_status',
  })
  fromStatus!: OrderStatus;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    name: 'to_status',
  })
  toStatus!: OrderStatus;

  @Column({ type: 'timestamptz', name: 'changed_at', default: () => 'NOW()' })
  changedAt!: Date;

  @ManyToOne(() => Order, (order) => order.statusHistory, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order!: Order;
}
