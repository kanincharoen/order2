import { Routes } from '@angular/router';

export const TABLES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/table-list/table-list.component').then(
        (m) => m.TableListComponent,
      ),
  },
];
