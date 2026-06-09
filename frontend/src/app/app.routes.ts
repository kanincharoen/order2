import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'tables', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/components/login/login.component').then(
        (m) => m.LoginComponent,
      ),
  },
  {
    path: 'tables',
    loadChildren: () =>
      import('./features/tables/tables.routes').then((m) => m.TABLES_ROUTES),
  },
  {
    path: 'menu',
    loadChildren: () =>
      import('./features/menu/menu.routes').then((m) => m.MENU_ROUTES),
  },
  {
    path: 'orders',
    loadChildren: () =>
      import('./features/orders/orders.routes').then((m) => m.ORDERS_ROUTES),
  },
  {
    path: 'history',
    loadChildren: () =>
      import('./features/order-history/order-history.routes').then(
        (m) => m.ORDER_HISTORY_ROUTES,
      ),
  },
  {
    path: 'qr',
    loadChildren: () =>
      import('./features/qr-code/qr-code.routes').then((m) => m.QR_CODE_ROUTES),
  },
  {
    path: 'customer/:token',
    loadChildren: () =>
      import('./customer/customer.routes').then((m) => m.CUSTOMER_ROUTES),
  },
];
