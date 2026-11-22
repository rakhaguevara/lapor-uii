import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { TechService } from '../../../core/tech/tech.service';
import { Icon } from '../../../shared/icon/icon';
import { PageHead } from '../../../shared/page-head/page-head';
import { StatusBadge } from '../../../shared/status-badge/status-badge';

// DETAIL TUGAS (teknisi): ambil tugas -> mulai penanganan -> selesaikan (foto bukti opsional).
// ?diambil=1 setelah mengambil tugas (judul "Tugas berhasil diambil").
@Component({
  selector: 'app-teknisi-detail',
  imports: [RouterLink, DatePipe, Icon, PageHead, StatusBadge],
  template: `
    <app-page-head [title]="title()" subtitle="Kelola penanganan fasilitas di gedung tanggung jawab Anda."
      [crumbs]="[{ label: 'Portal Teknisi', link: '/teknisi' }, { label: title() }]">
      <a class="btn" routerLink="/teknisi/tugas"><app-icon name="left" [size]="16" [stroke]="2" /> Daftar tugas</a>
    </app-page-head>

    @if (r(); as r) {
      <div class="split">
        <article class="card detail">
          <div class="top"><span class="ticket">{{ r.id }}</span><app-status-badge [status]="r.status" /></div>
          <h2>{{ r.title }}</h2>
          <p class="sub">{{ r.building }}{{ r.floor ? ' · ' + r.floor : '' }} · {{ r.room }}</p>
          @if (proof() || r.photoUrl) {
            <img class="photo" [src]="proof() || r.photoUrl" [alt]="proof() ? 'Bukti penyelesaian' : 'Foto kerusakan: ' + r.title">
            <p class="cap">{{ proof() ? 'BUKTI PENYELESAIAN' : 'FOTO KERUSAKAN' }}</p>
          }
          <h3>Deskripsi kerusakan</h3>
          <p>{{ r.description }}</p>
          <div class="meta">
            <span>Dilaporkan {{ r.createdAt | date: 'd MMM y, HH.mm' : '' : 'id' }}</span>
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
              <p class="sub">Anda bertanggung jawab atas tugas ini.</p>
              <button class="btn btn-primary act" type="button" [disabled]="busy()" (click)="start()">Mulai penanganan</button>
              <button class="btn act" style="margin-top: 12px" type="button" (click)="giveBack()">Kembalikan tugas</button>
              @if (taken()) { <p class="hint ok"><app-icon name="check" [size]="14" [stroke]="2.4" /> Tugas berhasil Anda ambil.</p> }
            } @else if (r.status === 'diproses' || r.status === 'menunggu') {
              <p class="assignee">Sedang Anda tangani</p>
              <div class="field" style="margin-top: 12px">
                <label for="bukti">Foto bukti perbaikan (opsional)</label>
                <input id="bukti" type="file" accept="image/jpeg,image/png" (change)="file.set($any($event.target).files?.[0] ?? null)">
              </div>
              <button class="btn btn-primary act" type="button" [disabled]="busy()" (click)="finish()">Selesaikan tugas</button>
            } @else {
              <p class="assignee">{{ r.status === 'selesai' ? 'Diselesaikan oleh Anda' : 'Tidak dapat diperbaiki' }}</p>
              <a class="btn btn-primary act" routerLink="/teknisi/tugas">Kembali ke daftar tugas</a>
            }
            @if (error()) { <p class="error" role="alert" style="margin-top: 12px; color: var(--red); font-size: 12px">{{ error() }}</p> }
          </section>

          <section class="card panel">
            <h2>Riwayat penanganan</h2>
            <ol class="tl" style="margin-top: 24px">
              <li class="done"><strong>Laporan diterima</strong><small>{{ r.createdAt | date: 'd MMM · HH.mm' : '' : 'id' }}</small></li>
              <li [class.done]="!!a()"><strong>{{ a() ? 'Teknisi ditetapkan' : 'Menunggu teknisi' }}</strong>
                <small>{{ a() ? (a()!.at | date: 'd MMM · HH.mm' : '' : 'id') : 'Belum dimulai' }}</small></li>
              <li [class.done]="r.status === 'diproses' || r.status === 'selesai'"><strong>{{ r.status === 'selesai' ? 'Perbaikan selesai' : 'Pengerjaan' }}</strong>
                <small>{{ r.status === 'selesai' ? 'Tugas telah diselesaikan' : 'Lihat status saat ini' }}</small></li>
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
    .cap { margin: -12px 0 20px; color: var(--muted); font-size: 11px; font-weight: 600; letter-spacing: 0.02em; }
    .hint { margin-top: 16px; }
    .hint.ok { display: flex; align-items: center; gap: 6px; color: var(--green); font-size: 13px; }
  `,
})
export class TeknisiDetail {
  private tech = inject(TechService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private id = toSignal(this.route.paramMap.pipe(map((p) => p.get('id') ?? '')), { initialValue: '' });
  taken = toSignal(this.route.queryParamMap.pipe(map((q) => q.has('diambil'))), { initialValue: false });

  file = signal<File | null>(null);
  busy = signal(false);
  error = signal('');

  r = computed(() => this.tech.find(this.id()));
  a = computed(() => (this.r()?.technician ? { at: this.r()!.assignedAt } : null));
  owner = computed(() => this.r()?.technician ?? '');
  mine = computed(() => !!this.owner() && (this.owner() === this.tech.me() || this.r()?.technicianUuid === this.auth.uuid()));
  proof = computed(() => this.tech.proofs()[this.id()] ?? '');
  title = computed(() => {
    const s = this.r()?.status;
    if (this.taken()) return 'Tugas berhasil diambil';
    if (s === 'selesai') return 'Tugas selesai';
    return s === 'dikirim' ? 'Detail tugas tersedia' : 'Detail tugas';
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

  // Kembalikan tugas dengan alasan (POST /reports/respond-assignment, action REJECT)
  async giveBack(): Promise<void> {
    const reason = prompt('Alasan mengembalikan tugas:')?.trim();
    if (!reason) return;
    try { this.error.set(''); await this.tech.reject(this.r()!.uuid, reason); this.router.navigate(['/teknisi/tugas']); } catch { this.error.set('Tugas belum bisa dikembalikan. Coba lagi.'); }
  }
  start(): Promise<void> { return this.run('DIPROSES'); }
  finish(): Promise<void> { return this.run('SELESAI'); }

  private async run(status: 'DIPROSES' | 'SELESAI'): Promise<void> {
    this.busy.set(true);
    this.error.set('');
    try {
      await this.tech.setStatus(this.r()!.uuid, this.id(), status, this.file());
      if (status === 'SELESAI') this.router.navigate(['/teknisi/tugas', this.id()]);
    } catch {
      this.error.set('Status belum bisa diubah. Coba lagi.');
    }
    this.busy.set(false);
  }
}
