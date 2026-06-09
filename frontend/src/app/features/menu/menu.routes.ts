import { Routes } from '@angular/router';

export const MENU_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/menu-list/menu-list.component').then(
        (m) => m.MenuListComponent,
      ),
  },
];
