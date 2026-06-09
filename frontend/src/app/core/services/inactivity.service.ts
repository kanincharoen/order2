import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { Subject, fromEvent, merge, Subscription } from 'rxjs';
import { throttleTime } from 'rxjs/operators';

const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const THROTTLE_MS = 1000; // check activity every 1 second max

@Injectable({ providedIn: 'root' })
export class InactivityService implements OnDestroy {
  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  private activitySubscription: Subscription | null = null;
  private readonly inactivityTimeout$ = new Subject<void>();

  constructor(
    private readonly authService: AuthService,
    private readonly ngZone: NgZone,
  ) {}

  startMonitoring(): void {
    this.stopMonitoring();

    // Listen for user activity events outside Angular zone for performance
    this.ngZone.runOutsideAngular(() => {
      const activityEvents$ = merge(
        fromEvent(document, 'mousemove'),
        fromEvent(document, 'keydown'),
        fromEvent(document, 'mousedown'),
        fromEvent(document, 'touchstart'),
        fromEvent(document, 'scroll'),
      ).pipe(throttleTime(THROTTLE_MS));

      this.activitySubscription = activityEvents$.subscribe(() => {
        this.resetTimer();
      });

      this.resetTimer();
    });
  }

  stopMonitoring(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    if (this.activitySubscription) {
      this.activitySubscription.unsubscribe();
      this.activitySubscription = null;
    }
  }

  get onInactivityTimeout$() {
    return this.inactivityTimeout$.asObservable();
  }

  private resetTimer(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    this.timeoutId = setTimeout(() => {
      this.ngZone.run(() => {
        this.inactivityTimeout$.next();
        this.authService.logout();
      });
    }, INACTIVITY_TIMEOUT_MS);
  }

  ngOnDestroy(): void {
    this.stopMonitoring();
    this.inactivityTimeout$.complete();
  }
}
