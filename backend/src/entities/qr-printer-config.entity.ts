import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
} from 'typeorm';
import { PrinterConnectionType } from '@shared/enums';

@Entity('qr_printer_config')
export class QrPrinterConfig {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100, name: 'printer_name' })
  printerName!: string;

  @Column({
    type: 'enum',
    enum: PrinterConnectionType,
    name: 'connection_type',
  })
  connectionType!: PrinterConnectionType;

  @Column({ type: 'varchar', name: 'network_address', nullable: true })
  networkAddress!: string | null;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}
