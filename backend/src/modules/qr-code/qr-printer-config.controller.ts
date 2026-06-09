import { Controller, Get, Put, Post, Body, UseGuards } from '@nestjs/common';
import { QrPrinterService } from './qr-printer.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IsString, MaxLength, IsEnum, IsOptional } from 'class-validator';
import { PrinterConnectionType } from '@shared/enums';

class UpdateQrPrinterConfigDto {
  @IsString()
  @MaxLength(100)
  printerName!: string;

  @IsEnum(PrinterConnectionType)
  connectionType!: PrinterConnectionType;

  @IsOptional()
  @IsString()
  networkAddress?: string;
}

@Controller('qr-printer')
@UseGuards(JwtAuthGuard)
export class QrPrinterConfigController {
  constructor(private readonly printerService: QrPrinterService) {}

  @Get('config')
  getConfig() {
    return this.printerService.getConfig();
  }

  @Put('config')
  updateConfig(@Body() dto: UpdateQrPrinterConfigDto) {
    return this.printerService.updateConfig(dto);
  }

  @Post('test')
  async testConnection() {
    const success = await this.printerService.testConnection();
    return {
      success,
      message: success ? 'Connection successful' : 'Connection failed',
    };
  }
}
