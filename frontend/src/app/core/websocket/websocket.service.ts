import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '@env/environment';
import { AuthService } from '../auth/auth.service';

@Injectable({ providedIn: 'root' })
export class WebSocketService implements OnDestroy {
  private socket: Socket | null = null;
  private connectionStatus$ = new BehaviorSubject<boolean>(false);

  private tableStatusChange$ = new Subject<any>();
  private orderStatusChange$ = new Subject<any>();
  private orderCreated$ = new Subject<any>();
  private menuItemChange$ = new Subject<any>();
  private qrGenerated$ = new Subject<any>();
  private qrInvalidated$ = new Subject<any>();

  constructor(private readonly authService: AuthService) {}

  connect(): void {
    if (this.socket?.connected) return;

    const token = this.authService.accessToken;
    this.socket = io(environment.wsUrl, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30000,
    });

    this.socket.on('connect', () => {
      this.connectionStatus$.next(true);
      this.requestSync();
    });

    this.socket.on('disconnect', () => {
      this.connectionStatus$.next(false);
    });

    this.socket.on('table:status_changed', (data: any) => {
      this.tableStatusChange$.next(data);
    });

    this.socket.on('order:status_changed', (data: any) => {
      this.orderStatusChange$.next(data);
    });

    this.socket.on('order:created', (data: any) => {
      this.orderCreated$.next(data);
    });

    this.socket.on('menu:item_changed', (data: any) => {
      this.menuItemChange$.next(data);
    });

    this.socket.on('qr:generated', (data: any) => {
      this.qrGenerated$.next(data);
    });

    this.socket.on('qr:invalidated', (data: any) => {
      this.qrInvalidated$.next(data);
    });
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
    this.connectionStatus$.next(false);
  }

  requestSync(): void {
    this.socket?.emit('sync');
  }

  onTableStatusChange(): Observable<any> {
    return this.tableStatusChange$.asObservable();
  }

  onOrderStatusChange(): Observable<any> {
    return this.orderStatusChange$.asObservable();
  }

  onOrderCreated(): Observable<any> {
    return this.orderCreated$.asObservable();
  }

  onMenuItemChange(): Observable<any> {
    return this.menuItemChange$.asObservable();
  }

  onQrGenerated(): Observable<any> {
    return this.qrGenerated$.asObservable();
  }

  onQrInvalidated(): Observable<any> {
    return this.qrInvalidated$.asObservable();
  }

  getConnectionStatus(): Observable<boolean> {
    return this.connectionStatus$.asObservable();
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
