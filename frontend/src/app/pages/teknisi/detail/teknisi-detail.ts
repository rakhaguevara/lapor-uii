import { onPhotoError } from '../../../core/reports/photo-url';
import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { PRIORITY_LABEL } from '../../../core/admin/admin.service';
import { AuthService } from '../../../core/auth/auth.service';
import { TechService } from '../../../core/tech/tech.service';
import { Icon } from '../../../shared/icon/icon';
import { PageHead } from '../../../shared/page-head/page-head';
import { StatusBadge } from '../../../shared/status-badge/status-badge';

/*
  DETAIL TUGAS (teknisi). Satu halaman, tampilannya mengikuti status tugas:
    dikirim                  Detail tugas tersedia        [Ambil tugas]
    ditugaskan (ambil sendiri, ?diambil=1)  Tugas berhasil diambil   [Mulai penanganan]
    ditugaskan (dari Admin Unit)            Penugasan dari Admin Unit [Terima & mulai] [Tolak penugasan]
    diproses                 Penanganan berjalan          [Perbarui status]
    menunggu                 Menunggu suku cadang         [Perbarui status]
    selesai                  Tugas selesai
    gagal                    Hasil pemeriksaan
  Form pembaruan status ada di ../status, penolakan di ../reject.
*/
@Component({
  selector: 'app-teknisi-detail',
  imports: [RouterLink, DatePipe, Icon, PageHead, StatusBadge],
  template: `
    <app-page-head [title]="title()" subtitle="Kelola penanganan fasilitas di gedung tanggung jawab Anda."
      [crumbs]="[{ label: 'Portal Teknisi', link: '/teknisi' }, { label: crumb() }]">
      <a class="btn" routerLink="/teknisi/tugas"><app-icon name="left" [size]="16" [stroke]="2" /> Daftar tugas</a>
    </app-page-head>

    @if (r(); as r) {
      <div class="split">
        <article class="card detail">
          <div class="top"><span class="ticket">{{ r.id }}</span><app-status-badge [status]="r.status" /></div>
          <h2>{{ r.title }}</h2>
          <p class="sub">{{ r.building }}{{ r.floor ? ' · ' + r.floor : '' }} · {{ r.room }}</p>
          @if (proof() || r.photoUrl) {
            <img class="photo" (error)="onPhotoError($event)" [src]="proof() || r.photoUrl" [alt]="proof() ? 'Bukti penanganan' : 'Foto kerusakan: ' + r.title">
            <p class="cap">{{ caption() }}</p>
          }
          <h3>Deskripsi kerusakan</h3>
          <p>{{ r.description }}</p>
          <div class="meta">
            <span>{{ showPriority() ? 'Prioritas: ' + priority() + ' · ' : '' }}Dilaporkan {{ r.createdAt | date: 'd MMM y, HH.mm' : '' : 'id' }}</span>
            <span><app-icon name="thumb" [size]="18" /> {{ r.likes }}</span>
          </div>
        </article>

        <div class="stack">
          <section class="card panel">
            <h2>Penanganan tugas</h2>
            @if (!owner()) {
              <p class="assignee">Belum ada teknisi</p>
              <p class="sub">Ambil tugas ini untuk mulai menangani.</p>
              <button class="btn btn-primary act" type="button" [disabled]="busy()" (click)="take()">Ambil tugas</button>
              <p class="hint">Tugas hanya dapat diambil oleh satu teknisi.</p>
            } @else if (!mine()) {
              <p class="assignee">{{ owner() }}</p>
              <p class="sub">Tugas ini ditangani teknisi lain.</p>
            } @else if (r.status === 'ditugaskan') {
              <p class="assignee">{{ owner() }} · Anda</p>
              @if (taken()) {
                <p class="sub">Anda bertanggung jawab atas tugas ini.</p>
                <button class="btn btn-primary act" type="button" [disabled]="busy()" (click)="start(false)">Mulai penanganan</button>
                <p class="hint ok"><app-icon name="check" [size]="14" [stroke]="2.4" /> Tugas berhasil Anda ambil.</p>
              } @else {
                <p class="sub">Ditugaskan oleh Admin Unit UII.</p>
                <button class="btn btn-primary act" type="button" [disabled]="busy()" (click)="start(true)">Terima &amp; mulai</button>
                <a class="btn btn-danger-soft act2" [routerLink]="['/teknisi/tugas', r.id, 'tolak']">Tolak penugasan</a>
              }
            } @else if (r.status === 'diproses' || r.status === 'menunggu') {
              <p class="assignee">{{ owner() }} · Anda</p>
              <p class="sub">{{ r.status === 'menunggu' ? 'Menunggu pengadaan suku cadang.' : 'Anda bertanggung jawab atas tugas ini.' }}</p>
              <a class="btn btn-primary act" [routerLink]="['/teknisi/tugas', r.id, 'status']">Perbarui status</a>
            } @else {
              <p class="assignee">{{ r.status === 'selesai' ? 'Diselesaikan oleh Anda' : 'Hasil pemeriksaan Anda' }}</p>
              @if (r.updatedAt) { <p class="sub">{{ r.updatedAt | date: 'd MMM y · HH.mm' : '' : 'id' }} WIB</p> }
              <a class="btn btn-primary act" routerLink="/teknisi/tugas">Kembali ke daftar tugas</a>
            }
            @if (error()) { <p class="error" role="alert">{{ error() }}</p> }
          </section>

          <section class="card panel">
            <h2>Riwayat penanganan</h2>
            <ol class="tl" style="margin-top: 24px">
              <li class="done"><strong>Laporan diterima</strong><small>{{ r.createdAt | date: 'd MMM · HH.mm' : '' : 'id' }}</small></li>
              <li><strong>{{ owner() ? 'Teknisi ditetapkan' : 'Menunggu teknisi' }}</strong>
                <small>{{ !owner() ? 'Belum dimulai' : r.assignedAt ? (r.assignedAt | date: 'd MMM · HH.mm' : '' : 'id') : 'Telah ditetapkan' }}</small></li>
              <li><strong>{{ last().title }}</strong>
                <small>{{ last().date ? (last().date | date: 'd MMM · HH.mm' : '' : 'id') : last().note }}</small></li>
            </ol>
          </section>
        </div>
      </div>
    } @else {
      <p class="empty">Tugas tidak ditemukan.</p>
    }
  `,
  styles: `
    .act { width: 100%; margin-top: 28px; }
    .act2 { width: 100%; margin-top: 12px; }
    .cap { margin: -12px 0 20px; color: var(--muted); font-size: 11px; font-weight: 600; letter-spacing: 0.02em; }
    .hint { margin-top: 16px; }
    .hint.ok { display: flex; align-items: center; gap: 6px; color: var(--green); font-size: 13px; }
    .error { margin-top: 12px; color: var(--red); font-size: 12px; }
  `,
})
export class TeknisiDetail {
  readonly onPhotoError = onPhotoError;
  private tech = inject(TechService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private id = toSignal(this.route.paramMap.pipe(map((p) => p.get('id') ?? '')), { initialValue: '' });
  taken = toSignal(this.route.queryParamMap.pipe(map((q) => q.has('diambil'))), { initialValue: false });

  busy = signal(false);
  error = signal('');

  r = computed(() => this.tech.find(this.id()));
  owner = computed(() => this.r()?.technician ?? '');
  mine = computed(() => !!this.owner() && (this.owner() === this.tech.me() || this.r()?.technicianUuid === this.auth.uuid()));
  proof = computed(() => this.tech.proofs()[this.id()] ?? '');
  priority = computed(() => PRIORITY_LABEL[this.r()?.priority ?? ''] ?? '');
  showPriority = computed(() => !!this.owner() && this.r()?.priority !== 'NORMAL' && !!this.priority());

  title = computed(() => {
    const r = this.r();
    if (!r) return 'Detail tugas';
    if (this.taken() && r.status === 'ditugaskan') return 'Tugas berhasil diambil';
    switch (r.status) {
      case 'dikirim': return 'Detail tugas tersedia';
      case 'ditugaskan': return this.mine() ? 'Penugasan dari Admin Unit' : 'Detail tugas';
      case 'diproses': return 'Penanganan berjalan';
      case 'menunggu': return 'Menunggu suku cadang';
      case 'selesai': return 'Tugas selesai';
      default: return 'Hasil pemeriksaan';
    }
  });
  // Di desain, tugas "tidak dapat diperbaiki" memakai breadcrumb "Tugas selesai"
  crumb = computed(() => (this.r()?.status === 'gagal' ? 'Tugas selesai' : this.title()));
  caption = computed(() => {
    const s = this.r()?.status;
    if (!this.proof()) return 'FOTO KERUSAKAN';
    return s === 'gagal' ? 'BUKTI PEMERIKSAAN' : s === 'selesai' ? 'BUKTI PENYELESAIAN' : 'FOTO KERUSAKAN';
  });
  // Langkah terakhir riwayat mengikuti status
  last = computed(() => {
    const r = this.r();
    switch (r?.status) {
      case 'diproses': return { title: 'Pengerjaan', note: 'Sedang berlangsung', date: '' };
      case 'menunggu': return { title: 'Menunggu komponen', note: 'Lihat status saat ini', date: '' };
      case 'selesai': return { title: 'Perbaikan selesai', note: 'Tugas telah diselesaikan', date: r.updatedAt };
      case 'gagal': return { title: 'Tidak dapat diperbaiki', note: 'Hasil pemeriksaan tercatat', date: r.updatedAt };
      default: return { title: 'Pengerjaan', note: 'Lihat status saat ini', date: '' };
    }
  });

  async take(): Promise<void> {
    this.busy.set(true);
    this.error.set('');
    try {
      await this.tech.take(this.r()!.uuid);
      this.router.navigate(['/teknisi/tugas', this.id()], { queryParams: { diambil: 1 } });
    } catch {
      this.error.set('Tugas belum bisa diambil. Mungkin sudah diambil teknisi lain.');
    }
    this.busy.set(false);
  }

  // accept=true: tugas dari Admin Unit dulu diterima (ACCEPT), lalu status menjadi Diproses
  async start(accept: boolean): Promise<void> {
    this.busy.set(true);
    this.error.set('');
    try {
      const r = this.r()!;
      if (accept) await this.tech.accept(r.uuid);
      await this.tech.setStatus(r.uuid, r.id, 'DIPROSES');
      this.router.navigate(['/teknisi/tugas', r.id]);
    } catch {
      this.error.set('Penanganan belum bisa dimulai. Coba lagi.');
    }
    this.busy.set(false);
  }
}
