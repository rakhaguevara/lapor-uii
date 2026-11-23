import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../../core/admin/admin.service';
import { Icon } from '../../../shared/icon/icon';
import { Insight, MonthSelect } from '../../../shared/insight/insight';
import { PageHead } from '../../../shared/page-head/page-head';
import { ReportTable } from '../../../shared/report-table/report-table';

// BERANDA ADMIN UNIT: ringkasan angka bulan terpilih + laporan prioritas (belum selesai, suka terbanyak).
@Component({
  selector: 'app-unit-home',
  imports: [RouterLink, Icon, PageHead, ReportTable, Insight, MonthSelect],
  template: `
    <app-page-head title="Dashboard Admin Unit - FTI UII" subtitle="Prioritaskan laporan dan koordinasikan penanganan fasilitas."
      [crumbs]="[{ label: 'Portal Admin Unit', link: '/portal' }, { label: 'Dashboard Admin Unit - FTI UII' }]">
      <app-month-select />
    </app-page-head>

    <div class="stack">
      <app-insight />
      <section class="card panel">
        <div class="panel-head">
          <h2>Laporan prioritas</h2>
          <a class="btn d-only" routerLink="/unit/laporan">Kelola semua <app-icon name="right" [size]="16" [stroke]="2" /></a>
        </div>
        <app-report-table [reports]="top()" [loading]="!admin.reportsLoaded()" base="/unit/laporan" [buildingFirst]="true" [showLike]="true" [likeable]="false" [showDetail]="true" emptyText="Tidak ada laporan yang perlu ditangani." />
      </section>
    </div>
  `,
})
export class UnitHome {
  admin = inject(AdminService);
  top = computed(() =>
    this.admin.reports().filter((r) => r.status !== 'selesai' && r.status !== 'gagal').sort((a, b) => b.likes - a.likes).slice(0, 4));
}
