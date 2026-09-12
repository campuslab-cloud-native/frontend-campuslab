import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Booking, BookingStatus, CreateBookingRequest } from '../models/booking.model';

export interface BookingFilters {
  status?: BookingStatus;
  from?: string;
  to?: string;
}

@Injectable({ providedIn: 'root' })
export class BookingService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/bookings`;

  
  getBookings(filters: BookingFilters = {}): Observable<Booking[]> {
    let params = new HttpParams();
    if (filters.status) params = params.set('status', filters.status);
    if (filters.from) params = params.set('from', filters.from);
    if (filters.to) params = params.set('to', filters.to);
    return this.http.get<Booking[]>(this.baseUrl, { params });
  }

  createBooking(request: CreateBookingRequest): Observable<Booking> {
    return this.http.post<Booking>(this.baseUrl, request);
  }

  updateStatus(bookingId: number, status: BookingStatus): Observable<Booking> {
    return this.http.put<Booking>(`${this.baseUrl}/${bookingId}/status`, { status });
  }
}