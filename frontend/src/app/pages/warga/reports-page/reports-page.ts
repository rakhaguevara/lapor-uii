import { Component, DestroyRef, ElementRef, computed, effect, inject, signal, untracked, viewChild } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { STATUS_LABEL, STATUS_OPTIONS, StatusCode, byPublicOrder } from '../../../core/reports/report.model';
import { ReportService } from '../../../core/reports/report.service';
import { Icon } from '../../../shared/icon/icon';
import { PageHead } from '../../../shared/page-head/page-head';
import { ReportTable } from '../../../shared/report-table/report-table';

/*
  HALAMAN DAFTAR LAPORAN: dipakai untuk "Laporan Saya" DAN "Laporan publik".
  Bedanya hanya `mode` yang diatur di app.routes.ts:
    mine   -> laporan milik pengguna, jumlah suka hanya ditampilkan
    public -> semua laporan, dengan tombol suka
  Satu komponen untuk dua halaman = tidak ada kode salinan.
  Saat pencarian atau filter aktif, judul berubah menjadi "Hasil pencarian" (sesuai desain).
*/
const PAGE_SIZE = 20;    // laporan per halaman (laporan publik)
const WINDOW_DAYS = 30;  // halaman pertama laporan publik

@Component({
  selector: 'app-reports-page',
  imports: [RouterLink, Icon, PageHead, ReportTable],
  template: `
    <app-page-head
      [title]="filtered() ? 'Hasil pencarian' : isPublic ? 'Laporan publik' : 'Laporan Saya'"
      subtitle="Layanan fasilitas yang transparan, dari laporan hingga penyelesaian."
      [mobileSubtitle]="isPublic ? 'Lihat perkembangan penanganan fasilitas di UII.' : 'Pantau semua laporan yang Anda buat.'"
      [crumbs]="[{ label: 'Portal Pelapor' }, { label: filtered() ? 'Hasil pencarian' : isPublic ? 'Laporan publik' : 'Laporan Saya' }]">
      @if (!isPublic) {
        <a class="btn btn-primary" routerLink="/laporan/baru"><app-icon name="plus" [size]="18" [stroke]="2.2" /> Buat laporan</a>
      }
    </app-page-head>

    @if (isPublic) {
      <section class="privacy m-only">
        <strong>Privasi pelapor terjaga</strong>
        <p>Laporan publik tidak menampilkan nama atau kontak pelapor.</p>
      </section>
    }

    <!-- Filter. Tiap perubahan menyimpan nilai ke signal, daftar di bawah dihitung ulang otomatis -->
    <section class="card filters" [class.d-only]="!isPublic" aria-label="Filter laporan">
      <label class="search">
        <app-icon name="search" [size]="18" />
        <input type="search" placeholder="Cari tiket atau kerusakan…" aria-label="Cari tiket atau kerusakan"
          [value]="query()" (input)="query.set(textOf($event))">
      </label>
      <label class="sel">
        <select aria-label="Filter status" [value]="status()" (change)="status.set(textOf($event))">
          <option value="">Semua status</option>
          @for (s of statuses; track s) { <option [value]="s" [selected]="status() === s">{{ labels[s] }}</option> }
        </select>
        <span class="face m-only" aria-hidden="true">Status: {{ statusText() }} <app-icon name="chevron" [size]="18" [stroke]="2" /></span>
      </label>
      <label class="sel">
        <select aria-label="Filter gedung" [value]="building()" (change)="building.set(textOf($event))">
          <option value="">Semua gedung</option>
          @for (b of service.buildings(); track b) { <option [value]="b" [selected]="building() === b">{{ b }}</option> }
        </select>
        <span class="face m-only" aria-hidden="true">Gedung: {{ building() || 'Semua gedung' }} <app-icon name="chevron" [size]="18" [stroke]="2" /></span>
      </label>
      <button class="btn reset" type="button" (click)="reset()">Reset</button>
    </section>

    @if (filtered()) {
      <section class="chips m-only">
        <p>{{ statusText() }} · {{ building() || 'Semua gedung' }}</p>
        <button class="btn" type="button" (click)="reset()">Reset pencarian &amp; filter</button>
      </section>
    }

    <section class="list">
      <div class="title-row">
        <div class="heading">
          <h2>
            <span [class.d-only]="!isPublic && !filtered()">{{ title() }}</span>
            @if (!isPublic && !filtered()) { <span class="m-only">{{ shown().length }} laporan · {{ statusText() }}</span> }
          </h2>
          @if (isPublic) { <p class="scope" [class.all]="showAll()" aria-live="polite">{{ scopeNote() }}</p> }
        </div>
        @if (isPublic) {
          <!-- Pilihan cakupan: yang aktif berwarna biru penuh -->
          <div class="seg" role="group" aria-label="Cakupan laporan">
            <button type="button" [class.on]="!showAll()" [attr.aria-pressed]="!showAll()" (click)="showAll.set(false)">30 hari terakhir</button>
            <button type="button" [class.on]="showAll()" [attr.aria-pressed]="showAll()" (click)="showAll.set(true)">Semua laporan</button>
          </div>
        } @else {
          <button class="btn d-only" type="button" (click)="reset()">Lihat semua <app-icon name="right" [size]="16" [stroke]="2" /></button>
        }
      </div>

      @if (!isPublic) {
        <!-- Aksi edit/hapus belum tersedia di backend: tampil sesuai desain tetapi nonaktif -->
        <div class="row-actions">
          <button type="button" disabled aria-label="Edit laporan (belum tersedia)" title="Edit laporan belum tersedia"><app-icon name="edit" [size]="22" /></button>
          <button type="button" disabled aria-label="Hapus laporan (belum tersedia)" title="Hapus laporan belum tersedia"><app-icon name="trash" [size]="22" /></button>
        </div>
      }

      @if (likeError()) { <p class="alert" role="alert">Suka belum tersimpan. Coba lagi sebentar lagi.</p> }

      <app-report-table
        [reports]="rows()"
        [loading]="!service.loaded()"
        [from]="isPublic ? 'publik' : null"
        [showLike]="true"
        [likeable]="isPublic"
        [showDetail]="!isPublic"
        [sortable]="true"
        [emptyText]="emptyText()"
        (like)="onLike($event)"
        (sort)="byStatus.set(!byStatus())" />

      @if (isPublic && pageCount() > 1) {
        <nav class="pager" aria-label="Halaman laporan">
          <button class="btn" type="button" [disabled]="current() === 1" (click)="goTo(current() - 1)">
            <app-icon name="left" [size]="16" [stroke]="2" /> Sebelumnya
          </button>
          <span class="where">Halaman {{ current() }} dari {{ pageCount() }} · {{ shown().length }} laporan</span>
          <button class="btn" type="button" [disabled]="current() === pageCount()" (click)="goTo(current() + 1)">
            Berikutnya <app-icon name="right" [size]="16" [stroke]="2" />
          </button>
        </nav>
      }
    </section>

    <!-- Konfirmasi batal dukung. <dialog> bawaan browser: Esc menutup, fokus terkunci di dalamnya -->
    <dialog #confirmDlg class="dlg" aria-labelledby="dlg-title" (close)="pending.set(null)" (click)="onBackdrop($event)">
      <span class="warn" aria-hidden="true">!</span>
      <h2 id="dlg-title">Batalkan dukungan?</h2>
      <p>Apakah kamu yakin ingin membatalkan dukungan untuk laporan <strong>{{ pending()?.id }} · {{ pending()?.title }}</strong>? Dukungan membantu laporan ini lebih cepat ditangani.</p>
      <div class="acts">
        <button class="btn btn-outline" type="button" (click)="confirmDlg.close()">Tidak, tetap dukung</button>
        <button class="btn btn-danger" type="button" (click)="confirmUnlike()">Ya, batalkan</button>
      </div>
    </dialog>

    <p class="note" [class.d-only]="isPublic">
      {{ isPublic ? 'Laporan publik tidak menampilkan nama atau kontak pelapor.' : 'Hanya laporan yang Anda buat ditampilkan di sini.' }}
    </p>
  `,
  styles: `
    .filters { display: grid; grid-template-columns: 1fr 170px 190px 150px; gap: 16px; align-items: center; padding: 16px 20px 16px 16px; margin-bottom: 24px; }
    .search { position: relative; display: block; }
    .search app-icon { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); color: var(--ink); pointer-events: none; }
    .search input { display: block; width: 100%; min-height: 44px; padding: 0 16px 0 44px; border: 1px solid var(--line); border-radius: var(--r-ctl); background: var(--white); font-size: 13px; font-weight: 500; }
    .search input::placeholder { color: var(--ink); opacity: 1; }
    .sel { position: relative; display: block; }
    .sel select { width: 100%; min-height: 44px; padding: 0 40px 0 16px; border: 1px solid var(--line); border-radius: var(--r-ctl); background: var(--white) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2314243e' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E") no-repeat right 14px center; appearance: none; font-size: 13px; font-weight: 500; text-overflow: ellipsis; }
    .reset { min-width: 0; }

    .list { padding: 12px 16px 24px; border: 1px solid var(--line); border-radius: var(--r-card); background: var(--white); min-height: 280px; display: flex; flex-direction: column; }
    .title-row { display: flex; justify-content: space-between; align-items: center; padding: 0 8px 12px; margin-bottom: 12px; border-bottom: 1px solid var(--line); }
    .title-row h2 { font-size: 17px; font-weight: 600; }
    .scope { margin-top: 4px; color: var(--muted); font-size: 12.5px; }
    .scope.all { color: var(--blue-600); font-weight: 500; }
    .seg { display: inline-flex; padding: 3px; border: 1px solid var(--line); border-radius: var(--r-ctl); background: var(--bg); }
    .seg button { min-height: 36px; padding: 0 16px; border: 0; border-radius: calc(var(--r-ctl) - 3px); background: none; color: var(--muted); font-size: 13px; font-weight: 500; cursor: pointer; transition: background 0.15s ease, color 0.15s ease; }
    .seg button:hover:not(.on) { color: var(--ink); background: var(--white); }
    .seg button.on { background: var(--blue-600); color: var(--white); font-weight: 600; }
    .row-actions { order: 9; display: flex; justify-content: flex-end; gap: 28px; padding: 24px 24px 0; margin-top: auto; }
    .row-actions button { display: grid; place-items: center; min-width: 32px; min-height: 32px; border: 0; background: none; color: var(--muted); }
    .row-actions button:disabled { cursor: not-allowed; }
    .pager { order: 8; display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--line); }
    .pager .where { color: var(--muted); font-size: 13px; text-align: center; }
    .pager .btn:disabled { opacity: 0.5; cursor: default; }
    .dlg { width: min(420px, calc(100vw - 32px)); padding: 28px 24px 24px; border: 0; border-radius: var(--r-card); background: var(--white); color: var(--ink); text-align: center; box-shadow: 0 20px 60px rgba(20, 36, 62, 0.25); }
    .dlg::backdrop { background: rgba(20, 36, 62, 0.45); }
    .dlg .warn { display: grid; place-items: center; width: 48px; height: 48px; margin: 0 auto 16px; border-radius: 50%; background: var(--amber-bg); color: var(--amber); font-size: 20px; font-weight: 700; }
    .dlg h2 { font-size: 18px; font-weight: 700; }
    .dlg p { margin-top: 10px; color: var(--muted); font-size: 14px; line-height: 1.6; }
    .dlg strong { color: var(--ink); font-weight: 600; }
    .dlg .acts { display: flex; justify-content: center; gap: 12px; margin-top: 24px; }
    @media (max-width: 800px) { .dlg .acts { flex-direction: column-reverse; } .dlg .acts .btn { width: 100%; } }
    .alert { margin: 0 8px 12px; padding: 12px 16px; border-radius: var(--r-ctl); background: var(--red-bg); color: var(--red); font-size: 14px; }

    .privacy { margin-bottom: 16px; padding: 16px; border-radius: var(--r-card); background: var(--blue-50); }
    .privacy strong { color: var(--blue-600); font-weight: 600; font-size: 14px; }
    .privacy p { margin-top: 10px; color: var(--muted); font-size: 12.5px; }
    .chips { display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px; padding: 16px; border-radius: var(--r-card); background: var(--blue-50); }
    .chips p { color: var(--blue-600); font-size: 12.5px; font-weight: 500; }
    .chips .btn { color: var(--blue-600); }

    @media (max-width: 800px) {
      .filters { display: flex; flex-direction: column; align-items: stretch; gap: 12px; padding: 0; margin-bottom: 24px; border: 0; background: none; }
      .search input { min-height: 48px; padding-left: 44px; font-weight: 400; border-radius: 12px; }
      .search input::placeholder { color: var(--placeholder); }
      .search app-icon { color: var(--ink); }
      .sel select { min-height: 48px; color: transparent; border-radius: 12px; background-image: none; }
      .sel select option { color: var(--ink); }
      .face { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 0 16px; color: var(--blue-600); font-size: 13px; font-weight: 600; pointer-events: none; text-align: center; }
      .reset { display: none; }
      .list { padding: 0; border: 0; background: none; min-height: 0; }
      .title-row { padding: 0; margin-bottom: 16px; border-bottom: 0; }
      .title-row h2 { font-size: 15px; font-weight: 700; }
      .title-row { flex-wrap: wrap; gap: 12px; }
      .heading { width: 100%; }
      .seg { width: 100%; }
      .seg button { flex: 1; padding: 0 8px; }
      .pager { flex-wrap: wrap; justify-content: center; }
      .pager .where { order: -1; width: 100%; }
      .row-actions { order: 0; margin: 0 0 16px; padding: 0 8px 0 0; gap: 24px; }
    }
  `,
})
export class ReportsPage {
  service = inject(ReportService);
  isPublic = inject(ActivatedRoute).snapshot.data['mode'] === 'public';

  // Laporan publik = semua laporan; Laporan Saya = milik pengguna
  list = this.isPublic ? this.service.publicReports : this.service.reports;

  statuses = STATUS_OPTIONS;
  labels = STATUS_LABEL;

  // Nilai filter saat ini
  query = signal('');
  status = signal('');
  building = signal('');
  byStatus = signal(false); // true = urut berdasarkan status, false = terbaru dulu
  likeError = signal(false);
  showAll = signal(false);   // laporan publik: false = 30 hari terakhir, true = semua laporan
  private host = inject<ElementRef<HTMLElement>>(ElementRef);

  constructor() {
    // Simpan urutan daftar untuk tombol sebelumnya/berikutnya di halaman detail
    effect(() => this.service.nav.set({ source: this.isPublic ? 'publik' : 'saya', ids: this.shown().map((r) => r.id) }));
    // Ganti kata kunci, filter, urutan, atau cakupan -> kembali ke halaman 1
    effect(() => {
      this.query(); this.status(); this.building(); this.byStatus(); this.showAll();
      untracked(() => this.page.set(1));
    });
    // Laporan publik: ambil ulang tiap 10 detik supaya like dari pengguna lain ikut menaikkan urutan
    if (this.isPublic) {
      const timer = setInterval(() => { if (!document.hidden) this.service.loadAll(true).catch(() => {}); }, 10000);
      inject(DestroyRef).onDestroy(() => clearInterval(timer));
    }
  }

  filtered = computed(() => !!(this.query().trim() || this.status() || this.building()));
  statusText = computed(() => (this.status() ? STATUS_LABEL[this.status() as StatusCode] : 'Semua status'));

  // Daftar yang tampil = semua laporan yang lolos ketiga filter
  shown = computed(() => {
    const q = this.query().trim().toLowerCase();
    // Laporan publik: halaman pertama hanya 30 hari terakhir; "Lihat semua" membuka seluruh laporan
    const cutoff = Date.now() - WINDOW_DAYS * 86_400_000;
    const scoped = this.isPublic && !this.showAll()
      ? this.list().filter((r) => !(Date.parse(r.createdAt) < cutoff))
      : this.list();
    const result = scoped
      .filter((r) => !q || r.id.toLowerCase().includes(q) || r.title.toLowerCase().includes(q) || r.room.toLowerCase().includes(q))
      .filter((r) => !this.status() || r.status === this.status())
      .filter((r) => !this.building() || r.building === this.building());
    // Laporan publik: yang belum selesai di atas, yang selesai di paling bawah.
    // Di tiap kelompok, like terbanyak di atas (seri -> terbaru dulu).
    if (this.isPublic && !this.byStatus()) {
      return [...result].sort(byPublicOrder);
    }
    // STATUS_OPTIONS berurutan dikirim -> diproses -> selesai
    return this.byStatus() ? [...result].sort((a, b) => STATUS_OPTIONS.indexOf(a.status) - STATUS_OPTIONS.indexOf(b.status)) : result;
  });

  // Laporan publik dibagi per halaman (20 laporan). Halaman lain tidak dibagi.
  page = signal(1);
  pageCount = computed(() => Math.max(1, Math.ceil(this.shown().length / PAGE_SIZE)));
  current = computed(() => Math.min(this.page(), this.pageCount()));
  rows = computed(() => (this.isPublic ? this.shown().slice((this.current() - 1) * PAGE_SIZE, this.current() * PAGE_SIZE) : this.shown()));

  emptyText = computed(() =>
    this.isPublic && !this.showAll()
      ? 'Tidak ada laporan dalam 30 hari terakhir yang cocok. Pilih "Lihat semua" untuk melihat laporan sebelumnya.'
      : 'Tidak ada laporan yang cocok. Ubah kata kunci atau filter lalu coba lagi.');

  // Keterangan di bawah judul: menjelaskan apa yang sedang ditampilkan
  scopeNote = computed(() => {
    const n = this.shown().length;
    if (this.showAll()) return `Seluruh laporan di UII sejak awal · ${n} laporan`;
    const from = new Date(Date.now() - WINDOW_DAYS * 86_400_000).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    const to = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    return `${from} – ${to} · ${n} laporan`;
  });

  goTo(p: number): void {
    this.page.set(Math.min(Math.max(1, p), this.pageCount()));
    this.host.nativeElement.querySelector('.list')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  title = computed(() => {
    if (this.filtered()) return `${this.shown().length} laporan ditemukan`;
    if (this.isPublic) return this.showAll() ? 'Semua laporan · UII' : 'Laporan publik · 30 hari terakhir';
    return `Laporan Saya · ${this.shown().length}`;
  });

  // Ambil teks dari input/select yang memicu event
  textOf(event: Event): string {
    return (event.target as HTMLInputElement | HTMLSelectElement).value;
  }

  // Batal dukung perlu konfirmasi; memberi dukungan langsung diproses
  pending = signal<{ id: string; title: string } | null>(null);
  private dlg = viewChild.required<ElementRef<HTMLDialogElement>>('confirmDlg');

  onLike(id: string): void {
    const r = this.list().find((x) => x.id === id);
    if (r?.liked) {
      this.pending.set({ id, title: r.title });
      this.dlg().nativeElement.showModal();
    } else {
      void this.sendLike(id);
    }
  }

  confirmUnlike(): void {
    const p = this.pending();
    this.dlg().nativeElement.close();
    if (p) void this.sendLike(p.id);
  }

  // Klik di area gelap (di luar kotak) menutup dialog
  onBackdrop(e: MouseEvent): void {
    if (e.target === this.dlg().nativeElement) this.dlg().nativeElement.close();
  }

  private async sendLike(id: string): Promise<void> {
    this.likeError.set(false);
    try {
      await this.service.toggleLike(id);
    } catch {
      this.likeError.set(true);
    }
  }

  reset(): void {
    this.query.set('');
    this.status.set('');
    this.building.set('');
  }
}
