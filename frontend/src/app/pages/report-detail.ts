import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Report, STEP_REACHED, TIMELINE_STEPS } from '../core/report.model';
import { ReportService } from '../core/report.service';
import { StatusBadge } from '../shared/status-badge';

/*
  DETAIL LAPORAN
  Kiri: info + foto + deskripsi. Kanan: "Perjalanan laporan" (timeline).
  Sebuah langkah dianggap tercapai jika nomornya <= STEP_REACHED[status].
*/
@Component({
  selector: 'app-report-detail',
  imports: [RouterLink, DatePipe, StatusBadge],
  template: `
    <div class="page-head head">
      <div>
        <h1>Detail laporan</h1>
        <p>Layanan fasilitas yang transparan, dari laporan hingga penyelesaian.</p>
      </div>
      <a class="btn" routerLink="/laporan-saya">← Laporan Saya</a>
    </div>

    @if (report(); as r) {
      <div class="layout">
        <article class="card">
          <div class="top">
            <span class="ticket">{{ r.id }}</span>
            <app-status-badge [status]="r.status" />
          </div>
          <h2>{{ r.title }}</h2>
          <p class="where">{{ r.building }}{{ r.floor ? ' · ' + r.floor : '' }} · {{ r.room }}</p>

          @if (r.photoUrl) {
            <img [src]="r.photoUrl" [alt]="'Foto kerusakan: ' + r.title">
          } @else {
            <div class="no-photo">Belum ada foto</div>
          }

          <small class="category">{{ r.category.toUpperCase() }}</small>
          <h3>Deskripsi kerusakan</h3>
          <!-- {{ }} otomatis aman: isi buatan pengguna tampil sebagai teks biasa -->
          <p>{{ r.description }}</p>
          <p class="reported">Dilaporkan pada {{ r.createdAt | date: "d MMMM y, HH.mm 'WIB'" }}</p>
        </article>

        <aside>
          <section class="card">
            <h2>Perjalanan laporan</h2>
            <ol class="timeline">
              @for (step of steps; track step.title; let i = $index) {
                <li [class.done]="i <= reached(r.status)">
                  <strong>{{ step.title }}</strong>
                  @if (i === 0) { <small>{{ r.createdAt | date: "d MMM y · HH.mm" }}</small> }
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
    } @else {
      <p class="empty">Laporan tidak ditemukan. <a routerLink="/laporan-saya">Kembali ke Laporan Saya</a></p>
    }
  `,
  styles: `
    .head { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
    .head .btn { white-space: nowrap; }
    .layout { display: grid; grid-template-columns: 1fr 380px; gap: 24px; align-items: start; }
    aside { display: grid; gap: 24px; }
    h2 { font-size: 24px; }
    aside h2 { font-size: 20px; }
    .top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .ticket { color: var(--blue-600); font-weight: 500; }
    .where { color: var(--muted); margin: 4px 0 20px; }
    img, .no-photo { width: 100%; max-height: 380px; object-fit: cover; border-radius: 8px; }
    .no-photo { display: grid; place-items: center; height: 200px; background: var(--bg); color: var(--muted); }
    .category { display: block; margin: 20px 0 4px; color: var(--muted); font-weight: 600; }
    h3 { font-size: 18px; margin-bottom: 8px; }
    .reported { margin-top: 24px; color: var(--muted); font-size: 14px; }
    .muted { color: var(--muted); margin-top: 8px; }

    .timeline { list-style: none; margin: 20px 0 0; padding: 0; display: grid; gap: 24px; }
    .timeline li { position: relative; padding-left: 28px; color: var(--muted); }
    .timeline li::before { content: ''; position: absolute; left: 0; top: 6px; width: 12px; height: 12px; border-radius: 8px; background: #d3dbe8; }
    .timeline li.done::before { background: var(--blue-600); }
    .timeline li.done strong { color: var(--ink); }
    .timeline strong { display: block; }
    .timeline small { display: block; }
    .timeline p { font-size: 14px; }

    @media (max-width: 800px) {
      .head .btn { display: none; }
      .layout { grid-template-columns: 1fr; }
    }
  `,
})
export class ReportDetail {
  private service = inject(ReportService);
  steps = TIMELINE_STEPS;
  // Ambil nomor tiket dari URL lalu cari laporannya. Tidak ketemu -> undefined -> tampil pesan.
  report = signal<Report | undefined>(undefined);

  constructor() {
    this.service.find(inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '').then((r) => this.report.set(r));
  }

  reached = (status: keyof typeof STEP_REACHED) => STEP_REACHED[status];
}
