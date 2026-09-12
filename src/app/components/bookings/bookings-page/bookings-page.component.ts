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

const POLL_INTERVAL_MS = 20000;

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

  bookings = signal<Booking[]>([]);
  resourceNames = signal<Map<number, string>>(new Map());
  statusFilter: BookingStatus | '' = '';

  get canManage(): boolean {
    return this.auth.hasAnyRole(AppRole.Admin, AppRole.Operator);
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
      if (!this.canManage) {
        this.notifyStatusChanges(bookings);
      }
      this.bookings.set(bookings);
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

  changeStatus(booking: Booking, status: BookingStatus): void {
    this.bookingService.updateStatus(booking.id, status).subscribe(() => this.load());
  }

  onBookingCreated(): void {
    this.load();
  }
}