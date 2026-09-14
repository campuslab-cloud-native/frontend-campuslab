import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { AppRole } from '../../core/models/role.model';
import { BookingService } from '../../core/services/booking.service';
import { ReportService, Kpis } from '../../core/services/report.service';
import { AuditService, AuditEvent } from '../../core/services/audit.service';
import { Booking, BookingStatus } from '../../core/models/booking.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly bookingService = inject(BookingService);
  private readonly reportService = inject(ReportService);
  private readonly auditService = inject(AuditService);

  readonly isAdmin = this.auth.hasAnyRole(AppRole.Admin);
  readonly isOperator = this.auth.hasAnyRole(AppRole.Operator);
  readonly isClient = this.auth.hasAnyRole(AppRole.Client);
  readonly isAuditor = this.auth.hasAnyRole(AppRole.Auditor);

  kpis = signal<Kpis | null>(null);
  pendingBookings = signal<Booking[]>([]);
  myBookings = signal<Booking[]>([]);
  recentEvents = signal<AuditEvent[]>([]);

  ngOnInit(): void {
    if (this.isAdmin) {
      this.reportService.getKpis('last24h').subscribe((kpis) => this.kpis.set(kpis));
    }
    if (this.isOperator) {
      this.bookingService
        .getBookings({ status: BookingStatus.EnPreparacion })
        .subscribe((bookings) => this.pendingBookings.set(bookings.slice(0, 5)));
    }
    if (this.isClient) {
      this.bookingService.getBookings().subscribe((bookings) => this.myBookings.set(bookings.slice(0, 5)));
    }
    if (this.isAuditor) {
      this.auditService.getEvents().subscribe((events) => this.recentEvents.set(events.slice(0, 5)));
    }
  }
}