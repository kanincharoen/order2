import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { OrdersApiService } from '../../../orders/services/orders.service';
import { OrderDto, PaginatedResult } from '@shared/interfaces';

@Component({
  selector: 'app-order-history-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSnackBarModule,
    MatPaginatorModule,
  ],
  templateUrl: './order-history-list.component.html',
  styles: [`
    .history-container { padding: 24px; }
    .filters { display: flex; gap: 16px; align-items: center; flex-wrap: wrap; margin-bottom: 24px; }
    .order-card { margin-bottom: 12px; }
    .error-message { color: #f44336; margin-bottom: 16px; }
    .total-sum { font-size: 18px; margin-bottom: 16px; }
    .no-results { text-align: center; padding: 32px; color: #666; }
  `],
})
export class OrderHistoryListComponent implements OnInit {
  tableNumber: number | null = null;
  startDate: string = '';
  endDate: string = '';
  currentPage = 1;
  result: PaginatedResult<OrderDto> | null = null;
  totalSum = 0;
  errorMessage = '';

  constructor(
    private readonly ordersService: OrdersApiService,
    private readonly snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.search();
  }

  search(): void {
    this.errorMessage = '';

    if (this.startDate && this.endDate && this.startDate > this.endDate) {
      this.errorMessage = 'Start date must be on or before end date';
      return;
    }

    const query: any = { page: this.currentPage, limit: 50 };
    if (this.tableNumber) query.tableNumber = this.tableNumber;
    if (this.startDate) query.startDate = this.startDate;
    if (this.endDate) query.endDate = this.endDate;

    this.ordersService.findHistory(query).subscribe({
      next: (result) => {
        this.result = result;
        this.totalSum = result.data.reduce((sum, o) => sum + Number(o.totalPrice), 0);
      },
      error: (err) => this.snackBar.open(err.error?.message || 'Search failed', 'Close', { duration: 3000 }),
    });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.search();
  }
}
