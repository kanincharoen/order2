import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Subscription } from 'rxjs';
import { AuthService } from './core/auth/auth.service';
import { WebSocketService } from './core/websocket/websocket.service';
import { InactivityService } from './core/services/inactivity.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './app.component.html',
  styles: [`
    .app-shell { display: flex; flex-direction: column; height: 100%; }
    .spacer { flex: 1; }
    .app-content { flex: 1; overflow: auto; }
    .active-link { background: rgba(255,255,255,0.1); }
    .connection-indicator { display: flex; align-items: center; margin-right: 8px; }
    .connected mat-icon { color: #69f0ae; }
    .disconnected mat-icon { color: #ff5252; }
    nav a { margin: 0 4px; }
  `],
})
export class AppComponent implements OnInit, OnDestroy {
  isLoggedIn = false;
  isConnected = false;
  private subscriptions: Subscription[] = [];

  constructor(
    private readonly authService: AuthService,
    private readonly wsService: WebSocketService,
    private readonly inactivityService: InactivityService,
  ) {}

  ngOnInit(): void {
    this.subscriptions.push(
      this.authService.isLoggedIn$.subscribe((loggedIn) => {
        this.isLoggedIn = loggedIn;
        if (loggedIn) {
          this.wsService.connect();
          this.inactivityService.startMonitoring();
        } else {
          this.wsService.disconnect();
          this.inactivityService.stopMonitoring();
        }
      }),
      this.wsService.getConnectionStatus().subscribe((connected) => {
        this.isConnected = connected;
      }),
    );
  }

  logout(): void {
    this.authService.logout();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}
