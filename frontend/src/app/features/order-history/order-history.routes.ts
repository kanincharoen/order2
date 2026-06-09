import { Routes } from '@angular/router';

export const ORDER_HISTORY_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/order-history-list/order-history-list.component').then(
        (m) => m.OrderHistoryListComponent,
      ),
  },
];
