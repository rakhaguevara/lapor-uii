import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Report } from '../core/report.model';
import { ReportService } from '../core/report.service';
import { StatusBadge } from '../shared/status-badge';

// HALAMAN "LAPORAN BERHASIL DIKIRIM": menampilkan nomor tiket setelah form dikirim.
@Component({
  selector: 'app-report-success',
  imports: [RouterLink, StatusBadge],
  template: `
    <div class="page-head">
      <h1>Laporan berhasil dikirim</h1>
    </div>

    @if (report(); as report) {
      <section class="card box">
        <div class="check" aria-hidden="true">✓</div>
        <h2>Laporan berhasil dikirim</h2>
        <p class="thanks">Terima kasih, {{ firstName }}. Laporan Anda sudah masuk ke antrean Kaur.</p>

        <div class="ticket">
          <div>
            <small>NOMOR TIKET</small>
            <strong>{{ report.id }}</strong>
          </div>
          <app-status-badge [status]="report.status" />
        </div>

        <div class="actions">
          <a class="btn btn-primary" [routerLink]="['/laporan', report.id]">Pantau laporan</a>
          <a class="btn" routerLink="/laporan-saya">Laporan Saya</a>
        </div>
      </section>
    } @else {
      <p class="empty">Laporan tidak ditemukan.</p>
    }
  `,
  styles: `
    .box { max-width: 720px; margin: 0 auto; padding: 40px 24px; text-align: center; }
    .check { display: grid; place-items: center; width: 64px; height: 64px; margin: 0 auto 16px; border-radius: 8px; background: #e6f6ee; color: #167a4a; font-size: 28px; }
    h2 { font-size: 26px; }
    .thanks { color: var(--muted); margin: 8px 0 24px; }
    .ticket { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; margin-bottom: 24px; border-radius: 8px; background: var(--bg); text-align: left; }
    .ticket small { color: var(--muted); font-weight: 600; }
    .ticket strong { display: block; font-size: 30px; }
    .actions { display: flex; flex-wrap: wrap; justify-content: center; gap: 12px; }
  `,
})
export class ReportSuccess {
  private service = inject(ReportService);
  firstName = this.service.user.name.split(' ')[0];
  // Ambil nomor tiket dari alamat URL (/laporan/LP-0147/terkirim), lalu cari laporannya
  report = signal<Report | undefined>(undefined);

  constructor() {
    this.service.find(inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '').then((r) => this.report.set(r));
  }
}
