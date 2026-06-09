import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { TableStatus } from '@shared/enums';
import { Order } from './order.entity';
import { QrCode } from './qr-code.entity';

@Entity('table_entity')
export class TableEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'int', name: 'table_number', unique: true })
  tableNumber!: number;

  @Column({ type: 'int', name: 'seating_capacity' })
  seatingCapacity!: number;

  @Column({
    type: 'enum',
    enum: TableStatus,
    default: TableStatus.AVAILABLE,
  })
  status!: TableStatus;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => Order, (order) => order.table)
  orders!: Order[];

  @OneToMany(() => QrCode, (qrCode) => qrCode.table)
  qrCodes!: QrCode[];
}
