import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as QRCode from 'qrcode';
import { QrCode } from '../../entities/qr-code.entity';
import { TableEntity } from '../../entities/table.entity';
import { TableStatus } from '@shared/enums';

@Injectable()
export class QrCodeService {
  constructor(
    @InjectRepository(QrCode)
    private readonly qrCodeRepository: Repository<QrCode>,
    @InjectRepository(TableEntity)
    private readonly tableRepository: Repository<TableEntity>,
    private readonly configService: ConfigService,
  ) {}

  async generateForTable(tableId: string): Promise<QrCode> {
    const table = await this.tableRepository.findOne({ where: { id: tableId } });
    if (!table) {
      throw new NotFoundException('Table not found');
    }
    if (table.status !== TableStatus.OCCUPIED) {
      throw new BadRequestException('QR codes can only be generated for occupied tables');
    }

    // Generate unique session token
    const sessionToken = this.generateSessionToken();
    const baseUrl = this.configService.get<string>('APP_BASE_URL', 'http://localhost:4200');
    const orderUrl = `${baseUrl}/customer/${sessionToken}`;

    const qrCode = this.qrCodeRepository.create({
      tableId,
      sessionToken,
      orderUrl,
      isActive: true,
      generatedAt: new Date(),
    });

    return this.qrCodeRepository.save(qrCode);
  }

  async regenerateForTable(tableId: string): Promise<QrCode> {
    // Invalidate existing active QR code
    await this.invalidateForTable(tableId);
    return this.generateForTable(tableId);
  }

  async invalidateForTable(tableId: string): Promise<void> {
    const activeCode = await this.qrCodeRepository.findOne({
      where: { tableId, isActive: true },
    });
    if (activeCode) {
      activeCode.isActive = false;
      activeCode.invalidatedAt = new Date();
      await this.qrCodeRepository.save(activeCode);
    }
  }

  async getActiveByTableId(tableId: string): Promise<QrCode | null> {
    return this.qrCodeRepository.findOne({
      where: { tableId, isActive: true },
    });
  }

  async validateSessionToken(token: string): Promise<{ valid: boolean; tableId?: string }> {
    const qrCode = await this.qrCodeRepository.findOne({
      where: { sessionToken: token },
    });

    if (!qrCode || !qrCode.isActive) {
      return { valid: false };
    }

    return { valid: true, tableId: qrCode.tableId };
  }

  async generateQrImage(qrCode: QrCode): Promise<Buffer> {
    return QRCode.toBuffer(qrCode.orderUrl, {
      type: 'png',
      width: 300,
      margin: 2,
    });
  }

  generateSessionToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}
