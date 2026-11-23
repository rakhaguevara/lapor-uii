import { DatePipe } from '@angular/common';
import { Component, ElementRef, afterRenderEffect, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Report } from '../../core/reports/report.model';

// Baris tabel: sama dengan Report, tetapi status boleh status petugas (ditugaskan, menunggu, dst)
export type Row = Omit<Report, 'status'> & { status: string };
import { Icon } from '../icon/icon';
import { Skeleton } from '../skeleton/skeleton';
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
  imports: [RouterLink, DatePipe, StatusBadge, Icon, Skeleton],
  template: `
    @if (!loading() && reports().length === 0) {
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
      @if (loading()) {
        <app-skeleton variant="rows" [count]="4" />
      } @else {
      @for (r of reports(); track r.id) {
        <article class="row" [attr.data-id]="r.id">
          <a class="name" [routerLink]="[base(), r.id]" [queryParams]="from() ? { dari: from() } : null" [attr.title]="'Buka detail ' + r.id">
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
              <a class="detail-btn m-only" [routerLink]="[base(), r.id]" [queryParams]="from() ? { dari: from() } : null">
                <app-icon name="search" [size]="18" /> Lihat detail laporan
              </a>
              <button class="like" type="button"
                [class.on]="r.liked"
                [disabled]="r.status === 'selesai'"
                [attr.aria-pressed]="r.liked"
                [attr.title]="r.status === 'selesai' ? 'Laporan selesai tidak bisa disukai' : r.liked ? 'Batalkan suka' : 'Suka laporan ini'"
                [attr.aria-label]="'Suka laporan ' + r.id + ', ' + r.likes + ' suka'"
                (click)="like.emit(r.id)">
                <app-icon name="thumb" [size]="20" />
                <span class="count d-only">{{ r.likes }}</span>
                <span class="label m-only">{{ r.status === 'selesai' ? 'Laporan selesai' : r.liked ? 'Anda mendukung' : 'Dukung laporan ini' }} · {{ r.likes }}</span>
              </button>
              @if (r.status !== 'selesai') {
                <small class="like-note m-only">Dengan like postingan ini kamu mendukung agar perbaikan segera dilakukan.</small>
              }
            } @else if (showLike()) {
              <!-- Laporan Saya: jumlah suka hanya ditampilkan -->
              <span class="like static d-only" [attr.aria-label]="r.likes + ' suka'" role="img">
                <app-icon name="thumb" [size]="20" />
                <span class="count d-only">{{ r.likes }}</span>
              </span>
            }
          </span>
          @if (showDetail()) {
            <a class="more m-only" [routerLink]="[base(), r.id]" [queryParams]="from() ? { dari: from() } : null">Lihat detail <app-icon name="right" [size]="14" [stroke]="2.2" /></a>
          }
        </article>
      }
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
    .row.rise { background: var(--blue-50); transition: background 1.2s ease-out; }
    .row { min-height: 78px; padding-block: 12px; border-bottom: 1px solid var(--line); transition: background 0.15s ease; }
    .row:last-child { border-bottom: 0; }
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
    .name:focus-visible { outline: 2px solid var(--blue-600); outline-offset: 4px; border-radius: 4px; }
    .detail-btn:focus-visible { outline: 2px solid var(--blue-600); outline-offset: 2px; }
    .more { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; }

    /* Petunjuk bagian yang bisa diklik: hanya di perangkat dengan kursor */
    @media (hover: hover) {
      .row:hover { background: var(--bg); }
      .name:hover .title { color: var(--blue-600); text-decoration: underline; text-underline-offset: 3px; }
      .like:not(:disabled):not(.static):hover { background: var(--blue-50); color: var(--blue-600); }
      .more:hover { text-decoration: underline; }
    }

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
      .state .like:not(.static) { width: 100%; min-height: 44px; margin-left: 0; padding: 0 16px; gap: 8px; border: 1px solid var(--blue-600); background: var(--white); color: var(--blue-600); font-size: 14px; font-weight: 600; }
      .state .like.on { background: var(--blue-600); color: var(--white); }
      .state .like:disabled { border-color: var(--line); color: var(--muted); background: var(--bg); }
      .detail-btn { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; min-height: 44px; border-radius: 8px; background: var(--blue-600); color: var(--white); font-size: 14px; font-weight: 600; }
      .like-note { display: block; width: 100%; margin-top: -2px; color: var(--muted); font-size: 11px; line-height: 1.4; text-align: center; }
      .more { margin-top: 14px; font-size: 12.5px; }
    }
  `,
})
export class ReportTable {
  reports = input.required<Row[]>();
  loading = input(false);                 // true = data masih dimuat dari backend -> tampilkan kerangka
  from = input<string | null>(null);      // asal daftar (publik, beranda); halaman detail memakainya untuk tombol kembali
  base = input('/laporan');               // awal alamat tautan detail
  buildingFirst = input(false);           // true = gedung jadi baris utama (tampilan petugas)   // data yang ditampilkan
  showLike = input(false);                // tampilkan tombol like? (Laporan Saya dan Publik)
  likeable = input(true);                 // false = jumlah suka hanya ditampilkan (Laporan Saya)
  showDetail = input(false);              // tautan "Lihat detail" di kartu HP
  sortable = input(false);                // tombol urut di kepala kolom Status
  emptyText = input('Belum ada laporan.');
  private host = inject<ElementRef<HTMLElement>>(ElementRef);
  private tops = new Map<string, number>();

  constructor() {
    // Animasi FLIP: setelah urutan berubah, tiap baris meluncur dari posisi lamanya ke posisi baru
    afterRenderEffect(() => {
      this.reports();
      const rows = Array.from(this.host.nativeElement.querySelectorAll<HTMLElement>('.row[data-id]'));
      const next = new Map<string, number>();
      const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
      for (const el of rows) {
        const id = el.dataset['id']!;
        const top = el.offsetTop;
        next.set(id, top);
        const prev = this.tops.get(id);
        if (prev === undefined || prev === top || reduce) continue;
        const dy = prev - top;
        el.animate([{ transform: `translateY(${dy}px)` }, { transform: 'none' }], { duration: 500, easing: 'cubic-bezier(.2,.8,.2,1)' });
        if (dy > 0) {
          // naik ke atas: beri sorotan singkat
          el.classList.add('rise');
          setTimeout(() => el.classList.remove('rise'), 1200);
        }
      }
      this.tops = next;
    });
  }

  like = output<string>();                // nomor tiket saat like ditekan
  sort = output<void>();                  // saat tombol urut ditekan
}
