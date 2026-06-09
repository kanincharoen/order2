import { Routes } from '@angular/router';

export const CUSTOMER_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/customer-menu/customer-menu.component').then(
        (m) => m.CustomerMenuComponent,
      ),
  },
];
