import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { QrCodeApiService } from '../../services/qr-code.service';
import { TablesService } from '../../../tables/services/tables.service';
import { QrCodeDto, PrintResultDto, TableDto, PrinterTestResultDto } from '@shared/interfaces';
import { TableStatus } from '@shared/enums';
import { PrinterConnectionType } from '@shared/enums';

@Component({
  selector: 'app-qr-display',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatSnackBarModule,
  ],
  templateUrl: './qr-display.component.html',
  styles: [`
    .qr-container { padding: 24px; max-width: 800px; }
    .qr-header { margin-bottom: 24px; }
    .table-selector { margin-bottom: 24px; }
    .qr-display-section { margin-bottom: 24px; }
    .qr-image-container { text-align: center; margin: 16px 0; }
    .qr-image { width: 250px; height: 250px; border: 1px solid #ddd; border-radius: 8px; }
    .qr-url { font-size: 12px; word-break: break-all; color: #666; }
    .qr-status { margin-top: 8px; }
    .generate-section { margin-bottom: 24px; }
    .print-status { margin: 16px 0; }
    .print-success { border-left: 4px solid #4caf50; }
    .print-error { border-left: 4px solid #f44336; }
    .print-status mat-card-content { display: flex; align-items: center; gap: 8px; }
    .printer-config-section { margin-top: 32px; }
    .full-width { width: 100%; }
    .config-actions { display: flex; gap: 12px; margin-top: 8px; }
    .test-result { display: flex; align-items: center; gap: 8px; margin-top: 12px; padding: 8px; border-radius: 4px; }
    .test-success { background: #e8f5e9; color: #2e7d32; }
    .test-error { background: #ffebee; color: #c62828; }
    .empty-state { text-align: center; padding: 32px; color: #666; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; }
    mat-card-actions { display: flex; flex-wrap: wrap; gap: 8px; }
  `],
})
export class QrDisplayComponent implements OnInit {
  occupiedTables: TableDto[] = [];
  selectedTableId: string | null = null;
  activeQrCode: QrCodeDto | null = null;
  qrImageUrl: string | null = null;
  printResult: PrintResultDto | null = null;
  printerTestResult: PrinterTestResultDto | null = null;

  printerConfig = {
    printerName: '',
    connectionType: 'usb' as string,
    networkAddress: '',
  };

  constructor(
    private readonly qrCodeService: QrCodeApiService,
    private readonly tablesService: TablesService,
    private readonly snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.loadOccupiedTables();
    this.loadPrinterConfig();
  }

  loadOccupiedTables(): void {
    this.tablesService.findAll().subscribe({
      next: (tables) => {
        this.occupiedTables = tables.filter((t) => t.status === TableStatus.OCCUPIED);
      },
    });
  }

  onTableSelected(): void {
    this.activeQrCode = null;
    this.qrImageUrl = null;
    this.printResult = null;
    if (this.selectedTableId) {
      this.loadActiveQrCode();
    }
  }

  loadActiveQrCode(): void {
    if (!this.selectedTableId) return;
    this.qrCodeService.getActiveQrCode(this.selectedTableId).subscribe({
      next: (qrCode) => {
        this.activeQrCode = qrCode;
        if (qrCode) {
          this.qrImageUrl = this.qrCodeService.getQrCodeImageUrl(this.selectedTableId!);
        }
      },
      error: () => {
        this.activeQrCode = null;
        this.qrImageUrl = null;
      },
    });
  }

  getSelectedTableNumber(): number {
    const table = this.occupiedTables.find((t) => t.id === this.selectedTableId);
    return table?.tableNumber || 0;
  }

  generateQrCode(): void {
    if (!this.selectedTableId) return;
    this.qrCodeService.generateForTable(this.selectedTableId).subscribe({
      next: (qrCode) => {
        this.activeQrCode = qrCode;
        this.qrImageUrl = this.qrCodeService.getQrCodeImageUrl(this.selectedTableId!);
        this.snackBar.open('QR code generated successfully', 'Close', { duration: 3000 });
      },
      error: (err) => {
        this.snackBar.open(err.error?.message || 'Failed to generate QR code', 'Close', { duration: 3000 });
      },
    });
  }

  regenerateQrCode(): void {
    if (!this.selectedTableId) return;
    this.qrCodeService.regenerateForTable(this.selectedTableId).subscribe({
      next: (qrCode) => {
        this.activeQrCode = qrCode;
        this.qrImageUrl = this.qrCodeService.getQrCodeImageUrl(this.selectedTableId!) + '?t=' + Date.now();
        this.snackBar.open('QR code regenerated (previous invalidated)', 'Close', { duration: 3000 });
      },
      error: (err) => {
        this.snackBar.open(err.error?.message || 'Failed to regenerate', 'Close', { duration: 3000 });
      },
    });
  }

  invalidateQrCode(): void {
    if (!this.selectedTableId) return;
    this.qrCodeService.invalidate(this.selectedTableId).subscribe({
      next: () => {
        this.activeQrCode = null;
        this.qrImageUrl = null;
        this.snackBar.open('QR code invalidated', 'Close', { duration: 3000 });
      },
      error: (err) => {
        this.snackBar.open(err.error?.message || 'Failed to invalidate', 'Close', { duration: 3000 });
      },
    });
  }

  printQrCode(): void {
    if (!this.selectedTableId) return;
    this.qrCodeService.printForTable(this.selectedTableId).subscribe({
      next: (result) => {
        this.printResult = result;
      },
      error: (err) => {
        this.printResult = {
          success: false,
          attemptNumber: 1,
          errorMessage: err.error?.message || 'Print request failed',
          retriesRemaining: 2,
        };
      },
    });
  }

  downloadQrImage(): void {
    if (!this.qrImageUrl) return;
    const link = document.createElement('a');
    link.href = this.qrImageUrl;
    link.download = `table-${this.getSelectedTableNumber()}-qr.png`;
    link.click();
  }

  loadPrinterConfig(): void {
    this.qrCodeService.getPrinterConfig().subscribe({
      next: (config) => {
        if (config) {
          this.printerConfig.printerName = config.printerName || '';
          this.printerConfig.connectionType = config.connectionType || 'usb';
          this.printerConfig.networkAddress = config.networkAddress || '';
        }
      },
      error: () => {}, // No config yet, use defaults
    });
  }

  savePrinterConfig(): void {
    const dto = {
      printerName: this.printerConfig.printerName,
      connectionType: this.printerConfig.connectionType as PrinterConnectionType,
      networkAddress: this.printerConfig.connectionType === 'network' ? this.printerConfig.networkAddress : undefined,
    };
    this.qrCodeService.updatePrinterConfig(dto).subscribe({
      next: () => {
        this.snackBar.open('Printer configuration saved', 'Close', { duration: 3000 });
      },
      error: (err) => {
        this.snackBar.open(err.error?.message || 'Failed to save config', 'Close', { duration: 3000 });
      },
    });
  }

  testPrinterConnection(): void {
    this.printerTestResult = null;
    this.qrCodeService.testPrinterConnection().subscribe({
      next: (result) => {
        this.printerTestResult = result;
      },
      error: () => {
        this.printerTestResult = { success: false, message: 'Connection test failed' };
      },
    });
  }
}
