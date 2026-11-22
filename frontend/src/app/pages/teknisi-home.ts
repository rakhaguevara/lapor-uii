import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TechService } from '../core/tech.service';
import { Icon } from '../shared/icon';
import { PageHead } from '../shared/page-head';
import { TaskList } from '../shared/task-list';

// BERANDA TEKNISI: sapaan, ajakan, 4 angka, dan daftar tugas (tab Tugas Saya terpilih).
@Component({
  selector: 'app-teknisi-home',
  imports: [RouterLink, Icon, PageHead, TaskList],
  template: `
    <app-page-head [title]="'Selamat bekerja, ' + firstName" subtitle="Kelola penanganan fasilitas di gedung tanggung jawab Anda."
      [crumbs]="[{ label: 'Portal Teknisi', link: '/portal' }, { label: 'Dashboard Teknisi' }]" />

    <div class="stack">
      <section class="cta">
        <div>
          <h2>Siap bantu kampus hari ini?</h2>
          <p>{{ s().available }} tugas tersedia dan {{ s().active }} tugas aktif menunggu penanganan Anda.</p>
        </div>
        <a class="btn btn-primary" routerLink="/teknisi/tersedia">Lihat tugas tersedia <app-icon name="right" [size]="16" [stroke]="2.2" /></a>
      </section>

      <section class="grid-4 stats" aria-label="Ringkasan tugas">
        <div class="card stat"><span>Tugas tersedia</span><strong>{{ s().available }}</strong></div>
        <div class="card stat"><span>Tugas Saya</span><strong>{{ s().active }}</strong></div>
        <div class="card stat"><span>Perlu konfirmasi</span><strong>{{ s().confirm }}</strong></div>
        <div class="card stat"><span>Selesai bulan ini</span><strong>{{ s().done }}</strong></div>
      </section>

      <app-task-list initial="mine" />
    </div>
  `,
  styles: `
    .cta { display: flex; justify-content: space-between; align-items: center; gap: 24px; padding: 30px 24px; border-radius: var(--r-card); background: var(--blue-50); }
    .cta h2 { font-size: 20px; line-height: 1.4; font-weight: 600; }
    .cta p { margin-top: 8px; color: var(--muted); font-size: 14px; }
    @media (max-width: 800px) {
      .cta { flex-direction: column; align-items: stretch; gap: 16px; padding: 20px 16px; }
      .cta h2 { font-size: 17px; font-weight: 700; }
      .cta p { font-size: 13px; }
      .stats { order: -1; }
      .stack { display: flex; }
    }
  `,
})
export class TeknisiHome {
  private tech = inject(TechService);
  s = this.tech.stats;
  firstName = this.tech.me().split(' ')[0];
}
