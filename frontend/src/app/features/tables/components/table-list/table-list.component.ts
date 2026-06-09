import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TablesService } from '../../services/tables.service';
import { TableDto, TableStatusSummaryDto } from '@shared/interfaces';
import { TableStatus } from '@shared/enums';
import { VALID_TABLE_TRANSITIONS } from '@shared/transitions';

@Component({
  selector: 'app-table-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDialogModule,
    MatSnackBarModule,
  ],
  templateUrl: './table-list.component.html',
  styles: [`
    .tables-container { padding: 24px; }
    .tables-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .status-summary { margin-bottom: 24px; }
    .tables-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
    .table-card { transition: box-shadow 0.2s; }
    .status-available { border-left: 4px solid #4caf50; }
    .status-occupied { border-left: 4px solid #f44336; }
    .status-reserved { border-left: 4px solid #ff9800; }
    .status-needs_cleaning { border-left: 4px solid #9e9e9e; }
    .status-badge { padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 500; }
    .badge-available { background: #e8f5e9; color: #2e7d32; }
    .badge-occupied { background: #ffebee; color: #c62828; }
    .badge-reserved { background: #fff3e0; color: #e65100; }
    .badge-needs_cleaning { background: #f5f5f5; color: #424242; }
  `],
})
export class TableListComponent implements OnInit {
  tables: TableDto[] = [];
  summary: TableStatusSummaryDto | null = null;

  constructor(
    private readonly tablesService: TablesService,
    private readonly dialog: MatDialog,
    private readonly snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.loadTables();
    this.loadSummary();
  }

  loadTables(): void {
    this.tablesService.findAll().subscribe({
      next: (tables) => (this.tables = tables),
      error: () => this.snackBar.open('Failed to load tables', 'Close', { duration: 3000 }),
    });
  }

  loadSummary(): void {
    this.tablesService.getStatusSummary().subscribe({
      next: (summary) => (this.summary = summary),
    });
  }

  getValidTransitions(status: TableStatus): TableStatus[] {
    return VALID_TABLE_TRANSITIONS[status] || [];
  }

  formatStatus(status: string): string {
    return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }

  changeStatus(table: TableDto, newStatus: TableStatus): void {
    this.tablesService.updateStatus(table.id, { status: newStatus }).subscribe({
      next: () => {
        this.loadTables();
        this.loadSummary();
      },
      error: (err) =>
        this.snackBar.open(err.error?.message || 'Failed to update status', 'Close', { duration: 3000 }),
    });
  }

  openCreateDialog(): void {
    // Placeholder — will be fully implemented in integration task
    const tableNumber = prompt('Enter table number (1-999):');
    const capacity = prompt('Enter seating capacity (1-20):');
    if (tableNumber && capacity) {
      this.tablesService
        .create({ tableNumber: +tableNumber, seatingCapacity: +capacity })
        .subscribe({
          next: () => {
            this.loadTables();
            this.loadSummary();
          },
          error: (err) =>
            this.snackBar.open(err.error?.message || 'Failed to create table', 'Close', { duration: 3000 }),
        });
    }
  }

  editTable(table: TableDto): void {
    const capacity = prompt('Enter new seating capacity (1-20):', String(table.seatingCapacity));
    if (capacity) {
      this.tablesService.update(table.id, { seatingCapacity: +capacity }).subscribe({
        next: () => this.loadTables(),
        error: (err) =>
          this.snackBar.open(err.error?.message || 'Failed to update table', 'Close', { duration: 3000 }),
      });
    }
  }

  deleteTable(table: TableDto): void {
    if (confirm(`Delete table ${table.tableNumber}?`)) {
      this.tablesService.delete(table.id).subscribe({
        next: () => {
          this.loadTables();
          this.loadSummary();
        },
        error: (err) =>
          this.snackBar.open(err.error?.message || 'Failed to delete table', 'Close', { duration: 3000 }),
      });
    }
  }
}
