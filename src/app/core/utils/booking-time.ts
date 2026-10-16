import { Booking, BookingStatus } from '../models/booking.model';

export const MAX_BOOKING_HOURS = 2;
export const MAX_BOOKING_MS = MAX_BOOKING_HOURS * 60 * 60 * 1000;

export type DisplayStatus = BookingStatus | 'FINISHED';

const ACTIVE_STATUSES: BookingStatus[] = [
  BookingStatus.Solicitada,
  BookingStatus.Aprobada,
  BookingStatus.EnPreparacion,
  BookingStatus.EnUso,
];

const RUNNING_STATUSES: BookingStatus[] = [
  BookingStatus.Aprobada,
  BookingStatus.EnPreparacion,
  BookingStatus.EnUso,
];

export function effectiveStatus(booking: Booking, now: Date = new Date()): DisplayStatus {
  if (!RUNNING_STATUSES.includes(booking.status)) {
    return booking.status;
  }
  const start = new Date(booking.startTime).getTime();
  const end = new Date(booking.endTime).getTime();
  const current = now.getTime();
  if (current >= end) return 'FINISHED';
  if (current >= start) return BookingStatus.EnUso;
  return booking.status;
}

export function overlaps(booking: Booking, start: Date, end: Date): boolean {
  if (!ACTIVE_STATUSES.includes(booking.status)) return false;
  return new Date(booking.startTime) < end && new Date(booking.endTime) > start;
}