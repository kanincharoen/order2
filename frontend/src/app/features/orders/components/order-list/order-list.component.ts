import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { OrdersApiService } from '../../services/orders.service';
import { TablesService } from '../../../tables/services/tables.service';
import { WebSocketService } from '../../../../core/websocket/websocket.service';
import { OrderDto } from '@shared/interfaces';
import { OrderStatus, TableStatus } from '@shared/enums';
import { VALID_ORDER_TRANSITIONS } from '@shared/transitions';

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatSnackBarModule,
  ],
  templateUrl: './order-list.component.html',
  styles: [`
    .orders-container { padding: 24px; }
    .orders-header { margin-bottom: 24px; }
    .orders-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
    .order-card { transition: box-shadow 0.2s; }
    .status-pending { border-left: 4px solid #2196f3; }
    .status-in_progress { border-left: 4px solid #ff9800; }
    .status-ready { border-left: 4px solid #4caf50; }
    .status-served { border-left: 4px solid #9c27b0; }
    .status-badge { padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 500; }
    .badge-pending { background: #e3f2fd; color: #1565c0; }
    .badge-in_progress { background: #fff3e0; color: #e65100; }
    .badge-ready { background: #e8f5e9; color: #2e7d32; }
    .badge-served { background: #f3e5f5; color: #6a1b9a; }
    .elapsed-time { font-size: 12px; color: #666; margin-top: 8px; }
    .empty-state { text-align: center; padding: 48px; color: #666; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; }
  `],
})
export class OrderListComponent implements OnInit, OnDestroy {
  orders: OrderDto[] = [];
  private subscriptions: Subscription[] = [];

  constructor(
    private readonly ordersService: OrdersApiService,
    private readonly tablesService: TablesService,
    private readonly wsService: WebSocketService,
    private readonly snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.loadOrders();

    // Listen for real-time order events
    this.subscriptions.push(
      this.wsService.onOrderCreated().subscribe(() => this.loadOrders()),
      this.wsService.onOrderStatusChange().subscribe(() => this.loadOrders()),
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  loadOrders(): void {
    this.ordersService.findActive().subscribe({
      next: (orders) => (this.orders = orders),
      error: () => this.snackBar.open('Failed to load orders', 'Close', { duration: 3000 }),
    });
  }

  getValidTransitions(status: OrderStatus): OrderStatus[] {
    return VALID_ORDER_TRANSITIONS[status] || [];
  }

  formatStatus(status: string): string {
    return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }

  changeStatus(order: OrderDto, newStatus: OrderStatus): void {
    if (newStatus === OrderStatus.CANCELLED) {
      const reason = prompt('Please provide a cancellation reason (1-200 chars):');
      if (!reason || reason.length === 0 || reason.length > 200) {
        this.snackBar.open('Cancellation reason is required (1-200 chars)', 'Close', { duration: 3000 });
        return;
      }
      this.ordersService.updateStatus(order.id, { status: newStatus, cancellationReason: reason }).subscribe({
        next: (updatedOrder) => {
          this.loadOrders();
          this.checkAllOrdersCompleted(order.tableId);
        },
        error: (err) => this.snackBar.open(err.error?.message || 'Failed', 'Close', { duration: 3000 }),
      });
    } else {
      this.ordersService.updateStatus(order.id, { status: newStatus }).subscribe({
        next: (updatedOrder) => {
          this.loadOrders();
          // Req 5.5: Check if all orders for this table are now completed
          if (newStatus === OrderStatus.COMPLETED) {
            this.checkAllOrdersCompleted(order.tableId);
          }
        },
        error: (err) => this.snackBar.open(err.error?.message || 'Failed', 'Close', { duration: 3000 }),
      });
    }
  }

  private checkAllOrdersCompleted(tableId: string): void {
    // Check if any remaining active orders for this table
    const activeForTable = this.orders.filter(
      (o) => o.tableId === tableId &&
        o.status !== OrderStatus.COMPLETED &&
        o.status !== OrderStatus.CANCELLED
    );

    if (activeForTable.length === 0) {
      // All orders are done — show non-blocking suggestion
      const snackRef = this.snackBar.open(
        `All orders for Table ${this.getTableNumber(tableId)} are complete. Change table to Needs Cleaning?`,
        'Change',
        { duration: 10000 },
      );
      snackRef.onAction().subscribe(() => {
        this.tablesService.updateStatus(tableId, { status: TableStatus.NEEDS_CLEANING }).subscribe({
          next: () => this.snackBar.open('Table status updated', 'Close', { duration: 2000 }),
          error: (err) => this.snackBar.open(err.error?.message || 'Failed', 'Close', { duration: 3000 }),
        });
      });
    }
  }

  private getTableNumber(tableId: string): number {
    const order = this.orders.find((o) => o.tableId === tableId);
    return order?.tableNumber || 0;
  }
}
