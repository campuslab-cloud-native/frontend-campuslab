import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subject, interval, startWith, takeUntil } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { AppRole } from '../../core/models/role.model';
import { BookingService } from '../../core/services/booking.service';
import { CatalogService } from '../../core/services/catalog.service';
import { ReportService, Kpis } from '../../core/services/report.service';
import { AuditService, AuditEvent } from '../../core/services/audit.service';
import { Booking, BookingStatus } from '../../core/models/booking.model';
import { BOOKING_STEPS, STATUS_LABELS, effectiveStatus, stepIndex } from '../../core/utils/booking-time';

const MY_BOOKINGS_POLL_MS = 15000;

interface MyBookingView {
  booking: Booking;
  labName: string;
  statusLabel: string;
  step: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit, OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly bookingService = inject(BookingService);
  private readonly catalogService = inject(CatalogService);
  private readonly reportService = inject(ReportService);
  private readonly auditService = inject(AuditService);
  private readonly destroy$ = new Subject<void>();
  private resourceNames = new Map<number, string>();

  readonly isAdmin = this.auth.hasAnyRole(AppRole.Admin);
  readonly isOperator = this.auth.hasAnyRole(AppRole.Operator);
  readonly isClient = this.auth.hasAnyRole(AppRole.Client);
  readonly isAuditor = this.auth.hasAnyRole(AppRole.Auditor);
  readonly steps = BOOKING_STEPS;

  kpis = signal<Kpis | null>(null);
  kpisError = signal(false);
  kpisFromBookings = signal(false);
  pendingBookings = signal<Booking[]>([]);
  myBookings = signal<MyBookingView[]>([]);
  recentEvents = signal<AuditEvent[]>([]);

  ngOnInit(): void {
    if (this.isAdmin) {
      this.loadKpis();
    }
    if (this.isOperator) {
      this.bookingService
        .getBookings({ status: BookingStatus.EnPreparacion })
        .subscribe((bookings) => this.pendingBookings.set(bookings.slice(0, 5)));
    }
    if (this.isClient) {
      this.catalogService.getResources().subscribe({
        next: (resources) => {
          this.resourceNames = new Map(resources.map((r) => [r.id, r.name]));
          this.loadMyBookings();
        },
        error: () => {},
      });
      interval(MY_BOOKINGS_POLL_MS)
        .pipe(startWith(0), takeUntil(this.destroy$))
        .subscribe(() => this.loadMyBookings());
    }
    if (this.isAuditor) {
      this.auditService.getEvents().subscribe((events) => this.recentEvents.set(events.slice(0, 5)));
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadMyBookings(): void {
    this.bookingService.getMyBookings().subscribe({
      next: (bookings) => {
        const now = new Date();
        const views = bookings
          .map((booking) => ({ booking, status: effectiveStatus(booking, now) }))
          .filter((item) => item.status !== 'FINISHED' && item.status !== BookingStatus.Cancelada)
          .sort((a, b) => new Date(a.booking.startTime).getTime() - new Date(b.booking.startTime).getTime())
          .slice(0, 5)
          .map((item) => ({
            booking: item.booking,
            labName: this.resourceNames.get(item.booking.resourceId) ?? `Laboratorio #${item.booking.resourceId}`,
            statusLabel: STATUS_LABELS[item.status],
            step: stepIndex(item.status),
          }));
        this.myBookings.set(views);
      },
      error: () => {},
    });
  }

  private loadKpis(): void {
    this.reportService.getKpis('last24h').subscribe({
      next: (kpis) => this.kpis.set(kpis),
      error: () => this.loadKpisFromBookings(),
    });
  }

  private loadKpisFromBookings(): void {
    this.bookingService.getBookings().subscribe({
      next: (bookings) => {
        this.kpis.set(this.buildKpis(bookings));
        this.kpisFromBookings.set(true);
      },
      error: () => this.kpisError.set(true),
    });
  }

  private buildKpis(bookings: Booking[]): Kpis {
    const now = new Date();
    const dayAgo = now.getTime() - 24 * 60 * 60 * 1000;

    const recent = bookings.filter((b) => new Date(b.createdAt || b.startTime).getTime() >= dayAgo);
    const inUse = new Set(
      bookings.filter((b) => effectiveStatus(b, now) === BookingStatus.EnUso).map((b) => b.resourceId)
    );
    const durations = bookings
      .map((b) => (new Date(b.endTime).getTime() - new Date(b.startTime).getTime()) / 60000)
      .filter((minutes) => Number.isFinite(minutes) && minutes > 0);

    return {
      totalBookings: recent.length,
      bookingsPerHour: recent.length / 24,
      averageCycleTimeMinutes: durations.length
        ? durations.reduce((sum, minutes) => sum + minutes, 0) / durations.length
        : 0,
      occupiedResources: inUse.size,
    };
  }
}
