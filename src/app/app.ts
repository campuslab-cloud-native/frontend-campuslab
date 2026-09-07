import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink } from '@angular/router';
import { MsalBroadcastService, MsalService } from '@azure/msal-angular';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {
  isLoggedIn = false;
  userDisplayName: string | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private msalService: MsalService,
    private msalBroadcast: MsalBroadcastService
  ) {}

  ngOnInit(): void {
    this.msalBroadcast.msalSubject$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.checkLoggedIn();
      });
    this.checkLoggedIn();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private checkLoggedIn(): void {
    const accounts = this.msalService.instance.getAllAccounts();
    this.isLoggedIn = accounts.length > 0;
    if (this.isLoggedIn && accounts[0]) {
      this.userDisplayName = accounts[0].name || accounts[0].username || null;
    }
  }

  login(): void {
    this.msalService.loginPopup().subscribe({
      next: () => this.checkLoggedIn(),
      error: (err) => console.error('Login error:', err),
    });
  }

  logout(): void {
    this.msalService.logout();
  }
}
