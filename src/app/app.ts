import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterOutlet, RouterLink } from '@angular/router';
import { MsalBroadcastService } from '@azure/msal-angular';
import { EventMessage, EventType, InteractionStatus } from '@azure/msal-browser';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { AuthService } from './core/auth/auth.service';
import { AppRole } from './core/models/role.model';

const ROLE_LABELS: Record<AppRole, string> = {
  [AppRole.Admin]: 'ADMINISTRADOR',
  [AppRole.Operator]: 'OPERADOR',
  [AppRole.Client]: 'ESTUDIANTE',
  [AppRole.Auditor]: 'AUDITOR',
};

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  isLoginPage = false;

  constructor(
    private readonly authService: AuthService,
    private readonly msalBroadcast: MsalBroadcastService,
    private readonly router: Router
  ) {}

  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn;
  }

  get roleLabel(): string {
    return this.authService.roles.map((role) => ROLE_LABELS[role]).join(' / ') || 'USUARIO';
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
    this.isLoginPage = this.router.url.startsWith('/login');

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((event) => {
        this.isLoginPage = event.urlAfterRedirects.startsWith('/login');
      });

    this.authService.handleRedirect().subscribe({
      next: () => this.authService.setActiveAccountFromCache(),
      error: (err) => console.error('Error procesando el redirect de Azure AD', err),
    });

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