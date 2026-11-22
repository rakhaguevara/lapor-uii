import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Report } from '../../../core/reports/report.model';
import { ReportService } from '../../../core/reports/report.service';
import { Icon } from '../../../shared/icon/icon';
import { PageHead } from '../../../shared/page-head/page-head';
import { StatusBadge } from '../../../shared/status-badge/status-badge';

/*
  HALAMAN "LAPORAN BERHASIL DIKIRIM": menampilkan nomor tiket setelah form dikirim.
  Desktop: kartu di tengah dengan ikon centang. HP: kartu rata kiri dengan tombol selebar layar.
*/
@Component({
  selector: 'app-report-success',
  imports: [RouterLink, Icon, PageHead, StatusBadge],
  template: `
    <app-page-head
      title="Laporan berhasil dikirim"
      [subtitle]="firstName ? 'Terima kasih, ' + firstName + '. Laporan Anda sudah masuk ke antrean.' : ''"
      [crumbs]="[{ label: 'Portal Pelapor' }, { label: 'Laporan berhasil dikirim' }]" />

    @if (report(); as r) {
      <!-- Desktop -->
      <section class="card box d-only">
        <div class="check" aria-hidden="true"><app-icon name="check" [size]="40" [stroke]="2.6" /></div>
        <h2>Laporan berhasil dikirim</h2>
        <p class="thanks">Terima kasih, {{ firstName }}. Laporan Anda sudah masuk ke antrean.</p>

        <div class="ticket">
          <div>
            <small>NOMOR TIKET</small>
            <strong>{{ r.id }}</strong>
          </div>
          <app-status-badge [status]="r.status" />
        </div>

        <div class="actions">
          <a class="btn btn-primary" [routerLink]="['/laporan', r.id]">Pantau laporan</a>
          <a class="btn" routerLink="/laporan-saya">Laporan Saya</a>
        </div>
      </section>

      <!-- HP -->
      <section class="card mbox m-only">
        <p class="ok"><app-icon name="check" [size]="20" [stroke]="2.6" /> Laporan diterima</p>
        <small>NOMOR TIKET</small>
        <strong class="no">{{ r.id }}</strong>
        <app-status-badge [status]="r.status" />
        <p class="what"><b>{{ r.title }}</b><b>{{ r.room }} · {{ r.building }}</b></p>
        <p class="sub">Pantau perkembangan laporan hingga penyelesaian. Tidak perlu melapor ulang.</p>
        <a class="btn btn-primary" [routerLink]="['/laporan', r.id]">Pantau laporan <app-icon name="right" [size]="16" [stroke]="2.2" /></a>
        <a class="btn blue" routerLink="/laporan-saya">Laporan Saya</a>
      </section>
    } @else if (loading()) {
      <p class="empty" role="status">Memuat laporan…</p>
    } @else {
      <p class="empty">Laporan tidak ditemukan. <a routerLink="/laporan-saya">Kembali ke Laporan Saya</a></p>
    }
  `,
  styles: `
    .box { max-width: 815px; margin: 0 auto; padding: 56px 48px 64px; text-align: center; }
    .check { display: grid; place-items: center; width: 84px; height: 84px; margin: 0 auto 28px; border-radius: 50%; background: var(--green-bg); color: var(--green); }
    h2 { font-size: 28px; font-weight: 700; line-height: 1.3; }
    .thanks { color: var(--muted); font-size: 14px; margin: 24px 0 36px; }
    .ticket { display: flex; justify-content: space-between; align-items: center; padding: 22px 24px; margin-bottom: 40px; border-radius: 12px; background: var(--bg); text-align: left; }
    .ticket small { color: var(--muted); font-size: 11px; font-weight: 600; letter-spacing: 0.02em; }
    .ticket strong { display: block; font-size: 24px; font-weight: 700; line-height: 1.3; }
    .actions { display: flex; flex-wrap: wrap; justify-content: center; gap: 20px; }
    .actions .btn { min-width: 190px; }

    .mbox { display: flex; flex-direction: column; align-items: flex-start; padding: 24px 20px; }
    .ok { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; color: var(--green); font-size: 18px; font-weight: 700; }
    .mbox small { margin-top: 4px; color: var(--muted); font-size: 11px; font-weight: 600; }
    .no { margin: 8px 0 14px; font-size: 28px; font-weight: 700; line-height: 1.3; }
    .what { display: flex; flex-direction: column; margin-top: 14px; font-size: 14px; }
    .what b { font-weight: 500; }
    .mbox .sub { margin: 14px 0 18px; font-size: 12.5px; }
    .mbox .btn { width: 100%; }
    .mbox .btn + .btn { margin-top: 12px; }
    .blue { color: var(--blue-600); }
  `,
})
export class ReportSuccess {
  private service = inject(ReportService);
  firstName = this.service.user.name.split(' ')[0];
  // Ambil nomor tiket dari alamat URL (/laporan/LP-0147/terkirim), lalu cari laporannya
  report = signal<Report | undefined>(undefined);
  loading = signal(true);

  constructor() {
    this.service
      .find(inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '')
      .then((r) => this.report.set(r))
      .finally(() => this.loading.set(false));
  }
}
