import { DatePipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Report } from '../core/report.model';
import { StatusBadge } from './status-badge';

/*
  TABEL DAFTAR LAPORAN
  Dipakai di Beranda, Laporan Saya, dan Laporan Publik.
  Komponen ini hanya MENAMPILKAN data yang diberikan (via input) dan memberi tahu
  induknya saat tombol like ditekan (via output). Ia tidak mengambil data sendiri.
*/
@Component({
  selector: 'app-report-table',
  imports: [RouterLink, DatePipe, StatusBadge],
  template: `
    @if (reports().length === 0) {
      <p class="empty">{{ emptyText() }}</p>
    } @else {
      <div class="head">
        <span>No. tiket / Kerusakan</span><span>Lokasi</span><span>Tanggal</span><span>Status</span>
      </div>
      @for (r of reports(); track r.id) {
        <div class="row">
          <a class="name" [routerLink]="['/laporan', r.id]">
            <span class="ticket">{{ r.id }}</span>
            <span class="title">{{ r.title }}</span>
          </a>
          <span class="where">
            {{ r.room }}{{ r.floor ? ' · ' + r.floor : '' }}
            <small>{{ r.building }}</small>
          </span>
          <span class="when">{{ r.createdAt | date: 'd MMM y' }}</span>
          <span class="state">
            <app-status-badge [status]="r.status" />
            @if (showLike()) {
              <button class="like" type="button"
                [class.on]="r.liked"
                [disabled]="r.status === 'selesai'"
                [attr.aria-pressed]="r.liked"
                [attr.aria-label]="'Suka laporan ' + r.id"
                (click)="like.emit(r.id)">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                </svg>
                {{ r.likes }}
              </button>
            }
          </span>
        </div>
      }
    }
  `,
  styles: `
    :host { display: block; }
    .head, .row { display: grid; grid-template-columns: 2fr 1.6fr 1fr 1.4fr; gap: 16px; align-items: center; padding: 16px 24px; }
    .head { background: var(--bg); border-radius: 8px; color: var(--muted); font-size: 13px; font-weight: 600; padding-block: 12px; }
    .row { border-bottom: 1px solid var(--line); }
    .row:last-child { border-bottom: 0; }
    .name { display: flex; flex-direction: column; color: var(--ink); }
    .ticket { color: var(--blue-600); font-size: 13px; }
    .title { font-weight: 600; font-size: 16px; }
    .where small { display: block; color: var(--muted); font-size: 13px; }
    .when { color: var(--muted); }
    .state { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
    .like { display: inline-flex; align-items: center; gap: 4px; min-width: 44px; min-height: 44px; justify-content: center; border: 0; background: none; color: var(--muted); font: inherit; cursor: pointer; border-radius: 8px; }
    .like.on { color: var(--blue-600); font-weight: 600; }
    .like:disabled { opacity: 0.4; cursor: not-allowed; }

    /* Di HP: kolom ditumpuk jadi 2 baris agar tidak sempit */
    @media (max-width: 800px) {
      .head { display: none; }
      .row { grid-template-columns: 1fr auto; gap: 6px 12px; padding: 14px 0; }
      .where { grid-column: 1 / 2; }
      .when { grid-column: 1 / 2; font-size: 13px; }
      .state { grid-column: 2 / 3; grid-row: 1 / 3; flex-direction: column; align-items: flex-end; }
    }
  `,
})
export class ReportTable {
  reports = input.required<Report[]>();   // data yang ditampilkan
  showLike = input(false);                // tampilkan tombol like? (hanya di Laporan Publik)
  emptyText = input('Belum ada laporan.');
  like = output<string>();                // mengirim nomor tiket saat like ditekan
}
