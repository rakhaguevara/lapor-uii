import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { STATUS_LABEL, STATUS_OPTIONS, StatusCode } from '../core/report.model';
import { ReportService } from '../core/report.service';
import { Icon } from '../shared/icon';
import { PageHead } from '../shared/page-head';
import { ReportTable } from '../shared/report-table';

/*
  HALAMAN DAFTAR LAPORAN: dipakai untuk "Laporan Saya" DAN "Laporan publik".
  Bedanya hanya `mode` yang diatur di app.routes.ts:
    mine   -> laporan milik pengguna, jumlah suka hanya ditampilkan
    public -> semua laporan, dengan tombol suka
  Satu komponen untuk dua halaman = tidak ada kode salinan.
  Saat pencarian atau filter aktif, judul berubah menjadi "Hasil pencarian" (sesuai desain).
*/
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
        <h2>
          <span [class.d-only]="!isPublic && !filtered()">{{ title() }}</span>
          @if (!isPublic && !filtered()) { <span class="m-only">{{ shown().length }} laporan · {{ statusText() }}</span> }
        </h2>
        <button class="btn d-only" type="button" (click)="reset()">Lihat semua <app-icon name="right" [size]="16" [stroke]="2" /></button>
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
        [reports]="shown()"
        [showLike]="true"
        [likeable]="isPublic"
        [showDetail]="!isPublic"
        [sortable]="true"
        emptyText="Tidak ada laporan yang cocok. Ubah kata kunci atau filter lalu coba lagi."
        (like)="onLike($event)"
        (sort)="byStatus.set(!byStatus())" />
    </section>

    <p class="note" [class.d-only]="isPublic">
      {{ isPublic ? 'Laporan publik tidak menampilkan nama atau kontak pelapor.' : 'Hanya laporan yang Anda buat ditampilkan di sini.' }}
    </p>
  `,
  styles: `
    .filters { display: grid; grid-template-columns: 1fr 170px 190px 150px; gap: 16px; align-items: center; padding: 16px 20px 16px 16px; margin-bottom: 24px; }
    .search { position: relative; display: block; }
    .search app-icon { position: absolute; left: 16px; top: 13px; color: var(--ink); pointer-events: none; }
    .search input { width: 100%; min-height: 44px; padding: 0 16px 0 44px; border: 1px solid var(--line); border-radius: var(--r-ctl); background: var(--white); font-size: 13px; font-weight: 500; }
    .search input::placeholder { color: var(--ink); opacity: 1; }
    .sel { position: relative; display: block; }
    .sel select { width: 100%; min-height: 44px; padding: 0 40px 0 16px; border: 1px solid var(--line); border-radius: var(--r-ctl); background: var(--white) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2314243e' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E") no-repeat right 14px center; appearance: none; font-size: 13px; font-weight: 500; text-overflow: ellipsis; }
    .reset { min-width: 0; }

    .list { padding: 12px 16px 24px; border: 1px solid var(--line); border-radius: var(--r-card); background: var(--white); min-height: 280px; display: flex; flex-direction: column; }
    .title-row { display: flex; justify-content: space-between; align-items: center; padding: 0 8px; margin-bottom: 9px; }
    .title-row h2 { font-size: 17px; font-weight: 600; }
    .row-actions { order: 9; display: flex; justify-content: flex-end; gap: 28px; padding: 24px 24px 0; margin-top: auto; }
    .row-actions button { display: grid; place-items: center; min-width: 32px; min-height: 32px; border: 0; background: none; color: var(--muted); }
    .row-actions button:disabled { cursor: not-allowed; }
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
      .search app-icon { top: 15px; color: var(--ink); }
      .sel select { min-height: 48px; color: transparent; border-radius: 12px; background-image: none; }
      .sel select option { color: var(--ink); }
      .face { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 0 16px; color: var(--blue-600); font-size: 13px; font-weight: 600; pointer-events: none; text-align: center; }
      .reset { display: none; }
      .list { padding: 0; border: 0; background: none; min-height: 0; }
      .title-row { padding: 0; margin-bottom: 16px; }
      .title-row h2 { font-size: 15px; font-weight: 700; }
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

  filtered = computed(() => !!(this.query().trim() || this.status() || this.building()));
  statusText = computed(() => (this.status() ? STATUS_LABEL[this.status() as StatusCode] : 'Semua status'));

  // Daftar yang tampil = semua laporan yang lolos ketiga filter
  shown = computed(() => {
    const q = this.query().trim().toLowerCase();
    const result = this.list()
      .filter((r) => !q || r.id.toLowerCase().includes(q) || r.title.toLowerCase().includes(q) || r.room.toLowerCase().includes(q))
      .filter((r) => !this.status() || r.status === this.status())
      .filter((r) => !this.building() || r.building === this.building());
    // STATUS_OPTIONS berurutan dikirim -> diproses -> selesai
    return this.byStatus() ? [...result].sort((a, b) => STATUS_OPTIONS.indexOf(a.status) - STATUS_OPTIONS.indexOf(b.status)) : result;
  });

  title = computed(() => {
    if (this.filtered()) return `${this.shown().length} laporan ditemukan`;
    return this.isPublic ? 'Laporan publik · UII' : `Laporan Saya · ${this.shown().length}`;
  });

  // Ambil teks dari input/select yang memicu event
  textOf(event: Event): string {
    return (event.target as HTMLInputElement | HTMLSelectElement).value;
  }

  async onLike(id: string): Promise<void> {
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
