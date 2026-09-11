import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink } from '@angular/router';
import { MsalBroadcastService } from '@azure/msal-angular';
import { EventMessage, EventType, InteractionStatus } from '@azure/msal-browser';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { AuthService } from './core/auth/auth.service';
import { AppRole } from './core/models/role.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly authService: AuthService,
    private readonly msalBroadcast: MsalBroadcastService
  ) {}

  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn;
  }

  get userDisplayName(): string {
    return this.authService.displayName;
  }

  get canSeeCatalog(): boolean {
    return this.authService.hasAnyRole(AppRole.Admin, AppRole.Operator);
  }

  get canSeeReports(): boolean {
    return this.authService.hasAnyRole(AppRole.Admin);
  }

  get canSeeAudit(): boolean {
    return this.authService.hasAnyRole(AppRole.Admin, AppRole.Auditor);
  }

  ngOnInit(): void {
    this.msalBroadcast.inProgress$
      .pipe(
        filter((status) => status === InteractionStatus.None),
        takeUntil(this.destroy$)
      )
      .subscribe(() => this.authService.setActiveAccountFromCache());

    this.msalBroadcast.msalSubject$
      .pipe(
        filter((msg: EventMessage) => msg.eventType === EventType.LOGIN_SUCCESS),
        takeUntil(this.destroy$)
      )
      .subscribe(() => this.authService.setActiveAccountFromCache());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  login(): void {
    this.authService.login();
  }

  logout(): void {
    this.authService.logout();
  }
}