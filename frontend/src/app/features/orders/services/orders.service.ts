import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import {
  OrderDto,
  OrderDetailDto,
  CreateOrderDto,
  UpdateOrderStatusDto,
  CreateOrderItemDto,
  UpdateOrderItemDto,
  OrderHistoryQueryDto,
  PaginatedResult,
} from '@shared/interfaces';

@Injectable({ providedIn: 'root' })
export class OrdersApiService {
  private readonly apiUrl = `${environment.apiUrl}/orders`;

  constructor(private readonly http: HttpClient) {}

  findActive(): Observable<OrderDto[]> {
    return this.http.get<OrderDto[]>(this.apiUrl);
  }

  findHistory(query: OrderHistoryQueryDto): Observable<PaginatedResult<OrderDto>> {
    const params: any = {};
    if (query.tableNumber) params.tableNumber = query.tableNumber;
    if (query.startDate) params.startDate = query.startDate;
    if (query.endDate) params.endDate = query.endDate;
    if (query.page) params.page = query.page;
    if (query.limit) params.limit = query.limit;
    return this.http.get<PaginatedResult<OrderDto>>(`${this.apiUrl}/history`, { params });
  }

  findOne(id: string): Observable<OrderDetailDto> {
    return this.http.get<OrderDetailDto>(`${this.apiUrl}/${id}`);
  }

  create(dto: CreateOrderDto): Observable<OrderDto> {
    return this.http.post<OrderDto>(this.apiUrl, dto);
  }

  updateStatus(id: string, dto: UpdateOrderStatusDto): Observable<OrderDto> {
    return this.http.patch<OrderDto>(`${this.apiUrl}/${id}/status`, dto);
  }

  addItem(orderId: string, dto: CreateOrderItemDto): Observable<OrderDto> {
    return this.http.post<OrderDto>(`${this.apiUrl}/${orderId}/items`, dto);
  }

  updateItem(orderId: string, itemId: string, dto: UpdateOrderItemDto): Observable<OrderDto> {
    return this.http.patch<OrderDto>(`${this.apiUrl}/${orderId}/items/${itemId}`, dto);
  }

  removeItem(orderId: string, itemId: string): Observable<OrderDto> {
    return this.http.delete<OrderDto>(`${this.apiUrl}/${orderId}/items/${itemId}`);
  }
}
