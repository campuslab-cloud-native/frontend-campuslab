import { Booking, BookingStatus } from '../models/booking.model';

export const MAX_BOOKING_HOURS = 2;
export const MAX_BOOKING_MS = MAX_BOOKING_HOURS * 60 * 60 * 1000;

// El backend pasa APPROVED -> IN_PREPARATION 30 minutos antes del inicio.
export const PREP_BUFFER_MINUTES = 30;

export type DisplayStatus = BookingStatus | 'FINISHED';

export interface BookingAction {
  label: string;
  status: BookingStatus;
}

export const STATUS_LABELS: Record<DisplayStatus, string> = {
  [BookingStatus.Solicitada]: 'Solicitada',
  [BookingStatus.Aprobada]: 'Aprobada',
  [BookingStatus.EnPreparacion]: 'En preparación',
  [BookingStatus.EnUso]: 'En uso',
  [BookingStatus.Devuelta]: 'Devuelta',
  [BookingStatus.Cancelada]: 'Cancelada',
  FINISHED: 'Devuelta',
};

export const BOOKING_STEPS: { status: DisplayStatus; label: string }[] = [
  { status: BookingStatus.Solicitada, label: 'Solicitada' },
  { status: BookingStatus.Aprobada, label: 'Aprobada' },
  { status: BookingStatus.EnPreparacion, label: 'En preparación' },
  { status: BookingStatus.EnUso, label: 'En uso' },
  { status: 'FINISHED', label: 'Devuelta' },
];

const ACTIVE_STATUSES: BookingStatus[] = [
  BookingStatus.Solicitada,
  BookingStatus.Aprobada,
  BookingStatus.EnPreparacion,
  BookingStatus.EnUso,
];

const pad = (n: number): string => String(n).padStart(2, '0');

export function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function toLocalInput(date: Date): string {
  return `${toDateKey(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function stepIndex(status: DisplayStatus): number {
  const index = BOOKING_STEPS.findIndex((step) => step.status === status);
  return index < 0 ? 0 : index;
}

// Una reserva solo termina cuando el backend la marca RETURNED: una reserva IN_USE
// sigue en uso (y con su cupo tomado) hasta que se registre la devolución.
export function effectiveStatus(booking: Booking, _now: Date = new Date()): DisplayStatus {
  return booking.status === BookingStatus.Devuelta ? 'FINISHED' : booking.status;
}

export function countsAsCupo(booking: Booking, _now: Date = new Date()): boolean {
  return ACTIVE_STATUSES.includes(booking.status);
}

// El administrador puede dejar la reserva en cualquier estado (endpoint admin-status).
export function adminActions(booking: Booking): BookingAction[] {
  return Object.values(BookingStatus)
    .filter((status) => status !== booking.status)
    .map((status) => ({ label: `Pasar a ${STATUS_LABELS[status].toLowerCase()}`, status }));
}

export function allowedActions(booking: Booking, now: Date = new Date()): BookingAction[] {
  if (booking.status === BookingStatus.EnUso) {
    return [{ label: 'Registrar devolución', status: BookingStatus.Devuelta }];
  }
  if (now.getTime() >= new Date(booking.startTime).getTime()) return [];

  switch (booking.status) {
    case BookingStatus.Solicitada:
      return [
        { label: 'Aprobar', status: BookingStatus.Aprobada },
        { label: 'Rechazar', status: BookingStatus.Cancelada },
      ];
    case BookingStatus.Aprobada:
    case BookingStatus.EnPreparacion:
      return [{ label: 'Cancelar', status: BookingStatus.Cancelada }];
    default:
      return [];
  }
}
