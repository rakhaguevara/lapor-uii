import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ReportService } from '../core/report.service';
import { ReportTable } from '../shared/report-table';

/*
  BERANDA (dashboard pelapor)
  Isi: sapaan, ajakan membuat laporan, 4 angka ringkasan, dan 3 laporan terbaru.
*/
@Component({
  selector: 'app-home',
  imports: [RouterLink, ReportTable],
  template: `
    <div class="page-head head">
      <div>
        <h1>Halo, {{ firstName }}</h1>
        <p>Terima kasih telah menjaga fasilitas kampus bersama kami.</p>
      </div>
      <a class="btn btn-primary" routerLink="/laporan/baru">+ Buat laporan</a>
    </div>

    <section class="cta">
      <div>
        <h2>Ada fasilitas yang perlu diperbaiki?</h2>
        <p>Laporan Anda membantu kami bertindak lebih cepat dan tepat.</p>
      </div>
      <a class="btn btn-primary" routerLink="/laporan/baru">Buat laporan →</a>
    </section>

    <!-- Angka ringkasan. Datanya dari service (stats), jadi ikut berubah saat ada laporan baru -->
    <section class="stats" aria-label="Ringkasan laporan">
      <div class="card"><span>Total laporan</span><strong>{{ stats().total }}</strong></div>
      <div class="card"><span>Dikirim</span><strong>{{ stats().dikirim }}</strong></div>
      <div class="card"><span>Diproses</span><strong>{{ stats().diproses }}</strong></div>
      <div class="card"><span>Selesai</span><strong>{{ stats().selesai }}</strong></div>
    </section>

    <section class="card">
      <div class="title-row">
        <h2>Pembaruan terbaru</h2>
        <a class="btn" routerLink="/laporan-saya">Lihat semua →</a>
      </div>
      <app-report-table [reports]="latest()" emptyText="Anda belum membuat laporan." />
    </section>

    <p class="help">Butuh bantuan? Hubungi layanan fasilitas FTI UII melalui Kaur fakultas.</p>
  `,
  styles: `
    .head { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
    .head .btn { white-space: nowrap; }
    .cta { display: flex; justify-content: space-between; align-items: center; gap: 16px; padding: 32px; margin-bottom: 24px; border-radius: 8px; background: var(--blue-50); }
    .cta h2 { font-size: 22px; }
    .cta p { color: var(--muted); }
    .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
    .stats span { color: var(--muted); }
    .stats strong { display: block; margin-top: 8px; font-size: 36px; line-height: 1.1; }
    .title-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .title-row h2 { font-size: 20px; }
    .help { margin-top: 24px; color: var(--muted); font-size: 14px; }

    @media (max-width: 800px) {
      .head .btn { display: none; }      /* di HP tombolnya sudah ada di banner & menu bawah */
      .cta { flex-direction: column; align-items: stretch; padding: 20px; }
      .stats { grid-template-columns: repeat(2, 1fr); }
    }
  `,
})
export class Home {
  private service = inject(ReportService);

  firstName = this.service.user.name.split(' ')[0];
  stats = this.service.stats;
  // 3 laporan paling baru (daftar di service sudah urut terbaru dulu)
  latest = computed(() => this.service.reports().slice(0, 3));
}
