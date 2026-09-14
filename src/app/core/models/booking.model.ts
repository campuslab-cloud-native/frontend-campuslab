export enum BookingStatus {
  Solicitada = 'REQUESTED',
  Aprobada = 'APPROVED',
  EnPreparacion = 'IN_PREPARATION',
  EnUso = 'IN_USE',
  Devuelta = 'RETURNED',
  Cancelada = 'CANCELLED'
}

export interface Booking {
  id: number;
  resourceId: number;
  userId: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  createdAt: string;
}

export interface CreateBookingRequest {
  resourceId: number;
  startTime: string;
  endTime: string;
}