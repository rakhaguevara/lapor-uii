import { DatePipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Report } from '../../core/reports/report.model';

// Baris tabel: sama dengan Report, tetapi status boleh status petugas (ditugaskan, menunggu, dst)
export type Row = Omit<Report, 'status'> & { status: string };
import { Icon } from '../icon/icon';
import { StatusBadge } from '../status-badge/status-badge';

/*
  DAFTAR LAPORAN
  Dipakai di Beranda, Laporan Saya, dan Laporan Publik.
  Desktop: tabel (No. tiket / Kerusakan, Lokasi, Tanggal, Status).
  HP: tiap laporan menjadi kartu. Isi DOM sama, hanya tata letak yang berubah lewat CSS.
  Komponen ini hanya MENAMPILKAN data yang diberikan (input) dan memberi tahu induknya
  saat tombol like atau tombol urut ditekan (output). Ia tidak mengambil data sendiri.
*/
@Component({
  selector: 'app-report-table',
  imports: [RouterLink, DatePipe, StatusBadge, Icon],
  template: `
    @if (reports().length === 0) {
      <p class="empty">{{ emptyText() }}</p>
    } @else {
      <div class="head d-only">
        <span>{{ buildingFirst() ? 'Tiket / kerusakan' : 'No. tiket / Kerusakan' }}</span><span>{{ buildingFirst() ? 'Gedung / ruangan' : 'Lokasi' }}</span><span>Tanggal</span>
        <span class="status-h">
          Status
          @if (sortable()) {
            <button class="sort" type="button" aria-label="Urutkan berdasarkan status" (click)="sort.emit()">
              <app-icon name="sort" [size]="18" />
            </button>
          }
        </span>
      </div>
      @for (r of reports(); track r.id) {
        <article class="row">
          <a class="name" [routerLink]="[base(), r.id]">
            <span class="ticket">{{ r.id }}<span class="m-only"> · {{ r.createdAt | date: 'd MMM y' }}</span></span>
            <span class="title">{{ r.title }}</span>
          </a>
          @if (buildingFirst()) {
            <span class="where">{{ r.building }}<small>{{ r.room }}{{ r.floor ? ' · ' + r.floor : '' }}</small></span>
          } @else {
            <span class="where">{{ r.room }}{{ r.floor ? ' · ' + r.floor : '' }}<small>{{ r.building }}</small></span>
          }
          <span class="when d-only">{{ r.createdAt | date: 'd MMM y' }}</span>
          <span class="state">
            <app-status-badge [status]="r.status" />
            @if (showLike() && likeable()) {
              <button class="like" type="button"
                [class.on]="r.liked"
                [disabled]="r.status === 'selesai'"
                [attr.aria-pressed]="r.liked"
                [attr.aria-label]="'Suka laporan ' + r.id + ', ' + r.likes + ' suka'"
                (click)="like.emit(r.id)">
                <app-icon name="thumb" [size]="20" />
                <span class="count d-only">{{ r.likes }}</span>
              </button>
            } @else if (showLike()) {
              <!-- Laporan Saya: jumlah suka hanya ditampilkan -->
              <span class="like static d-only" [attr.aria-label]="r.likes + ' suka'" role="img">
                <app-icon name="thumb" [size]="20" />
                <span class="count d-only">{{ r.likes }}</span>
              </span>
            }
          </span>
          @if (showDetail()) {
            <a class="more m-only" [routerLink]="[base(), r.id]">Lihat detail <app-icon name="right" [size]="14" [stroke]="2.2" /></a>
          }
        </article>
      }
    }
  `,
  styles: `
    :host { display: block; }
    .head, .row { display: grid; grid-template-columns: 2.1fr 1.33fr 1fr 0.8fr; align-items: center; padding: 0 16px; }
    .head { height: 40px; background: var(--bg); border-radius: 8px; color: var(--muted); font-size: 11px; font-weight: 600; }
    .status-h { display: flex; align-items: center; justify-content: space-between; }
    .sort { display: grid; place-items: center; width: 32px; height: 32px; border: 0; border-radius: 8px; background: none; color: var(--muted); cursor: pointer; }
    .sort:hover { background: var(--white); }
    .row { min-height: 78px; padding-block: 12px; }
    .name { display: flex; flex-direction: column; color: var(--ink); }
    .ticket { color: var(--blue-600); font-size: 11px; line-height: 1.5; }
    .title { font-weight: 600; font-size: 14px; line-height: 1.5; }
    .where { font-size: 13px; line-height: 1.5; }
    .where small { display: block; color: var(--muted); font-size: 11px; }
    .when { color: var(--muted); font-size: 12px; }
    .state { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
    .like { display: inline-flex; align-items: center; gap: 4px; min-width: 44px; min-height: 44px; justify-content: center; border: 0; background: none; color: var(--muted); font-size: 14px; cursor: pointer; border-radius: 8px; }
    .like.static { cursor: default; }
    .like.on { color: var(--blue-900); font-weight: 600; }
    .like:disabled { opacity: 0.55; cursor: default; }
    .more { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; }

    /* HP: setiap baris jadi kartu */
    @media (max-width: 800px) {
      .row { display: flex; flex-direction: column; align-items: flex-start; gap: 0; margin-bottom: 16px; padding: 16px; border: 1px solid var(--line); border-radius: var(--r-card); background: var(--white); }
      .name { width: 100%; }
      .ticket { color: var(--muted); font-size: 11px; }
      .title { margin: 6px 0 10px; font-size: 15px; font-weight: 700; line-height: 1.4; }
      .where { color: var(--muted); font-size: 12px; }
      .where small { font-size: 12px; }
      .state { width: 100%; margin-top: 16px; flex-direction: column; align-items: flex-start; gap: 8px; }
      .like { min-width: 36px; min-height: 36px; margin-left: -6px; }
      .more { margin-top: 14px; font-size: 12.5px; }
    }
  `,
})
export class ReportTable {
  reports = input.required<Row[]>();
  base = input('/laporan');               // awal alamat tautan detail
  buildingFirst = input(false);           // true = gedung jadi baris utama (tampilan petugas)   // data yang ditampilkan
  showLike = input(false);                // tampilkan tombol like? (Laporan Saya dan Publik)
  likeable = input(true);                 // false = jumlah suka hanya ditampilkan (Laporan Saya)
  showDetail = input(false);              // tautan "Lihat detail" di kartu HP
  sortable = input(false);                // tombol urut di kepala kolom Status
  emptyText = input('Belum ada laporan.');
  like = output<string>();                // nomor tiket saat like ditekan
  sort = output<void>();                  // saat tombol urut ditekan
}
