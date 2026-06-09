import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QrCodeController } from './qr-code.controller';
import { QrPrinterConfigController } from './qr-printer-config.controller';
import { QrCodeService } from './qr-code.service';
import { QrPrinterService } from './qr-printer.service';
import { QrCode } from '../../entities/qr-code.entity';
import { QrPrinterConfig } from '../../entities/qr-printer-config.entity';
import { TableEntity } from '../../entities/table.entity';

@Module({
  imports: [TypeOrmModule.forFeature([QrCode, QrPrinterConfig, TableEntity])],
  controllers: [QrCodeController, QrPrinterConfigController],
  providers: [QrCodeService, QrPrinterService],
  exports: [QrCodeService, QrPrinterService],
})
export class QrCodeModule {}
