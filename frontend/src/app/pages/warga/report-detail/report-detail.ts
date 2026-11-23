import { onPhotoError } from '../../../core/reports/photo-url';
import { DatePipe } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { Report, STEP_REACHED, byPublicOrder, StatusCode, TIMELINE_STEPS } from '../../../core/reports/report.model';
import { ReportService } from '../../../core/reports/report.service';
import { errorMessage } from '../../../core/http/api-error';
import { ToastService } from '../../../core/ui/toast.service';
import { Dialog } from '../../../shared/dialog/dialog';
import { UnlikeDialog } from '../../../shared/unlike-dialog/unlike-dialog';
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
  imports: [RouterLink, DatePipe, Icon, PageHead, StatusBadge, Dialog, UnlikeDialog],
  template: `
    <a class="btn back m-only" [routerLink]="back().link"><app-icon name="left" [size]="16" [stroke]="2.2" /> {{ back().label }}</a>

    <app-page-head
      title="Detail laporan"
      subtitle="Layanan fasilitas yang transparan, dari laporan hingga penyelesaian."
      [desktopOnly]="true"
      [crumbs]="[{ label: 'Portal Pelapor', link: '/portal' }, { label: 'Detail laporan' }]">
      <a class="btn d-only" [routerLink]="back().link"><app-icon name="left" [size]="16" [stroke]="2" /> {{ back().label }}</a>
    </app-page-head>

    @if (skipped().length) {
      <p class="notice" role="status">{{ skipped().join(', ') }} tidak dapat dibuka, jadi laporan berikutnya yang tersedia ditampilkan.</p>
    }

    @if (report(); as r) {
      <div class="layout">
        <article class="card main">
          <div class="top">
            <span class="ticket">{{ r.id }}</span>
            <div class="top-right">
              <app-status-badge [status]="r.status" />
              @if (isMine()) {
                <!-- Edit dan hapus hanya untuk pemilik, selama laporan masih berstatus Dikirim (belum ditugaskan) -->
                <div class="owner-btns" [attr.title]="editable() ? null : 'Laporan yang sudah diproses petugas tidak dapat diubah atau dihapus'">
                  <button class="btn btn-danger-soft" type="button" [disabled]="!editable()" (click)="deleting.set(true)"><app-icon name="trash" [size]="16" /> Hapus</button>
                </div>
              }
            </div>
          </div>
          <h2>{{ r.title }}</h2>
          <p class="where">
            <span>{{ r.building }}</span>
            <span>{{ r.floor ? r.floor + ' · ' : '' }}{{ r.room }}</span>
          </p>

          @if (r.photoUrl) {
            <img class="photo" (error)="onPhotoError($event)" [src]="r.photoUrl" [alt]="'Foto kerusakan: ' + r.title">
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
          @if (likeable()) {
            <!-- Laporan publik: suka bisa ditekan. Batal suka meminta konfirmasi. -->
            <button class="likes like-btn" type="button" [class.on]="r.liked"
              [disabled]="r.status === 'selesai' || likeBusy()"
              [attr.aria-pressed]="r.liked"
              [attr.title]="r.status === 'selesai' ? 'Laporan selesai tidak bisa disukai' : r.liked ? 'Batalkan suka' : 'Suka laporan ini'"
              [attr.aria-label]="'Suka laporan ' + r.id + ', ' + r.likes + ' suka'"
              (click)="onLike()">
              <app-icon name="thumb" [size]="22" /> {{ r.likes }}
              <span class="like-text">{{ r.status === 'selesai' ? 'Laporan selesai' : r.liked ? 'Anda mendukung' : 'Dukung laporan ini' }}</span>
            </button>
          } @else {
            <p class="likes d-only"><app-icon name="thumb" [size]="22" /> {{ r.likes }}</p>
          }

          @if (neighbours(); as n) {
            <!-- Pindah ke laporan lain pada daftar asal tanpa kembali ke daftar -->
            <nav class="pager" aria-label="Laporan lainnya">
              @if (n.prev) {
                <a class="btn" [routerLink]="['/laporan', n.prev]" [queryParams]="params()" (click)="move(-1)"><app-icon name="left" [size]="16" [stroke]="2" /> Sebelumnya</a>
              } @else {
                <button class="btn" type="button" disabled><app-icon name="left" [size]="16" [stroke]="2" /> Sebelumnya</button>
              }
              <span class="pos">{{ n.pos }} dari {{ n.total }}</span>
              @if (n.next) {
                <a class="btn" [routerLink]="['/laporan', n.next]" [queryParams]="params()" (click)="move(1)">Berikutnya <app-icon name="right" [size]="16" [stroke]="2" /></a>
              } @else {
                <button class="btn" type="button" disabled>Berikutnya <app-icon name="right" [size]="16" [stroke]="2" /></button>
              }
            </nav>
          }
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
      <!-- Kerangka halaman selagi data dimuat; muncul setelah jeda singkat agar tidak berkedip -->
      <div class="layout sk-fade" role="status" aria-label="Memuat laporan">
        <div class="card main">
          <div class="sk-row"><span class="sk" style="width: 90px"></span><span class="sk" style="width: 80px; height: 28px; border-radius: 14px"></span></div>
          <span class="sk" style="width: 70%; height: 32px; margin-top: 8px"></span>
          <span class="sk" style="width: 45%; height: 16px; margin-top: 16px"></span>
          <span class="sk" style="width: 100%; height: 220px; margin-top: 24px; border-radius: 12px"></span>
          <span class="sk" style="width: 120px; height: 12px; margin-top: 24px"></span>
          <span class="sk" style="width: 200px; height: 20px; margin-top: 12px"></span>
          <span class="sk" style="width: 100%; height: 14px; margin-top: 16px"></span>
          <span class="sk" style="width: 80%; height: 14px; margin-top: 10px"></span>
        </div>
        <aside>
          <div class="card"><span class="sk" style="width: 160px; height: 20px"></span>
            <span class="sk" style="width: 100%; height: 14px; margin-top: 28px"></span>
            <span class="sk" style="width: 100%; height: 14px; margin-top: 24px"></span>
            <span class="sk" style="width: 100%; height: 14px; margin-top: 24px"></span></div>
          <div class="card"><span class="sk" style="width: 200px; height: 20px"></span><span class="sk" style="width: 90%; height: 14px; margin-top: 16px"></span></div>
        </aside>
      </div>
    } @else {
      <p class="empty">
        @if (skipped().length) { {{ skipped().join(', ') }} tidak dapat dibuka dan tidak ada laporan lain pada arah itu. }
        @else { Laporan tidak ditemukan. }
        <a [routerLink]="back().link">Kembali ke {{ back().label }}</a>
      </p>
    }

    @if (unliking() && report(); as r) {
      <app-unlike-dialog [id]="r.id" [title]="r.title" (confirm)="confirmUnlike()" (cancel)="unliking.set(false)" />
    }
    @if (deleting() && report(); as r) {
      <app-dialog title="Hapus laporan ini?" confirmLabel="Ya, hapus" busyLabel="Menghapus…" [danger]="true"
        [message]="'Laporan ' + r.id + ' (' + r.title + ') akan dihapus. Tindakan ini tidak dapat dibatalkan.'"
        [busy]="deleteBusy()" [error]="deleteError()" (confirm)="confirmDelete()" (cancel)="closeDelete()" />
    }
  `,
  styles: `
    .top-right { display: flex; flex-direction: column; align-items: flex-end; gap: 12px; }
    .owner-btns { display: flex; gap: 8px; }
    .owner-btns .btn { min-height: 36px; padding: 0 14px; font-size: 12px; }
    .layout { display: grid; grid-template-columns: 1fr 383px; gap: 24px; align-items: start; }
    aside { display: grid; gap: 24px; }
    .main { display: flex; flex-direction: column; }
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
    .reported { order: 7; margin-top: 32px; color: var(--muted); font-size: 12px; }
    .likes { order: 8; display: flex; align-items: center; gap: 8px; margin-top: 32px; color: var(--muted); font-size: 14px; font-weight: 500; }
    /* Di sisi kanan kartu supaya mudah dijangkau ibu jari, tombol berbingkai agar jelas bisa ditekan */
    .like-btn { align-self: flex-end; min-height: 44px; padding: 0 16px; border: 1px solid var(--line); border-radius: 999px; background: var(--white); cursor: pointer; }
    .like-btn:hover:not(:disabled) { background: var(--blue-50); border-color: var(--blue-600); color: var(--blue-600); }
    .like-btn.on { border-color: var(--blue-600); background: var(--blue-600); color: var(--white); font-weight: 600; }
    .like-btn.on:hover:not(:disabled) { background: #0759bb; color: var(--white); }
    .like-btn:disabled { opacity: 0.55; cursor: default; }
    .like-text { font-size: 12px; font-weight: 500; }
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

    .pager { order: 9; display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 24px; padding-top: 20px; border-top: 1px solid var(--line); }
    .pager .pos { color: var(--muted); font-size: 13px; text-align: center; }
    .pager .btn { padding: 0 20px; }
    .pager .btn:disabled { opacity: 0.45; cursor: default; }
    .notice { margin-bottom: 16px; padding: 12px 16px; border-radius: var(--r-ctl); background: var(--amber-bg); color: var(--amber); font-size: 13px; }
    .skeleton .card { display: flex; flex-direction: column; }
    .sk-row { display: flex; justify-content: space-between; align-items: center; }
    .back { width: 100%; margin-bottom: 20px; border-radius: 12px; color: var(--blue-600); }

    @media (max-width: 800px) {
      .layout { grid-template-columns: 1fr; gap: 16px; }
      aside { gap: 16px; }
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
      .reported { margin-top: 16px; font-size: 11px; }
      .pager .btn { flex: 1; padding: 0 8px; }
      .top { align-items: flex-start; }
      .top-right { align-items: flex-start; }
      .pager .pos { order: -1; width: 100%; }
      .pager { flex-wrap: wrap; }
      .timeline { margin-top: 20px; }
    }
  `,
})
export class ReportDetail {
  readonly onPhotoError = onPhotoError;
  private service = inject(ReportService);
  private route = inject(ActivatedRoute);
  steps = TIMELINE_STEPS;
  // Ambil nomor tiket dari URL lalu cari laporannya. Tidak ketemu -> undefined -> tampil pesan.
  // Nomor tiket dibaca sebagai signal: pindah laporan lewat tombol sebelumnya/berikutnya memakai
  // komponen yang sama, jadi data harus dimuat ulang tiap alamat berubah.
  report = signal<Report | undefined>(undefined);
  loading = signal(true);

  private id = toSignal(this.route.paramMap.pipe(map((p) => p.get('id') ?? '')), { initialValue: '' });
  private from = toSignal(this.route.queryParamMap);

  // Tombol kembali mengikuti asal pengguna (?dari=...). Tanpa penanda -> Laporan Saya.
  back = computed(() => {
    switch (this.from()?.get('dari')) {
      case 'publik': return { link: '/laporan-publik', label: 'Laporan publik' };
      case 'beranda': return { link: '/beranda', label: 'Beranda' };
      default: return { link: '/laporan-saya', label: 'Laporan Saya' };
    }
  });

  // Urutan laporan untuk sebelumnya/berikutnya: ikut daftar asal bila masih tersimpan,
  // jika tidak (halaman dimuat ulang atau dibuka dari Beranda) pakai urutan bawaan.
  private order = computed(() => {
    const origin = this.from()?.get('dari');
    const want = origin === 'publik' ? 'publik' : 'saya';
    const nav = this.service.nav();
    if (origin !== 'beranda' && nav.source === want && nav.ids.includes(this.id())) return nav.ids;
    return origin === 'publik'
      ? [...this.service.publicReports()].sort(byPublicOrder).map((r) => r.id)
      : this.service.reports().map((r) => r.id);
  });

  neighbours = computed(() => {
    const ids = this.order();
    const i = ids.indexOf(this.id());
    if (i < 0) return null;
    return { prev: ids[i - 1] ?? null, next: ids[i + 1] ?? null, pos: i + 1, total: ids.length };
  });

  // Pertahankan penanda asal (?dari=) saat pindah laporan
  params = computed(() => {
    const dari = this.from()?.get('dari');
    return dari ? { dari } : null;
  });

  private router = inject(Router);
  skipped = signal<string[]>([]);   // laporan yang gagal dibuka lalu dilewati
  private dir = 0;                  // arah klik terakhir: 1 = berikutnya, -1 = sebelumnya, 0 = bukan dari tombol
  private reversed = false;

  // Dipanggil saat Sebelumnya/Berikutnya ditekan
  move(dir: 1 | -1): void {
    this.dir = dir;
    this.reversed = false;
    this.skipped.set([]);
  }

  constructor() {
    effect(() => {
      const id = this.id();
      this.report.set(undefined);   // kosongkan dulu agar kerangka pemuatan tampil, bukan laporan lama
      this.loading.set(true);
      this.service.find(id).then((r) => {
        if (id !== this.id()) return;                       // pengguna sudah pindah lagi
        if (r) {
          this.dir = 0;
          this.report.set(r);
          window.scrollTo({ top: 0 });
        } else if (!this.skipToNext(id)) {
          this.dir = 0;
        }
        if (r || this.dir === 0) this.loading.set(false);
      });
    });
  }

  // Laporan rusak atau hilang: geser ke laporan terdekat yang ada pada arah yang sama.
  // Bila sudah habis, sekali saja berbalik arah; bila tetap tidak ada, tampilkan pesan.
  private skipToNext(id: string): boolean {
    if (this.dir === 0) return false;
    const ids = this.order();
    const i = ids.indexOf(id);
    if (i < 0) return false;
    let target = ids[i + this.dir];
    if (!target && !this.reversed) {
      this.reversed = true;
      this.dir = -this.dir as 1 | -1;
      target = ids[i + this.dir];
    }
    if (!target) return false;
    this.skipped.update((l) => [...l, id]);
    void this.router.navigate(['/laporan', target], { queryParams: this.params(), replaceUrl: true });
    return true;
  }

  reached = (status: StatusCode) => STEP_REACHED[status];

  // ---------- Suka (hanya saat dibuka dari Laporan publik) ----------
  likeable = computed(() => this.from()?.get('dari') === 'publik');
  likeBusy = signal(false);
  unliking = signal(false);

  // Salin jumlah dan status suka terbaru dari daftar publik ke laporan yang sedang dibuka
  private syncLike(id: string): void {
    const fresh = this.service.publicReports().find((x) => x.id === id);
    if (fresh) this.report.update((cur) => (cur && cur.id === id ? { ...cur, liked: fresh.liked, likes: fresh.likes } : cur));
  }

  // Memberi dukungan langsung diproses; batal dukung perlu konfirmasi
  onLike(): void {
    const r = this.report();
    if (!r || r.status === 'selesai') return;
    if (r.liked) this.unliking.set(true);
    else void this.sendLike(r.id);
  }

  confirmUnlike(): void {
    this.unliking.set(false);
    const r = this.report();
    if (r) void this.sendLike(r.id);
  }

  private async sendLike(id: string): Promise<void> {
    if (this.likeBusy()) return;
    this.likeBusy.set(true);
    try {
      const done = this.service.toggleLike(id);
      this.syncLike(id);   // tampilan langsung berubah (service mengubah daftar lebih dulu)
      await done;
    } catch {
      this.toast.show('Suka belum tersimpan. Coba lagi sebentar lagi.', 'error');
    } finally {
      this.syncLike(id);   // samakan dengan data akhir (atau batalkan bila gagal)
      this.likeBusy.set(false);
    }
  }

  // ---------- Hapus (hanya pemilik, hanya selama status Dikirim) ----------
  private toast = inject(ToastService);
  deleting = signal(false);
  deleteBusy = signal(false);
  deleteError = signal('');

  // Pemilik = laporan ini ada di daftar "laporan saya"
  isMine = computed(() => {
    const id = this.report()?.id;
    return !!id && this.service.reports().some((x) => x.id === id);
  });
  editable = computed(() => this.report()?.status === 'dikirim');

  closeDelete(): void {
    this.deleting.set(false);
    this.deleteError.set('');
  }

  async confirmDelete(): Promise<void> {
    const r = this.report();
    if (!r || this.deleteBusy()) return;
    this.deleteBusy.set(true);
    this.deleteError.set('');
    try {
      await this.service.remove(r);
      this.deleting.set(false);
      this.toast.show(`Laporan ${r.id} berhasil dihapus.`);
      void this.router.navigate([this.back().link], { replaceUrl: true });
    } catch (err) {
      this.deleteError.set(errorMessage(err, 'Laporan belum terhapus. Periksa koneksi Anda lalu coba lagi.'));
    } finally {
      this.deleteBusy.set(false);
    }
  }
}
