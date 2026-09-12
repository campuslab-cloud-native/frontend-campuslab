import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Kpis {
  totalBookings: number;
  bookingsPerHour: number;
  averageCycleTimeMinutes: number;
  occupiedResources: number;
}

export interface TopResource {
  resourceId: number;
  resourceName: string;
  totalBookings: number;
}

@Injectable({ providedIn: 'root' })
export class ReportService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/report`;

  getKpis(range = 'last24h'): Observable<Kpis> {
    return this.http.get<Kpis>(`${this.baseUrl}/kpis`, { params: new HttpParams().set('range', range) });
  }

  getTopResources(range = 'last7d'): Observable<TopResource[]> {
    return this.http.get<TopResource[]>(`${this.baseUrl}/top-resources`, { params: new HttpParams().set('range', range) });
  }
}