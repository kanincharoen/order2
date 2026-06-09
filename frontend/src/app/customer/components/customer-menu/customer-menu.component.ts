import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { environment } from '@env/environment';

interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  specialInstructions: string;
}

@Component({
  selector: 'app-customer-menu',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatInputModule,
    MatSnackBarModule,
  ],
  templateUrl: './customer-menu.component.html',
  styles: [`
    .customer-container { padding: 24px; max-width: 600px; margin: 0 auto; }
    .category-section { margin-bottom: 24px; }
    .menu-item-card { margin-bottom: 12px; }
    .cart-section { border-top: 2px solid #eee; padding-top: 24px; margin-top: 24px; }
    .cart-item { display: flex; flex-direction: column; gap: 4px; margin-bottom: 12px; padding: 8px; background: #f9f9f9; border-radius: 4px; }
    .invalid-token { text-align: center; padding: 48px; }
  `],
})
export class CustomerMenuComponent implements OnInit {
  token = '';
  tableNumber = 0;
  menuData: any = { categories: {} };
  categoryNames: string[] = [];
  cart: CartItem[] = [];
  invalidToken = false;
  isSubmitting = false;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly http: HttpClient,
    private readonly snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.paramMap.get('token') || '';
    this.loadMenu();
  }

  get cartTotal(): number {
    return this.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  loadMenu(): void {
    this.http.get(`${environment.apiUrl}/customer/menu/${this.token}`).subscribe({
      next: (data: any) => {
        this.menuData = data;
        this.tableNumber = data.tableNumber;
        this.categoryNames = Object.keys(data.categories).sort();
      },
      error: (err) => {
        if (err.status === 410) {
          this.invalidToken = true;
        }
      },
    });
  }

  addToCart(item: any): void {
    const existing = this.cart.find((c) => c.menuItemId === item.id);
    if (existing) {
      existing.quantity++;
    } else {
      this.cart.push({
        menuItemId: item.id,
        name: item.name,
        price: item.price,
        quantity: 1,
        specialInstructions: '',
      });
    }
  }

  removeFromCart(index: number): void {
    this.cart.splice(index, 1);
  }

  placeOrder(): void {
    if (this.cart.length === 0) return;
    this.isSubmitting = true;

    const items = this.cart.map((c) => ({
      menuItemId: c.menuItemId,
      quantity: c.quantity,
      specialInstructions: c.specialInstructions || undefined,
    }));

    this.http.post(`${environment.apiUrl}/customer/orders/${this.token}`, { items }).subscribe({
      next: () => {
        this.cart = [];
        this.isSubmitting = false;
        this.snackBar.open('Order placed successfully!', 'Close', { duration: 3000 });
      },
      error: (err) => {
        this.isSubmitting = false;
        if (err.status === 410) {
          this.invalidToken = true;
        } else {
          this.snackBar.open(err.error?.message || 'Failed to place order', 'Close', { duration: 3000 });
        }
      },
    });
  }
}
