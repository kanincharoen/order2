import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { MenuItemDto, CreateMenuItemDto, UpdateMenuItemDto } from '@shared/interfaces';

@Injectable({ providedIn: 'root' })
export class MenuApiService {
  private readonly apiUrl = `${environment.apiUrl}/menu`;

  constructor(private readonly http: HttpClient) {}

  findAll(): Observable<MenuItemDto[]> {
    return this.http.get<MenuItemDto[]>(this.apiUrl);
  }

  findOne(id: string): Observable<MenuItemDto> {
    return this.http.get<MenuItemDto>(`${this.apiUrl}/${id}`);
  }

  create(dto: CreateMenuItemDto): Observable<MenuItemDto> {
    return this.http.post<MenuItemDto>(this.apiUrl, dto);
  }

  update(id: string, dto: UpdateMenuItemDto): Observable<MenuItemDto> {
    return this.http.patch<MenuItemDto>(`${this.apiUrl}/${id}`, dto);
  }

  updateAvailability(id: string, isAvailable: boolean): Observable<MenuItemDto> {
    return this.http.patch<MenuItemDto>(`${this.apiUrl}/${id}/availability`, { isAvailable });
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
