import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { STATUS_LABEL, STATUS_OPTIONS } from '../core/report.model';
import { ReportService } from '../core/report.service';
import { ReportTable } from '../shared/report-table';

/*
  HALAMAN DAFTAR LAPORAN: dipakai untuk "Laporan Saya" DAN "Laporan publik".
  Bedanya hanya `mode` yang diatur di app.routes.ts:
    mine   -> laporan milik pengguna, tanpa tombol like
    public -> semua laporan, dengan tombol like
  Satu komponen untuk dua halaman = tidak ada kode salinan.
*/
@Component({
  selector: 'app-reports-page',
  imports: [RouterLink, ReportTable],
  template: `
    <div class="page-head head">
      <div>
        <h1>{{ isPublic ? 'Laporan publik' : 'Laporan Saya' }}</h1>
        <p>Layanan fasilitas yang transparan, dari laporan hingga penyelesaian.</p>
      </div>
      @if (!isPublic) {
        <a class="btn btn-primary" routerLink="/laporan/baru">+ Buat laporan</a>
      }
    </div>

    <!-- Filter. Tiap perubahan menyimpan nilai ke signal, daftar di bawah dihitung ulang otomatis -->
    <section class="card filters" aria-label="Filter laporan">
      <input type="search" placeholder="Cari tiket atau kerusakan…" aria-label="Cari tiket atau kerusakan"
        [value]="query()" (input)="query.set(textOf($event))">
      <select aria-label="Filter status" [value]="status()" (change)="status.set(textOf($event))">
        <option value="">Semua status</option>
        @for (s of statuses; track s) { <option [value]="s">{{ labels[s] }}</option> }
      </select>
      <select aria-label="Filter gedung" [value]="building()" (change)="building.set(textOf($event))">
        <option value="">Semua gedung</option>
        @for (b of service.buildings(); track b) { <option [value]="b">{{ b }}</option> }
      </select>
      <button class="btn" type="button" (click)="reset()">Reset</button>
    </section>

    <section class="card list">
      <h2>{{ isPublic ? 'Laporan publik · FTI UII' : 'Laporan Saya · ' + shown().length }}</h2>
      <app-report-table
        [reports]="shown()"
        [showLike]="isPublic"
        emptyText="Tidak ada laporan yang cocok dengan filter."
        (like)="service.toggleLike($event)" />
    </section>

    <p class="note">
      {{ isPublic ? 'Laporan publik tidak menampilkan nama atau kontak pelapor.' : 'Hanya laporan yang Anda buat ditampilkan di sini.' }}
    </p>
  `,
  styles: `
    .head { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
    .head .btn { white-space: nowrap; }
    .filters { display: grid; grid-template-columns: 2fr 1fr 1fr auto; gap: 12px; margin-bottom: 24px; }
    .filters input, .filters select { min-height: 44px; padding: 0 14px; border: 1px solid var(--line); border-radius: 8px; font: inherit; background: #fff; color: var(--ink); min-width: 0; }
    .list h2 { font-size: 20px; margin-bottom: 16px; }

    @media (max-width: 800px) {
      .head .btn { display: none; }
      .filters { grid-template-columns: 1fr 1fr; }
      .filters input { grid-column: 1 / -1; }
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

  // Daftar yang tampil = semua laporan yang lolos ketiga filter
  shown = computed(() => {
    const q = this.query().trim().toLowerCase();
    return this.service
      .list()
      .filter((r) => !q || r.id.toLowerCase().includes(q) || r.title.toLowerCase().includes(q))
      .filter((r) => !this.status() || r.status === this.status())
      .filter((r) => !this.building() || r.building === this.building());
  });

  // Ambil teks dari input/select yang memicu event
  textOf(event: Event): string {
    return (event.target as HTMLInputElement | HTMLSelectElement).value;
  }

  reset(): void {
    this.query.set('');
    this.status.set('');
    this.building.set('');
  }
}
