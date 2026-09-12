import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, interval, startWith, takeUntil } from 'rxjs';
import { ReportService, Kpis, TopResource } from '../../../core/services/report.service';

const POLL_INTERVAL_MS = 15000;

@Component({
  selector: 'app-reports-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reports-page.component.html',
  styleUrl: './reports-page.component.css'
})
export class ReportsPageComponent implements OnInit, OnDestroy {
  private readonly reportService = inject(ReportService);
  private readonly destroy$ = new Subject<void>();

  kpis = signal<Kpis | null>(null);
  topResources = signal<TopResource[]>([]);

  ngOnInit(): void {
    interval(POLL_INTERVAL_MS)
      .pipe(startWith(0), takeUntil(this.destroy$))
      .subscribe(() => {
        this.reportService.getKpis('last24h').subscribe((kpis) => this.kpis.set(kpis));
        this.reportService.getTopResources('last7d').subscribe((top) => this.topResources.set(top));
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}