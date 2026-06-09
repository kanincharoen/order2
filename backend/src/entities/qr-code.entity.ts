import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { TableEntity } from './table.entity';

@Entity('qr_code')
export class QrCode {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'table_id' })
  tableId!: string;

  @Column({ type: 'varchar', length: 64, name: 'session_token', unique: true })
  sessionToken!: string;

  @Column({ type: 'varchar', name: 'order_url' })
  orderUrl!: string;

  @Column({ type: 'boolean', name: 'is_active', default: true })
  isActive!: boolean;

  @Column({ type: 'timestamptz', name: 'generated_at' })
  generatedAt!: Date;

  @Column({ type: 'timestamptz', name: 'invalidated_at', nullable: true })
  invalidatedAt!: Date | null;

  @ManyToOne(() => TableEntity, (table) => table.qrCodes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'table_id' })
  table!: TableEntity;
}
