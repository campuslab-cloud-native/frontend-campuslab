import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, forkJoin, interval, takeUntil } from 'rxjs';
import { ReportService, Kpis, TopResource } from '../../../core/services/report.service';

const POLL_INTERVAL_MS = 15000;

interface ReportPeriod {
  value: string;
  label: string;
  title: string;
  short: string;
}

const PERIODS: ReportPeriod[] = [
  { value: 'last24h', label: 'Diario (24 h)', title: 'diario, últimas 24 horas', short: '24 h' },
  { value: 'last7d', label: 'Semanal (7 días)', title: 'semanal, últimos 7 días', short: '7 días' },
  { value: 'last30d', label: 'Mensual (30 días)', title: 'mensual, últimos 30 días', short: '30 días' },
];

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

  readonly periods = PERIODS;

  period = signal<string>(PERIODS[0].value);
  current = computed(() => PERIODS.find((p) => p.value === this.period()) ?? PERIODS[0]);

  kpis = signal<Kpis | null>(null);
  topResources = signal<TopResource[]>([]);
  loading = signal(false);
  error = signal(false);
  generatedAt = signal<Date | null>(null);

  ngOnInit(): void {
    this.load(true);
    interval(POLL_INTERVAL_MS)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.load(false));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  selectPeriod(value: string): void {
    this.period.set(value);
    this.load(true);
  }

  private load(manual: boolean): void {
    const range = this.period();
    if (manual) {
      this.loading.set(true);
      this.kpis.set(null);
      this.topResources.set([]);
    }
    this.error.set(false);

    forkJoin({
      kpis: this.reportService.getKpis(range),
      top: this.reportService.getTopResources(range),
    }).subscribe({
      next: ({ kpis, top }) => {
        if (range !== this.period()) return;
        this.kpis.set(kpis);
        this.topResources.set(top);
        this.generatedAt.set(new Date());
        this.loading.set(false);
      },
      error: () => {
        if (range !== this.period()) return;
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }
}