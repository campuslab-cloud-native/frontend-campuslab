import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Subject, interval, startWith, takeUntil } from 'rxjs';
import { BookingCreateComponent } from '../booking-create/booking-create.component';
import { BookingService } from '../../../core/services/booking.service';
import { CatalogService } from '../../../core/services/catalog.service';
import { BrowserNotificationService } from '../../../core/services/browser-notification.service';
import { AuthService } from '../../../core/auth/auth.service';
import { AppRole } from '../../../core/models/role.model';
import { Booking, BookingStatus } from '../../../core/models/booking.model';
import {
  BookingAction,
  DisplayStatus,
  STATUS_LABELS,
  allowedActions,
  effectiveStatus,
  toDateKey,
} from '../../../core/utils/booking-time';
import { backendMessage } from '../../../core/utils/http-errors';

const POLL_INTERVAL_MS = 20000;

const STATUS_PRIORITY: Record<BookingStatus, number> = {
  [BookingStatus.Solicitada]: 0,
  [BookingStatus.EnPreparacion]: 1,
  [BookingStatus.PreparacionLista]: 2,
  [BookingStatus.Aprobada]: 3,
  [BookingStatus.EnUso]: 4,
  [BookingStatus.Terminada]: 5,
  [BookingStatus.Devuelta]: 6,
  [BookingStatus.Cancelada]: 7,
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
  private successTimer?: ReturnType<typeof setTimeout>;

  readonly filterOptions: DisplayStatus[] = [
    BookingStatus.Solicitada,
    BookingStatus.Aprobada,
    BookingStatus.EnPreparacion,
    BookingStatus.PreparacionLista,
    BookingStatus.EnUso,
    'FINISHED',
    BookingStatus.Cancelada,
  ];

  bookings = signal<Booking[]>([]);
  resourceNames = signal<Map<number, string>>(new Map());
  statusFilter = signal<DisplayStatus | ''>('');
  finishedDay = signal<string>(toDateKey(new Date()));
  actionError = signal<string | null>(null);
  actionSuccess = signal<string | null>(null);

  visibleBookings = computed(() => {
    const filter = this.statusFilter();
    const now = new Date();
    return this.bookings().filter((booking) => {
      const status = effectiveStatus(booking, now);
      return filter ? status === filter : status !== 'FINISHED';
    });
  });

  finishedOfDay = computed(() => {
    const day = this.finishedDay();
    const now = new Date();
    return this.bookings()
      .filter(
        (booking) =>
          effectiveStatus(booking, now) === 'FINISHED' && toDateKey(new Date(booking.endTime)) === day
      )
      .sort((a, b) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime());
  });

  get canManage(): boolean {
    return this.auth.hasAnyRole(AppRole.Admin, AppRole.Operator);
  }

  get canCreate(): boolean {
    return this.auth.hasAnyRole(AppRole.Client, AppRole.Operator, AppRole.Admin);
  }

  get columnCount(): number {
    return this.canManage ? 6 : 4;
  }

  statusLabel(status: DisplayStatus): string {
    return STATUS_LABELS[status];
  }

  displayStatusLabel(booking: Booking): string {
    return STATUS_LABELS[effectiveStatus(booking)];
  }

  actionsFor(booking: Booking): BookingAction[] {
    return allowedActions(booking);
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
    clearTimeout(this.successTimer);
    this.destroy$.next();
    this.destroy$.complete();
  }

  load(): void {
    this.bookingService.getAccessibleBookings().subscribe((bookings) => {
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
    this.actionSuccess.set(null);
    this.bookingService.updateStatus(booking.id, status).subscribe({
      next: () => {
        this.actionError.set(null);
        this.showSuccess(`Acción actualizada con éxito (reserva #${booking.id}).`);
        this.load();
      },
      error: (err: HttpErrorResponse) => {
        if (err.status === 403) {
          this.actionError.set('Tu cuenta no tiene permiso para realizar esta acción sobre la reserva.');
          return;
        }
        this.actionError.set(
          backendMessage(err) ??
            'No se pudo cambiar el estado de la reserva. Revisa que la acción corresponda a su estado actual.'
        );
      },
    });
  }

  private showSuccess(message: string): void {
    this.actionSuccess.set(message);
    clearTimeout(this.successTimer);
    this.successTimer = setTimeout(() => this.actionSuccess.set(null), 4000);
  }

  onBookingCreated(): void {
    this.showSuccess('Reserva realizada con éxito.');
    this.load();
  }
}
