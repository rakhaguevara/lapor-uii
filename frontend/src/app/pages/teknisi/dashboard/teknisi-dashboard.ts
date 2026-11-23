import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TechService } from '../../../core/tech/tech.service';
import { Icon } from '../../../shared/icon/icon';
import { PageHead } from '../../../shared/page-head/page-head';
import { Skeleton } from '../../../shared/skeleton/skeleton';
import { TaskList, TaskMode } from '../components/task-list/task-list';

export type DashboardMode = 'home' | TaskMode;

/*
  HALAMAN UTAMA TEKNISI (satu halaman untuk 4 alamat, dibedakan oleh `data.mode` di teknisi.routes.ts):
    home       /teknisi          sapaan + ajakan + 4 angka + daftar (tab Tugas Saya)
    all        /teknisi/tugas    daftar, tab Semua
    available  /teknisi/tersedia daftar, tab Tersedia
    mine       /teknisi/saya     daftar, tab Tugas Saya
  Sesuai design-refrence/teknisi.
*/
@Component({
  selector: 'app-teknisi-dashboard',
  imports: [RouterLink, Icon, PageHead, TaskList, Skeleton],
  template: `
    <app-page-head [title]="title" subtitle="Kelola penanganan fasilitas di gedung tanggung jawab Anda."
      [crumbs]="[{ label: 'Portal Teknisi', link: '/teknisi' }, { label: home ? 'Dashboard Teknisi' : title }]" />

    <div class="stack">
      @if (home) {
        <section class="cta">
          <div>
            <h2>Siap bantu kampus hari ini?</h2>
            <p>{{ s().available }} tugas tersedia dan {{ s().active }} tugas aktif menunggu penanganan Anda.</p>
          </div>
          <a class="btn btn-primary" routerLink="/teknisi/tersedia">Lihat tugas tersedia <app-icon name="right" [size]="16" [stroke]="2.2" /></a>
        </section>

        @if (!loaded()) {
          <app-skeleton class="stats" variant="stats" />
        } @else {
          <section class="grid-4 stats" aria-label="Ringkasan tugas">
            <div class="card stat"><span>Tugas tersedia</span><strong>{{ s().available }}</strong></div>
            <div class="card stat"><span>Tugas Saya</span><strong>{{ s().active }}</strong></div>
            <div class="card stat"><span>Perlu konfirmasi</span><strong>{{ s().confirm }}</strong></div>
            <div class="card stat"><span>Selesai bulan ini</span><strong>{{ s().done }}</strong></div>
          </section>
        }
      }

      <app-task-list [initial]="tab" />
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
export class TeknisiDashboard {
  private tech = inject(TechService);
  private mode = inject(ActivatedRoute).snapshot.data['mode'] as DashboardMode;

  s = this.tech.stats;
  loaded = this.tech.loaded;
  home = this.mode === 'home';
  tab: TaskMode = this.home ? 'mine' : (this.mode as TaskMode);
  title = this.home
    ? 'Selamat bekerja, ' + this.tech.me().split(' ')[0]
    : { all: 'Semua tugas', available: 'Tugas tersedia', mine: 'Tugas Saya' }[this.tab];
}
