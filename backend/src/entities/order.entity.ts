import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { OrderStatus, OrderSource } from '@shared/enums';
import { TableEntity } from './table.entity';
import { OrderItem } from './order-item.entity';
import { OrderStatusHistory } from './order-status-history.entity';

@Entity('order_entity')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'table_id' })
  tableId!: string;

  @Column({ type: 'varchar', name: 'qr_session_token', nullable: true })
  qrSessionToken!: string | null;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status!: OrderStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'total_price', default: 0 })
  totalPrice!: number;

  @Column({ type: 'varchar', length: 200, name: 'cancellation_reason', nullable: true })
  cancellationReason!: string | null;

  @Column({
    type: 'enum',
    enum: OrderSource,
    name: 'order_source',
    default: OrderSource.STAFF,
  })
  orderSource!: OrderSource;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;

  @ManyToOne(() => TableEntity, (table) => table.orders, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'table_id' })
  table!: TableEntity;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items!: OrderItem[];

  @OneToMany(() => OrderStatusHistory, (history) => history.order, { cascade: true })
  statusHistory!: OrderStatusHistory[];
}
