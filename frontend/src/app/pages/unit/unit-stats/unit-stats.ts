import { Component, inject } from '@angular/core';
import { AdminService, monthLabel } from '../../../core/admin/admin.service';
import { Insight, MonthSelect } from '../../../shared/insight/insight';
import { PageHead } from '../../../shared/page-head/page-head';

// STATISTIK FASILITAS (Admin Unit): ringkasan lengkap bulan terpilih (+ kategori dan kinerja).
@Component({
  selector: 'app-unit-stats',
  imports: [PageHead, Insight, MonthSelect],
  template: `
    <app-page-head [title]="'Statistik fasilitas' + (month() ? ' · ' + label(month()) : '')" subtitle="Prioritaskan laporan dan koordinasikan penanganan fasilitas."
      [crumbs]="[{ label: 'Portal Admin Unit', link: '/unit' }, { label: 'Statistik fasilitas' }]">
      <app-month-select />
    </app-page-head>
    <app-insight [full]="true" />
  `,
})
export class UnitStats {
  month = inject(AdminService).month;
  label = monthLabel;
}
