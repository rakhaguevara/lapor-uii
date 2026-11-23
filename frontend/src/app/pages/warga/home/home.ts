import { Component, computed, inject, signal } from '@angular/core';
import { STATUS_OPTIONS } from '../../../core/reports/report.model';
import { RouterLink } from '@angular/router';
import { ReportService } from '../../../core/reports/report.service';
import { Icon } from '../../../shared/icon/icon';
import { PageHead } from '../../../shared/page-head/page-head';
import { ReportTable } from '../../../shared/report-table/report-table';

/*
  BERANDA (dashboard pelapor)
  Isi: sapaan, ajakan membuat laporan, 4 angka ringkasan, dan 3 laporan terbaru.
  Urutan di HP berbeda dari desktop (angka ringkasan dulu), diatur lewat CSS `order`.
*/
@Component({
  selector: 'app-home',
  imports: [RouterLink, Icon, PageHead, ReportTable],
  template: `
    <app-page-head
      [title]="'Halo, ' + firstName"
      subtitle="Terima kasih telah menjaga fasilitas kampus bersama uii."
      [crumbs]="[{ label: 'Portal Pelapor', link: '/portal' }]">
      <a class="btn btn-primary d-only" routerLink="/laporan/baru"><app-icon name="plus" [size]="18" [stroke]="2.2" /> Buat laporan</a>
    </app-page-head>

    <div class="stack">
      <section class="cta">
        <div>
          <h2>Ada fasilitas yang perlu diperbaiki?</h2>
          <p>Laporan Anda membantu kami bertindak lebih cepat dan tepat.</p>
        </div>
        <a class="btn btn-primary" routerLink="/laporan/baru">
          <span class="d-only">Buat laporan</span><app-icon class="d-only" name="right" [size]="16" [stroke]="2.2" />
          <app-icon class="m-only" name="plus" [size]="18" [stroke]="2.2" /><span class="m-only">Buat laporan</span>
        </a>
      </section>

      <!-- Angka ringkasan. Datanya dari service (stats), jadi ikut berubah saat ada laporan baru -->
      <section class="stats" aria-label="Ringkasan laporan">
        @if (!service.loaded()) {
          @for (i of [1, 2, 3, 4]; track i) {
            <div class="card sk-fade" aria-hidden="true"><span class="sk" style="width: 80px; height: 12px"></span><span class="sk" style="width: 48px; height: 28px; margin-top: 16px"></span></div>
          }
        } @else {
          <div class="card"><span>Total laporan</span><strong>{{ stats().total }}</strong></div>
          <div class="card"><span>Dikirim</span><strong>{{ stats().dikirim }}</strong></div>
          <div class="card"><span>Diproses</span><strong>{{ stats().diproses }}</strong></div>
          <div class="card"><span>Selesai</span><strong>{{ stats().selesai }}</strong></div>
        }
      </section>

      <section class="list">
        <div class="title-row">
          <h2>Pembaruan terbaru</h2>
          <a class="btn d-only" routerLink="/laporan-saya">Lihat semua <app-icon name="right" [size]="16" [stroke]="2" /></a>
        </div>
        <app-report-table [reports]="latest()" [loading]="!service.loaded()" from="beranda" [showDetail]="true" [sortable]="true" emptyText="Anda belum membuat laporan." (sort)="byStatus.set(!byStatus())" />
      </section>
    </div>

    <p class="help d-only">Butuh bantuan? Hubungi layanan fasilitas FTI UII melalui Admin Unit.</p>
  `,
  styles: `
    .stack { display: flex; flex-direction: column; gap: 24px; margin-top: -4px; }
    .cta { display: flex; justify-content: space-between; align-items: center; gap: 24px; padding: 30px 24px; border-radius: var(--r-card); background: var(--blue-50); }
    .cta h2 { font-size: 20px; line-height: 1.4; font-weight: 600; }
    .cta .btn { min-width: 182px; }
    .cta p { margin-top: 8px; color: var(--muted); font-size: 14px; }
    .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-top: -4px; }
    .stats .card { padding: 18px 20px 24px; }
    .stats span { color: var(--muted); font-size: 12px; }
    .stats strong { display: block; margin-top: 8px; font-size: 30px; line-height: 1.2; font-weight: 700; }
    .list { padding: 12px 16px 24px; border: 1px solid var(--line); border-radius: var(--r-card); background: var(--white); min-height: 372px; }
    .title-row { display: flex; justify-content: space-between; align-items: center; padding: 0 8px; margin-bottom: 9px; }
    .title-row h2 { font-size: 17px; font-weight: 600; }
    .help { margin-top: 32px; color: var(--muted); font-size: 12px; }

    @media (max-width: 800px) {
      .stack { gap: 24px; margin-top: 0; }
      .stats { order: -1; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-top: 0; }
      .stats .card { padding: 14px 16px 16px; border-radius: 16px; }
      .stats span { font-size: 11.5px; }
      .stats strong { margin-top: 16px; font-size: 28px; }
      .cta { flex-direction: column; align-items: stretch; gap: 16px; padding: 20px 16px; }
      .cta h2 { font-size: 15px; font-weight: 700; }
      .cta p { margin-top: 8px; font-size: 12px; }
      .cta .btn { min-width: 0; font-size: 12px; }
      .list { padding: 0; border: 0; background: none; min-height: 0; }
      .title-row { padding: 0; margin-bottom: 16px; }
      .title-row h2 { font-size: 17px; font-weight: 700; }
    }
  `,
})
export class Home {
  service = inject(ReportService);

  firstName = this.service.user.name.split(' ')[0];
  stats = this.service.stats;
  // 3 laporan paling baru (daftar dari backend sudah urut terbaru dulu)
  byStatus = signal(false); // true = urut berdasarkan status
  latest = computed(() => {
    const top = this.service.reports().slice(0, 3);
    return this.byStatus() ? [...top].sort((a, b) => STATUS_OPTIONS.indexOf(a.status) - STATUS_OPTIONS.indexOf(b.status)) : top;
  });
}
