export enum BookingStatus {
  Solicitada = 'SOLICITADA',
  Aprobada = 'APROBADA',
  EnPreparacion = 'EN_PREPARACION',
  EnUso = 'EN_USO',
  Devuelta = 'DEVUELTA',
  Cancelada = 'CANCELADA'
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