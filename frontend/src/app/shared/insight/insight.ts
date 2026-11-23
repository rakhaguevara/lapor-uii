import { Component, computed, inject, input } from '@angular/core';
import { ADMIN_STATUSES, AdminService, monthLabel } from '../../core/admin/admin.service';
import { ALL_STATUS_LABEL } from '../../core/reports/report.model';

const pct = (n: number) => (Math.round(n * 10) / 10).toString().replace('.', ',') + '%';
const bar = (n: number, max: number) => (max ? Math.max(4, Math.round((n / max) * 100)) : 0) + '%';

/*
  RINGKASAN ANGKA (dashboard dan statistik petugas): kartu angka, tren 7 hari,
  status penanganan, dan (full=true) laporan per kategori. Hitungan dari laporan bulan terpilih.
  Tampilan memakai kelas global di styles.css (stat, bars, hbar, panel).
*/
@Component({
  selector: 'app-insight',
  template: `
    <div class="stack">
      <section class="grid-4" aria-label="Ringkasan">
        <div class="card stat"><span>Total laporan</span><strong>{{ s().total }}</strong></div>
        <div class="card stat"><span>Laporan baru</span><strong>{{ s().baru }}</strong></div>
        <div class="card stat"><span>Selesai</span><strong>{{ s().selesai }}</strong></div>
        <div class="card stat"><span>Tingkat penyelesaian</span><strong>{{ s().rate }}</strong></div>
      </section>

      <div class="split wide">
        <section class="card panel">
          <h2>Tren laporan masuk</h2>
          <p class="sub">{{ s().range }} · {{ s().trendTotal }} laporan</p>
          <div class="bars" role="img" [attr.aria-label]="'Grafik laporan masuk per hari: ' + s().alt">
            @for (d of s().days; track d.label; let last = $last) {
              <div class="col" [class.on]="last"><b>{{ d.n }}</b><i [style.height]="d.h"></i><small>{{ d.label }}</small></div>
            }
          </div>
        </section>
        <section class="card panel">
          <h2>Status penanganan</h2>
          <div class="rows">
            @for (r of s().status; track r.label) {
              <div class="hbar" [class.ok]="r.ok"><span>{{ r.label }}</span><em [style.--w]="r.w"></em><b>{{ r.n }}</b></div>
            }
          </div>
        </section>
      </div>

      @if (full()) {
        <div class="split wide">
          <section class="card panel">
            <h2>Laporan per kategori</h2>
            <div class="rows">
              @for (c of s().cats; track c.label) {
                <div class="hbar lg"><span>{{ c.label }}</span><em [style.--w]="c.w"></em><b>{{ c.n }}</b></div>
              } @empty { <p class="empty">Belum ada laporan.</p> }
            </div>
          </section>
          <section class="card panel">
            <h2>Kinerja layanan</h2>
            <div class="stack" style="margin-top: 20px; gap: 28px">
              <div><strong style="font-size: 24px">–</strong><p class="sub">Rata-rata respons awal</p></div>
              <div><strong style="font-size: 24px">–</strong><p class="sub">Rata-rata penyelesaian · {{ s().selesai }} laporan selesai</p></div>
              <p class="hint">Waktu respons belum tersedia dari backend.</p>
            </div>
          </section>
        </div>
      }
    </div>
  `,
  styles: `
    .rows { margin-top: 16px; }
  `,
})
export class Insight {
  private admin = inject(AdminService);
  full = input(false);

  s = computed(() => {
    const list = this.admin.inMonth();
    const total = list.length;
    const selesai = list.filter((r) => r.status === 'selesai').length;

    // 7 hari terakhir berakhir di hari laporan terbaru pada bulan itu
    const end = list.length ? new Date(list.map((r) => r.createdAt).sort().at(-1)!.slice(0, 10) + 'T00:00:00') : new Date();
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(end); d.setDate(end.getDate() - (6 - i));
      const key = d.toLocaleDateString('sv-SE');
      return { key, label: d.getDate() + ' ' + d.toLocaleDateString('id-ID', { month: 'short' }), n: 0, h: '' };
    });
    for (const r of list) { const d = days.find((x) => x.key === r.createdAt.slice(0, 10)); if (d) d.n++; }
    const max = Math.max(...days.map((d) => d.n));
    days.forEach((d) => (d.h = d.n ? Math.max(8, Math.round((d.n / max) * 100)) + '%' : '0'));

    const byStatus = ADMIN_STATUSES.map((st) => ({ label: ALL_STATUS_LABEL[st], n: list.filter((r) => r.status === st).length, ok: st === 'selesai', w: '' }));
    const maxS = Math.max(...byStatus.map((x) => x.n));
    byStatus.forEach((x) => (x.w = bar(x.n, maxS)));

    const cats = [...new Set(list.map((r) => r.category))].map((label) => ({ label, n: list.filter((r) => r.category === label).length, w: '' }))
      .sort((a, b) => b.n - a.n);
    cats.forEach((c) => (c.w = bar(c.n, cats[0].n)));

    const first = days[0].label.split(' ')[0];
    return {
      total, selesai, baru: list.filter((r) => r.status === 'dikirim').length, rate: total ? pct((selesai / total) * 100) : '0%',
      days, trendTotal: days.reduce((a, d) => a + d.n, 0), range: `${first}–${days[6].label} ${end.getFullYear()}`,
      alt: days.map((d) => d.label + ' ' + d.n).join(', '), status: byStatus, cats,
    };
  });
  readonly monthLabel = monthLabel;
}

// Pilihan bulan untuk dashboard dan statistik (dipakai di slot tombol kepala halaman)
@Component({
  selector: 'app-month-select',
  template: `
    <div class="field" style="min-width: 240px">
      <label class="sr-only" for="bulan">Bulan</label>
      <select id="bulan" (change)="admin.monthPick.set($any($event.target).value)">
        @for (m of admin.months(); track m) { <option [value]="m" [selected]="m === admin.month()">{{ label(m) }}</option> }
        @empty { <option>–</option> }
      </select>
    </div>
  `,
})
export class MonthSelect {
  admin = inject(AdminService);
  label = monthLabel;
}
