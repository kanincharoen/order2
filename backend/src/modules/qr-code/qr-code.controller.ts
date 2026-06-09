import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Res,
  ParseUUIDPipe,
} from '@nestjs/common';
import { Response } from 'express';
import { QrCodeService } from './qr-code.service';
import { QrPrinterService } from './qr-printer.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('qr-codes')
@UseGuards(JwtAuthGuard)
export class QrCodeController {
  constructor(
    private readonly qrCodeService: QrCodeService,
    private readonly qrPrinterService: QrPrinterService,
  ) {}

  @Post('tables/:tableId/generate')
  generateForTable(@Param('tableId', ParseUUIDPipe) tableId: string) {
    return this.qrCodeService.generateForTable(tableId);
  }

  @Post('tables/:tableId/regenerate')
  regenerateForTable(@Param('tableId', ParseUUIDPipe) tableId: string) {
    return this.qrCodeService.regenerateForTable(tableId);
  }

  @Post('tables/:tableId/print')
  async printForTable(@Param('tableId', ParseUUIDPipe) tableId: string) {
    const qrCode = await this.qrCodeService.getActiveByTableId(tableId);
    if (!qrCode) {
      return { success: false, errorMessage: 'No active QR code for this table' };
    }
    return this.qrPrinterService.print(qrCode);
  }

  @Get('tables/:tableId')
  getActiveQrCode(@Param('tableId', ParseUUIDPipe) tableId: string) {
    return this.qrCodeService.getActiveByTableId(tableId);
  }

  @Get('tables/:tableId/image')
  async getQrCodeImage(
    @Param('tableId', ParseUUIDPipe) tableId: string,
    @Res() res: Response,
  ) {
    const qrCode = await this.qrCodeService.getActiveByTableId(tableId);
    if (!qrCode) {
      res.status(404).json({ message: 'No active QR code for this table' });
      return;
    }
    const imageBuffer = await this.qrCodeService.generateQrImage(qrCode);
    res.set({
      'Content-Type': 'image/png',
      'Content-Disposition': `inline; filename="table-${tableId}-qr.png"`,
    });
    res.send(imageBuffer);
  }

  @Post('tables/:tableId/invalidate')
  invalidate(@Param('tableId', ParseUUIDPipe) tableId: string) {
    return this.qrCodeService.invalidateForTable(tableId);
  }
}
