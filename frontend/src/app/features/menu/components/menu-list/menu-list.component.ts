import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MenuApiService } from '../../services/menu.service';
import { MenuItemDto } from '@shared/interfaces';

@Component({
  selector: 'app-menu-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatSnackBarModule,
  ],
  templateUrl: './menu-list.component.html',
  styles: [`
    .menu-container { padding: 24px; }
    .menu-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .category-section { margin-bottom: 32px; }
    .menu-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
    .unavailable { opacity: 0.6; }
    mat-card-actions { display: flex; align-items: center; gap: 8px; }
  `],
})
export class MenuListComponent implements OnInit {
  menuItems: MenuItemDto[] = [];
  categories: string[] = [];

  constructor(
    private readonly menuService: MenuApiService,
    private readonly snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.loadMenu();
  }

  loadMenu(): void {
    this.menuService.findAll().subscribe({
      next: (items) => {
        this.menuItems = items;
        this.categories = [...new Set(items.map((i) => i.category))].sort();
      },
      error: () => this.snackBar.open('Failed to load menu', 'Close', { duration: 3000 }),
    });
  }

  getItemsByCategory(category: string): MenuItemDto[] {
    return this.menuItems.filter((item) => item.category === category);
  }

  toggleAvailability(item: MenuItemDto): void {
    this.menuService.updateAvailability(item.id, !item.isAvailable).subscribe({
      next: () => this.loadMenu(),
      error: (err) =>
        this.snackBar.open(err.error?.message || 'Failed to update availability', 'Close', { duration: 3000 }),
    });
  }

  openCreateDialog(): void {
    const name = prompt('Item name:');
    const description = prompt('Description:') || '';
    const price = prompt('Price:');
    const category = prompt('Category:');
    if (name && price && category) {
      this.menuService
        .create({ name, description, price: +price, category })
        .subscribe({
          next: () => this.loadMenu(),
          error: (err) =>
            this.snackBar.open(err.error?.message || 'Failed to create item', 'Close', { duration: 3000 }),
        });
    }
  }

  editItem(item: MenuItemDto): void {
    const name = prompt('Name:', item.name);
    const price = prompt('Price:', String(item.price));
    if (name && price) {
      this.menuService.update(item.id, { name, price: +price }).subscribe({
        next: () => this.loadMenu(),
        error: (err) =>
          this.snackBar.open(err.error?.message || 'Failed to update item', 'Close', { duration: 3000 }),
      });
    }
  }

  deleteItem(item: MenuItemDto): void {
    if (confirm(`Delete "${item.name}"?`)) {
      this.menuService.delete(item.id).subscribe({
        next: () => this.loadMenu(),
        error: (err) =>
          this.snackBar.open(err.error?.message || 'Failed to delete item', 'Close', { duration: 3000 }),
      });
    }
  }
}
