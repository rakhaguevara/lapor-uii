import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Report, STEP_REACHED, StatusCode, TIMELINE_STEPS } from '../../../core/reports/report.model';
import { ReportService } from '../../../core/reports/report.service';
import { Icon } from '../../../shared/icon/icon';
import { PageHead } from '../../../shared/page-head/page-head';
import { StatusBadge } from '../../../shared/status-badge/status-badge';

/*
  DETAIL LAPORAN
  Kiri: info + foto + deskripsi. Kanan: "Perjalanan laporan" (timeline).
  Sebuah langkah dianggap tercapai jika nomornya <= STEP_REACHED[status].
  Urutan kategori dan foto berbeda di HP (kategori di atas foto), diatur lewat CSS `order`.
*/
@Component({
  selector: 'app-report-detail',
  imports: [RouterLink, DatePipe, Icon, PageHead, StatusBadge],
  template: `
    <a class="btn back m-only" routerLink="/laporan-saya"><app-icon name="left" [size]="16" [stroke]="2.2" /> Laporan Saya</a>

    <app-page-head
      title="Detail laporan"
      subtitle="Layanan fasilitas yang transparan, dari laporan hingga penyelesaian."
      [desktopOnly]="true"
      [crumbs]="[{ label: 'Portal Pelapor' }, { label: 'Detail laporan' }]">
      <a class="btn d-only" routerLink="/laporan-saya"><app-icon name="left" [size]="16" [stroke]="2" /> Laporan Saya</a>
    </app-page-head>

    @if (report(); as r) {
      <div class="layout">
        <article class="card main">
          <div class="top">
            <span class="ticket">{{ r.id }}</span>
            <app-status-badge [status]="r.status" />
          </div>
          <h2>{{ r.title }}</h2>
          <p class="where">
            <span>{{ r.building }}</span>
            <span>{{ r.floor ? r.floor + ' · ' : '' }}{{ r.room }}</span>
          </p>

          @if (r.photoUrl) {
            <img class="photo" [src]="r.photoUrl" [alt]="'Foto kerusakan: ' + r.title">
          } @else {
            <div class="photo no-photo">Belum ada foto</div>
          }

          <small class="category">{{ r.category.toUpperCase() }}</small>
          <div class="desc">
            <h3>Deskripsi kerusakan</h3>
            <!-- {{ }} otomatis aman: isi buatan pengguna tampil sebagai teks biasa -->
            <p>{{ r.description }}</p>
          </div>
          <p class="reported">Dilaporkan pada {{ r.createdAt | date: "d MMMM y, HH.mm 'WIB'" }}</p>
          <p class="likes d-only"><app-icon name="thumb" [size]="22" /> {{ r.likes }}</p>
        </article>

        <aside>
          <section class="card">
            <h2>Perjalanan laporan</h2>
            <ol class="timeline">
              @for (step of steps; track step.title; let i = $index) {
                <li [class.done]="i <= reached(r.status)" [attr.aria-current]="i === reached(r.status) ? 'step' : null">
                  <strong>{{ step.title }}</strong>
                  <small>
                    @if (i === 0) { {{ r.createdAt | date: "d MMM y · HH.mm" }} }
                    @else { {{ i <= reached(r.status) ? step.doneLabel : step.pendingLabel }} }
                  </small>
                  <p>{{ i <= reached(r.status) ? step.doneText : step.pendingText }}</p>
                </li>
              }
            </ol>
          </section>
          <section class="card">
            <h2>Tidak perlu melapor ulang</h2>
            <p class="muted">Pantau halaman ini untuk melihat perubahan status dan catatan petugas.</p>
          </section>
        </aside>
      </div>
    } @else if (loading()) {
      <p class="empty" role="status">Memuat laporan…</p>
    } @else {
      <p class="empty">Laporan tidak ditemukan. <a routerLink="/laporan-saya">Kembali ke Laporan Saya</a></p>
    }
  `,
  styles: `
    .layout { display: grid; grid-template-columns: 1fr 383px; gap: 24px; align-items: start; }
    aside { display: grid; gap: 24px; }
    .main { display: flex; flex-direction: column; min-height: 690px; }
    .top { order: 1; display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .ticket { color: var(--blue-600); font-size: 12px; font-weight: 500; }
    .main h2 { order: 2; font-size: 26px; line-height: 1.3; font-weight: 700; }
    .where { order: 3; margin: 12px 0 24px; color: var(--muted); font-size: 14px; }
    .where span:first-child::after { content: ' · '; }
    .photo { order: 4; width: 100%; aspect-ratio: 11 / 4; object-fit: cover; border-radius: 12px; }
    .no-photo { display: grid; place-items: center; aspect-ratio: auto; height: 200px; background: var(--bg); color: var(--muted); }
    .category { order: 5; margin: 24px 0 8px; color: var(--muted); font-size: 11px; font-weight: 600; letter-spacing: 0.02em; }
    .desc { order: 6; }
    h3 { font-size: 18px; font-weight: 600; margin-bottom: 12px; }
    .desc p { font-size: 14px; line-height: 1.6; }
    .reported { order: 7; margin-top: auto; padding-top: 48px; color: var(--muted); font-size: 12px; }
    .likes { order: 8; display: flex; align-items: center; gap: 8px; margin-top: 32px; color: var(--muted); font-size: 14px; font-weight: 500; }
    aside h2 { font-size: 18px; font-weight: 600; }
    .muted { color: var(--muted); font-size: 13px; margin-top: 16px; }

    .timeline { display: grid; gap: 24px; margin-top: 28px; }
    .timeline li { position: relative; padding-left: 36px; color: var(--muted); }
    .timeline li::before { content: ''; position: absolute; left: 4px; top: 8px; width: 12px; height: 12px; border-radius: 50%; background: var(--line); }
    .timeline li.done::before { background: var(--blue-600); }
    .timeline li.done strong { color: var(--ink); }
    .timeline strong { display: block; font-size: 14px; font-weight: 600; }
    .timeline small { display: block; font-size: 12px; }
    .timeline p { margin-top: 4px; font-size: 12px; }

    .back { width: 100%; margin-bottom: 20px; border-radius: 12px; color: var(--blue-600); }

    @media (max-width: 800px) {
      .layout { grid-template-columns: 1fr; gap: 16px; }
      aside { gap: 16px; }
      .main { min-height: 0; }
      .top { justify-content: flex-start; gap: 12px; }
      .main h2 { font-size: 21px; }
      .where { display: flex; flex-direction: column; margin: 14px 0 12px; font-size: 13px; }
      .where span:first-child::after { content: none; }
      .category { order: 4; margin: 0 0 16px; color: var(--blue-600); }
      .photo { order: 5; aspect-ratio: 489 / 300; margin-bottom: 20px; }
      .desc { order: 6; }
      h3 { font-size: 15px; font-weight: 700; }
      .desc p { font-size: 13px; }
      .ticket { font-size: 13px; }
      .reported { padding-top: 16px; margin-top: 0; font-size: 11px; }
      .timeline { margin-top: 20px; }
    }
  `,
})
export class ReportDetail {
  private service = inject(ReportService);
  steps = TIMELINE_STEPS;
  // Ambil nomor tiket dari URL lalu cari laporannya. Tidak ketemu -> undefined -> tampil pesan.
  report = signal<Report | undefined>(undefined);
  loading = signal(true);

  constructor() {
    this.service
      .find(inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '')
      .then((r) => this.report.set(r))
      .finally(() => this.loading.set(false));
  }

  reached = (status: StatusCode) => STEP_REACHED[status];
}
