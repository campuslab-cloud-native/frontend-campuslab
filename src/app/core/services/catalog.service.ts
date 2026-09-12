import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CatalogResource, CatalogResourceRequest } from '../models/resource.model';

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/catalog`;

  getResources(): Observable<CatalogResource[]> {
    return this.http.get<CatalogResource[]>(`${this.baseUrl}/resources`);
  }

  getResource(id: number): Observable<CatalogResource> {
    return this.http.get<CatalogResource>(`${this.baseUrl}/resources/${id}`);
  }

  createResource(resource: CatalogResourceRequest): Observable<CatalogResource> {
    return this.http.post<CatalogResource>(`${this.baseUrl}/resources`, resource);
  }

  updateResource(id: number, resource: CatalogResourceRequest): Observable<CatalogResource> {
    return this.http.put<CatalogResource>(`${this.baseUrl}/resources/${id}`, resource);
  }
}
