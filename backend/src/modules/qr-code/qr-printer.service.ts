import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QrPrinterConfig } from '../../entities/qr-printer-config.entity';
import { QrCode } from '../../entities/qr-code.entity';
import { PrinterConnectionType } from '@shared/enums';

export interface PrintResult {
  success: boolean;
  attemptNumber: number;
  errorMessage?: string;
  retriesRemaining: number;
}

const MAX_RETRIES = 3;
const PRINT_TIMEOUT_MS = 10000;

@Injectable()
export class QrPrinterService {
  private readonly logger = new Logger(QrPrinterService.name);

  constructor(
    @InjectRepository(QrPrinterConfig)
    private readonly configRepository: Repository<QrPrinterConfig>,
  ) {}

  async print(qrCode: QrCode, attempt: number = 1): Promise<PrintResult> {
    const config = await this.getConfig();
    if (!config) {
      return {
        success: false,
        attemptNumber: attempt,
        errorMessage: 'No printer configured',
        retriesRemaining: MAX_RETRIES - attempt,
      };
    }

    try {
      // Simulate print command with timeout
      await this.sendPrintCommand(config, qrCode);
      return {
        success: true,
        attemptNumber: attempt,
        retriesRemaining: MAX_RETRIES - attempt,
      };
    } catch (error: any) {
      this.logger.error(`Print attempt ${attempt} failed: ${error.message}`);
      return {
        success: false,
        attemptNumber: attempt,
        errorMessage: error.message || 'Print failed',
        retriesRemaining: MAX_RETRIES - attempt,
      };
    }
  }

  async retryPrint(qrCode: QrCode, attempt: number): Promise<PrintResult> {
    if (attempt > MAX_RETRIES) {
      return {
        success: false,
        attemptNumber: attempt,
        errorMessage: 'Maximum retry attempts exceeded',
        retriesRemaining: 0,
      };
    }
    return this.print(qrCode, attempt);
  }

  async getConfig(): Promise<QrPrinterConfig | null> {
    const configs = await this.configRepository.find();
    return configs.length > 0 ? configs[0] : null;
  }

  async updateConfig(dto: {
    printerName: string;
    connectionType: PrinterConnectionType;
    networkAddress?: string;
  }): Promise<QrPrinterConfig> {
    let config = await this.getConfig();
    if (!config) {
      config = this.configRepository.create(dto);
    } else {
      Object.assign(config, dto);
    }
    return this.configRepository.save(config);
  }

  async testConnection(): Promise<boolean> {
    const config = await this.getConfig();
    if (!config) return false;
    // Simulate connection test
    return true;
  }

  private async sendPrintCommand(
    config: QrPrinterConfig,
    qrCode: QrCode,
  ): Promise<void> {
    // In production, this would send actual print commands to the printer
    // based on config.connectionType (USB, Network, Bluetooth)
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Print timeout: no acknowledgment received within 10 seconds'));
      }, PRINT_TIMEOUT_MS);

      // Simulate successful print
      setTimeout(() => {
        clearTimeout(timeout);
        resolve();
      }, 100);
    });
  }
}
