import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { QrCodeDto, PrintResultDto, QrPrinterConfigDto, UpdateQrPrinterConfigDto, PrinterTestResultDto } from '@shared/interfaces';

@Injectable({ providedIn: 'root' })
export class QrCodeApiService {
  private readonly apiUrl = `${environment.apiUrl}/qr-codes`;
  private readonly printerUrl = `${environment.apiUrl}/qr-printer`;

  constructor(private readonly http: HttpClient) {}

  generateForTable(tableId: string): Observable<QrCodeDto> {
    return this.http.post<QrCodeDto>(`${this.apiUrl}/tables/${tableId}/generate`, {});
  }

  regenerateForTable(tableId: string): Observable<QrCodeDto> {
    return this.http.post<QrCodeDto>(`${this.apiUrl}/tables/${tableId}/regenerate`, {});
  }

  printForTable(tableId: string): Observable<PrintResultDto> {
    return this.http.post<PrintResultDto>(`${this.apiUrl}/tables/${tableId}/print`, {});
  }

  getActiveQrCode(tableId: string): Observable<QrCodeDto | null> {
    return this.http.get<QrCodeDto | null>(`${this.apiUrl}/tables/${tableId}`);
  }

  getQrCodeImageUrl(tableId: string): string {
    return `${this.apiUrl}/tables/${tableId}/image`;
  }

  invalidate(tableId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/tables/${tableId}/invalidate`, {});
  }

  // Printer config
  getPrinterConfig(): Observable<QrPrinterConfigDto> {
    return this.http.get<QrPrinterConfigDto>(`${this.printerUrl}/config`);
  }

  updatePrinterConfig(dto: UpdateQrPrinterConfigDto): Observable<QrPrinterConfigDto> {
    return this.http.put<QrPrinterConfigDto>(`${this.printerUrl}/config`, dto);
  }

  testPrinterConnection(): Observable<PrinterTestResultDto> {
    return this.http.post<PrinterTestResultDto>(`${this.printerUrl}/test`, {});
  }
}
