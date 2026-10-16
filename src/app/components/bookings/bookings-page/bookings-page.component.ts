import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, interval, startWith, takeUntil } from 'rxjs';
import { BookingCreateComponent } from '../booking-create/booking-create.component';
import { BookingService } from '../../../core/services/booking.service';
import { CatalogService } from '../../../core/services/catalog.service';
import { BrowserNotificationService } from '../../../core/services/browser-notification.service';
import { AuthService } from '../../../core/auth/auth.service';
import { AppRole } from '../../../core/models/role.model';
import { Booking, BookingStatus } from '../../../core/models/booking.model';
import { DisplayStatus, effectiveStatus } from '../../../core/utils/booking-time';

const POLL_INTERVAL_MS = 20000;

const STATUS_PRIORITY: Record<BookingStatus, number> = {
  [BookingStatus.Solicitada]: 0,
  [BookingStatus.EnPreparacion]: 1,
  [BookingStatus.Aprobada]: 2,
  [BookingStatus.EnUso]: 3,
  [BookingStatus.Devuelta]: 4,
  [BookingStatus.Cancelada]: 5,
};

const STATUS_LABELS: Record<DisplayStatus, string> = {
  [BookingStatus.Solicitada]: 'Solicitada',
  [BookingStatus.Aprobada]: 'Aprobada',
  [BookingStatus.EnPreparacion]: 'En preparación',
  [BookingStatus.EnUso]: 'En uso',
  [BookingStatus.Devuelta]: 'Devuelta',
  [BookingStatus.Cancelada]: 'Cancelada',
  FINISHED: 'Terminada',
};

@Component({
  selector: 'app-bookings-page',
  standalone: true,
  imports: [CommonModule, FormsModule, BookingCreateComponent],
  templateUrl: './bookings-page.component.html',
  styleUrl: './bookings-page.component.css'
})
export class BookingsPageComponent implements OnInit, OnDestroy {
  private readonly bookingService = inject(BookingService);
  private readonly catalogService = inject(CatalogService);
  private readonly browserNotify = inject(BrowserNotificationService);
  private readonly auth = inject(AuthService);
  private readonly destroy$ = new Subject<void>();
  private previousStatuses = new Map<number, BookingStatus>();

  readonly BookingStatus = BookingStatus;
  readonly statuses = Object.values(BookingStatus);
  readonly actions = [
    { label: 'Aprobar', status: BookingStatus.Aprobada },
    { label: 'Rechazar', status: BookingStatus.Cancelada },
    { label: 'Preparar', status: BookingStatus.EnPreparacion },
    { label: 'En uso', status: BookingStatus.EnUso },
    { label: 'Completar', status: BookingStatus.Devuelta },
  ];

  bookings = signal<Booking[]>([]);
  resourceNames = signal<Map<number, string>>(new Map());
  statusFilter: BookingStatus | '' = '';

  get canManage(): boolean {
    return this.auth.hasAnyRole(AppRole.Admin, AppRole.Operator);
  }

  get canCreate(): boolean {
    return this.auth.hasAnyRole(AppRole.Client, AppRole.Operator, AppRole.Admin);
  }

  statusLabel(status: BookingStatus): string {
    return STATUS_LABELS[status];
  }

  displayStatusLabel(booking: Booking): string {
    return STATUS_LABELS[effectiveStatus(booking)];
  }

  ngOnInit(): void {
    if (!this.canManage) {
      this.browserNotify.requestPermission();
    }

    this.catalogService.getResources().subscribe((resources) => {
      this.resourceNames.set(new Map(resources.map((r) => [r.id, r.name])));
    });

    interval(POLL_INTERVAL_MS)
      .pipe(startWith(0), takeUntil(this.destroy$))
      .subscribe(() => this.load());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  load(): void {
    this.bookingService.getBookings({ status: this.statusFilter || undefined }).subscribe((bookings) => {
      const sorted = this.canManage
        ? [...bookings].sort((a, b) => STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status])
        : bookings;

      if (!this.canManage) {
        this.notifyStatusChanges(sorted);
      }
      this.bookings.set(sorted);
    });
  }

  private notifyStatusChanges(bookings: Booking[]): void {
    for (const booking of bookings) {
      const previous = this.previousStatuses.get(booking.id);
      if (previous && previous !== booking.status) {
        if (booking.status === BookingStatus.Aprobada) {
          this.browserNotify.notify('Reserva aprobada', `Tu reserva #${booking.id} fue aprobada.`);
        } else if (booking.status === BookingStatus.Cancelada) {
          this.browserNotify.notify('Reserva rechazada', `Tu reserva #${booking.id} fue rechazada.`);
        }
      }
      this.previousStatuses.set(booking.id, booking.status);
    }
  }

  resourceName(resourceId: number): string {
    return this.resourceNames().get(resourceId) ?? `#${resourceId}`;
  }

  onAction(booking: Booking, select: HTMLSelectElement): void {
    const status = select.value as BookingStatus;
    select.value = '';
    if (status) {
      this.changeStatus(booking, status);
    }
  }

  changeStatus(booking: Booking, status: BookingStatus): void {
    this.bookingService.updateStatus(booking.id, status).subscribe(() => this.load());
  }

  onBookingCreated(): void {
    this.load();
  }
}