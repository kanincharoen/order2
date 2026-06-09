import { Routes } from '@angular/router';

export const QR_CODE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/qr-display/qr-display.component').then(
        (m) => m.QrDisplayComponent,
      ),
  },
];
