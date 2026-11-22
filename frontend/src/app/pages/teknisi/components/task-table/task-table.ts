import { DatePipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminReport } from '../../../../core/admin/admin.service';
import { Icon } from '../../../../shared/icon/icon';
import { StatusBadge } from '../../../../shared/status-badge/status-badge';

/*
  TABEL TUGAS (khusus teknisi, dibuat terpisah dari tabel laporan pelapor).
  Desktop: Tiket / kerusakan, Lokasi (ruangan, gedung kecil di bawahnya), Tanggal, Status + jumlah suka.
  HP: tiap tugas menjadi kartu dengan tautan "Lihat detail".
  Hanya menampilkan data dari induk; tidak mengambil data sendiri.
*/
@Component({
  selector: 'app-task-table',
  imports: [RouterLink, DatePipe, StatusBadge, Icon],
  template: `
    @if (tasks().length === 0) {
      <p class="empty">{{ emptyText() }}</p>
    } @else {
      <div class="head d-only">
        <span>Tiket / kerusakan</span><span>Lokasi</span><span>Tanggal</span>
        <span class="status-h">Status</span>
      </div>
      @for (t of tasks(); track t.id) {
        <article class="row">
          <a class="name" [routerLink]="['/teknisi/tugas', t.id]">
            <span class="ticket">{{ t.id }}<span class="m-only"> · {{ t.createdAt | date: 'd MMM y' }}</span></span>
            <span class="title">{{ t.title }}</span>
          </a>
          <span class="where">{{ t.room }}{{ t.floor ? ' · ' + t.floor : '' }}<small>{{ t.building }}</small></span>
          <span class="when d-only">{{ t.createdAt | date: 'd MMM y' }}</span>
          <span class="state">
            <app-status-badge [status]="t.status" />
            <span class="like d-only" role="img" [attr.aria-label]="t.likes + ' suka'"><app-icon name="thumb" [size]="20" /> {{ t.likes }}</span>
          </span>
          <a class="more m-only" [routerLink]="['/teknisi/tugas', t.id]">Lihat detail <app-icon name="right" [size]="14" [stroke]="2.2" /></a>
        </article>
      }
    }
  `,
  styles: `
    :host { display: block; }
    .head, .row { display: grid; grid-template-columns: 2.1fr 1.33fr 1fr 0.8fr; align-items: center; padding: 0 16px; }
    .head { height: 40px; background: var(--bg); border-radius: 8px; color: var(--muted); font-size: 11px; font-weight: 600; }
    .row { min-height: 78px; padding-block: 12px; }
    .name { display: flex; flex-direction: column; color: var(--ink); }
    .ticket { color: var(--blue-600); font-size: 11px; line-height: 1.5; }
    .title { font-weight: 600; font-size: 14px; line-height: 1.5; }
    .where { font-size: 13px; line-height: 1.5; }
    .where small { display: block; color: var(--muted); font-size: 11px; }
    .when { color: var(--muted); font-size: 12px; }
    .state { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
    .like { display: inline-flex; align-items: center; gap: 4px; color: var(--muted); font-size: 14px; }
    .more { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; }

    @media (max-width: 800px) {
      .row { display: flex; flex-direction: column; align-items: flex-start; margin-bottom: 16px; padding: 16px; border: 1px solid var(--line); border-radius: var(--r-card); background: var(--white); }
      .name { width: 100%; }
      .ticket { color: var(--muted); }
      .title { margin: 6px 0 10px; font-size: 15px; font-weight: 700; line-height: 1.4; }
      .where { color: var(--muted); font-size: 12px; }
      .where small { font-size: 12px; }
      .state { width: 100%; margin-top: 16px; flex-direction: column; align-items: flex-start; gap: 8px; }
      .more { margin-top: 14px; font-size: 12.5px; }
    }
  `,
})
export class TaskTable {
  tasks = input.required<AdminReport[]>();
  emptyText = input('Tidak ada tugas.');
}
