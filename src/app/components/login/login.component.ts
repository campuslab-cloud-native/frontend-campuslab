import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MsalService } from '@azure/msal-angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  constructor(private msalService: MsalService, private router: Router) {}

  login(): void {
    this.msalService.loginPopup().subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => console.error('Login error:', err),
    });
  }
}