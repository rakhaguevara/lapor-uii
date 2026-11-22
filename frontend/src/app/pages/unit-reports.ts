import { Component, computed, inject, signal } from '@angular/core';
import { AdminService, ADMIN_STATUSES, PRIORITY_LABEL } from '../core/admin.service';
import { ALL_STATUS_LABEL } from '../core/report.model';
import { Icon } from '../shared/icon';
import { PageHead } from '../shared/page-head';
import { ReportTable } from '../shared/report-table';

// KELOLA LAPORAN (Admin Unit): cari + filter status, prioritas, gedung, lalu tabel / kartu.
@Component({
  selector: 'app-unit-reports',
  imports: [Icon, PageHead, ReportTable],
  template: `
    <app-page-head title="Kelola laporan" subtitle="Prioritaskan laporan dan koordinasikan penanganan fasilitas."
      [crumbs]="[{ label: 'Portal Admin Unit', link: '/unit' }, { label: 'Kelola laporan' }]" />

    <div class="stack">
      <section class="card toolbar d-only" style="padding: 16px" aria-label="Filter laporan">
        <div class="field search grow"><label class="sr-only" for="q">Cari</label><app-icon name="search" [size]="16" />
          <input id="q" type="search" placeholder="Cari tiket atau kerusakan…" [value]="q()" (input)="q.set($any($event.target).value)"></div>
        <div class="field"><label class="sr-only" for="st">Status</label>
          <select id="st" (change)="st.set($any($event.target).value)"><option value="">Semua status</option>
            @for (s of statuses; track s) { <option [value]="s">{{ label(s) }}</option> }</select></div>
        <div class="field"><label class="sr-only" for="pr">Prioritas</label>
          <select id="pr" (change)="pr.set($any($event.target).value)"><option value="">Semua prioritas</option>
            @for (p of priorities; track p[0]) { <option [value]="p[0]">{{ p[1] }}</option> }</select></div>
        <div class="field"><label class="sr-only" for="gd">Gedung</label>
          <select id="gd" (change)="gd.set($any($event.target).value)"><option value="">Semua gedung</option>
            @for (b of buildings(); track b) { <option [value]="b">{{ b }}</option> }</select></div>
      </section>

      <!-- HP: kotak info dulu, lalu ringkasan filter (desain tanpa kolom filter) -->
      <p class="note m-only" style="margin: 0">{{ newCount() }} laporan baru perlu diverifikasi. Periksa lokasi, lalu tugaskan teknisi.</p>

      <section class="card panel">
        <div class="panel-head"><h2>Laporan prioritas</h2><span class="sub">{{ list().length }} laporan</span></div>
        <app-report-table [reports]="list()" base="/unit/laporan" [buildingFirst]="true" [showLike]="true" [likeable]="false" [showDetail]="true" [sortable]="true" (sort)="byLikes.set(!byLikes())" emptyText="Tidak ada laporan yang cocok." />
      </section>

      <p class="note d-only" style="margin: 0"><strong style="font-size: 18px; font-weight: 600">{{ newCount() }} laporan baru perlu diverifikasi</strong><br>
        <span class="sub">Periksa lokasi, tentukan prioritas, lalu tugaskan teknisi sesuai keahlian.</span></p>
    </div>
  `,
})
export class UnitReports {
  private admin = inject(AdminService);
  statuses = ADMIN_STATUSES;
  priorities = Object.entries(PRIORITY_LABEL);
  label = (s: string) => ALL_STATUS_LABEL[s];
  q = signal(''); st = signal(''); pr = signal(''); gd = signal('');
  byLikes = signal(false);

  buildings = computed(() => [...new Set(this.admin.reports().map((r) => r.building))]);
  newCount = computed(() => this.admin.reports().filter((r) => r.status === 'dikirim').length);
  list = computed(() => {
    const q = this.q().toLowerCase();
    const out = this.admin.reports().filter((r) =>
      (!q || r.id.toLowerCase().includes(q) || r.title.toLowerCase().includes(q)) &&
      (!this.st() || r.status === this.st()) && (!this.pr() || r.priority === this.pr()) && (!this.gd() || r.building === this.gd()));
    return this.byLikes() ? [...out].sort((a, b) => b.likes - a.likes) : out;
  });
}
