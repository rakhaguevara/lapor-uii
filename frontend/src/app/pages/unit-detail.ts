import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { AdminService, PRIORITY_LABEL } from '../core/admin.service';
import { ALL_STATUS_LABEL } from '../core/report.model';
import { Icon } from '../shared/icon';
import { PageHead } from '../shared/page-head';
import { StatusBadge } from '../shared/status-badge';

// DETAIL LAPORAN (Admin Unit): isi laporan, teknisi penanggung jawab, dan riwayat.
// Dengan ?tersimpan=1 judulnya menjadi "Penugasan tersimpan" (setelah konfirmasi penugasan).
@Component({
  selector: 'app-unit-detail',
  imports: [RouterLink, DatePipe, Icon, PageHead, StatusBadge],
  template: `
    <app-page-head [title]="saved() ? 'Penugasan tersimpan' : 'Detail laporan'" subtitle="Prioritaskan laporan dan koordinasikan penanganan fasilitas."
      [crumbs]="[{ label: 'Portal Admin Unit', link: '/unit' }, { label: saved() ? 'Penugasan tersimpan' : 'Detail laporan' }]">
      <a class="btn" routerLink="/unit/laporan"><app-icon name="left" [size]="16" [stroke]="2" /> Kelola laporan</a>
    </app-page-head>

    @if (r(); as r) {
      <div class="split">
        <article class="card detail">
          <div class="top"><span class="ticket">{{ r.id }}</span><app-status-badge [status]="r.status" /></div>
          <h2>{{ r.title }}</h2>
          <p class="sub">{{ r.building }}{{ r.floor ? ' · ' + r.floor : '' }} · {{ r.room }}</p>
          @if (r.photoUrl) { <img class="photo" [src]="r.photoUrl" [alt]="'Foto kerusakan: ' + r.title"> }
          <h3>Deskripsi kerusakan</h3>
          <p>{{ r.description }}</p>
          <div class="meta">
            <span>Kategori: {{ r.category }}</span>
            <span>{{ r.createdAt | date: 'd MMMM y · HH.mm' : '' : 'id' }} WIB</span>
            <span><app-icon name="thumb" [size]="18" /> {{ r.likes }}</span>
          </div>
        </article>

        <div class="stack">
          <section class="card panel">
            <h2>Pengelolaan laporan</h2>
            <p class="sub" style="margin-top: 24px">Teknisi penanggung jawab</p>
            <p class="assignee">{{ a()?.tech ?? 'Belum ditugaskan' }}</p>
            @if (open()) {
              <a class="btn btn-primary" style="width: 100%" [routerLink]="['/unit/laporan', r.id, 'tugaskan']">{{ a() ? 'Ubah penugasan' : 'Tugaskan teknisi' }}</a>
            } @else { <p class="hint">Status laporan: {{ label(r.status) }}.</p> }
            <div class="field" style="margin-top: 20px">
              <label for="prio">Prioritas</label>
              <select id="prio" [disabled]="!open()" (change)="setPriority($any($event.target).value)">
                @for (p of priorities; track p[0]) { <option [value]="p[0]" [selected]="p[0] === r.priority">{{ p[1] }}</option> }
              </select>
              @if (error()) { <span class="error" role="alert">{{ error() }}</span> }
            </div>
          </section>

          <section class="card panel">
            <h2>Riwayat laporan</h2>
            <ol class="tl" style="margin-top: 24px">
              <li class="done"><strong>Dikirim</strong><small>{{ r.createdAt | date: 'd MMM · HH.mm' : '' : 'id' }}</small></li>
              @if (a(); as x) {
                <li class="done"><strong>Ditugaskan ke {{ x.tech }}</strong><small>{{ x.at ? (x.at | date: 'd MMM · HH.mm' : '' : 'id') : 'Penugasan tersimpan' }}</small></li>
              } @else {
                <li><strong>Menunggu penugasan Admin Unit</strong><small>Menunggu penugasan teknisi</small></li>
              }
              @if (r.status === 'diproses' || r.status === 'menunggu' || r.status === 'selesai' || r.status === 'gagal') {
                <li class="done"><strong>{{ label(r.status) }}</strong><small>Status terbaru dari teknisi</small></li>
              }
            </ol>
          </section>
        </div>
      </div>
    } @else {
      <p class="empty">Laporan tidak ditemukan.</p>
    }
  `,
})
export class UnitDetail {
  private admin = inject(AdminService);
  private route = inject(ActivatedRoute);
  private id = toSignal(this.route.paramMap.pipe(map((p) => p.get('id') ?? '')), { initialValue: '' });
  saved = toSignal(this.route.queryParamMap.pipe(map((q) => q.has('tersimpan'))), { initialValue: false });
  label = (s: string) => ALL_STATUS_LABEL[s];

  r = computed(() => this.admin.find(this.id()));
  a = computed(() => (this.r()?.technician ? { tech: this.r()!.technician, at: this.r()!.assignedAt } : null));
  priorities = Object.entries(PRIORITY_LABEL);
  error = signal('');

  async setPriority(p: string): Promise<void> {
    try { this.error.set(''); await this.admin.setPriority(this.r()!.uuid, p); } catch { this.error.set('Prioritas belum bisa diubah. Coba lagi.'); }
  }
  open = computed(() => ['dikirim', 'ditugaskan'].includes(this.r()?.status ?? ''));
}
