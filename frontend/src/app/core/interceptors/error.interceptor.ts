import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
  HTTP_INTERCEPTORS,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(
    private readonly router: Router,
    private readonly snackBar: MatSnackBar,
  ) {}

  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler,
  ): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        switch (error.status) {
          case 0:
            // Network error
            this.snackBar.open(
              'Network error. Please check your connection.',
              'Retry',
              { duration: 5000 },
            );
            break;
          case 401:
            // Handled by auth interceptor
            break;
          case 409:
            // Conflict — show contextual message
            this.snackBar.open(
              error.error?.message || 'Conflict: resource is in use',
              'Close',
              { duration: 5000 },
            );
            break;
          case 500:
            this.snackBar.open(
              'Server error. Please try again later.',
              'Close',
              { duration: 5000 },
            );
            break;
        }
        return throwError(() => error);
      }),
    );
  }
}

export const ERROR_INTERCEPTOR_PROVIDER = {
  provide: HTTP_INTERCEPTORS,
  useClass: ErrorInterceptor,
  multi: true,
};
