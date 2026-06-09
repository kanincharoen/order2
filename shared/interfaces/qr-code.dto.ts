import { PrinterConnectionType } from '../enums';

export interface QrCodeDto {
  id: string;
  tableId: string;
  sessionToken: string;
  orderUrl: string;
  isActive: boolean;
  generatedAt: string;
}

export interface PrintResultDto {
  success: boolean;
  attemptNumber: number; // 1-3
  errorMessage?: string;
  retriesRemaining: number;
}

export interface UpdateQrPrinterConfigDto {
  printerName: string; // max 100 characters
  connectionType: PrinterConnectionType;
  networkAddress?: string; // required if connectionType is 'network'
}

export interface QrPrinterConfigDto {
  printerName: string;
  connectionType: PrinterConnectionType;
  networkAddress?: string;
  isConnected: boolean;
}

export interface PrinterTestResultDto {
  success: boolean;
  message: string;
}
