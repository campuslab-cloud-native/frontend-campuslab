import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AuditEvent {
  eventId: string;
  bookingId: number;
  userId: string;
  type: string;
  timestamp: string;
  source: string;
}

export interface AuditFilters {
  userId?: string;
  type?: string;
  from?: string;
  to?: string;
}

@Injectable({ providedIn: 'root' })
export class AuditService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/audit`;

  getEvents(filters: AuditFilters = {}): Observable<AuditEvent[]> {
    let params = new HttpParams();
    if (filters.userId) params = params.set('userId', filters.userId);
    if (filters.type) params = params.set('type', filters.type);
    if (filters.from) params = params.set('from', filters.from);
    if (filters.to) params = params.set('to', filters.to);
    return this.http.get<AuditEvent[]>(`${this.baseUrl}/events`, { params });
  }

  getBookingTimeline(bookingId: number): Observable<AuditEvent[]> {
    return this.http.get<AuditEvent[]>(`${this.baseUrl}/bookings/${bookingId}`);
  }
}