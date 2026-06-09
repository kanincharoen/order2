import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { TableDto, TableStatusSummaryDto, CreateTableDto, UpdateTableDto, UpdateTableStatusDto } from '@shared/interfaces';

@Injectable({ providedIn: 'root' })
export class TablesService {
  private readonly apiUrl = `${environment.apiUrl}/tables`;

  constructor(private readonly http: HttpClient) {}

  findAll(): Observable<TableDto[]> {
    return this.http.get<TableDto[]>(this.apiUrl);
  }

  getStatusSummary(): Observable<TableStatusSummaryDto> {
    return this.http.get<TableStatusSummaryDto>(`${this.apiUrl}/summary`);
  }

  create(dto: CreateTableDto): Observable<TableDto> {
    return this.http.post<TableDto>(this.apiUrl, dto);
  }

  update(id: string, dto: UpdateTableDto): Observable<TableDto> {
    return this.http.patch<TableDto>(`${this.apiUrl}/${id}`, dto);
  }

  updateStatus(id: string, dto: UpdateTableStatusDto): Observable<TableDto> {
    return this.http.patch<TableDto>(`${this.apiUrl}/${id}/status`, dto);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
