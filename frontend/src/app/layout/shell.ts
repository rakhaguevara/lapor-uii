import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { ReportService } from '../core/report.service';
import { Icon, IconName } from '../shared/icon';
import { AppHeader } from './app-header';

/*
  KERANGKA HALAMAN (Shell)
  Bagian yang selalu ada setelah login: header kuning, menu samping (desktop), menu bawah (HP).
  Isi halaman muncul di <router-outlet />.
  Halaman Portal ("Selamat datang") tidak punya menu bawah di HP, sesuai desain.
*/
@Component({
  selector: 'app-shell',
  imports: [RouterLink, RouterOutlet, AppHeader, Icon],
  template: `
    <app-header />

    <div class="body" [class.no-bottom]="onPortal()">
      <aside class="sidebar">
        <p class="side-title">PORTAL PELAPOR</p>
        <nav aria-label="Menu utama">
          @for (item of menu; track item.path) {
            <a class="item" [routerLink]="item.path" [class.active]="active() === item.path" [attr.aria-current]="active() === item.path ? 'page' : null">
              <app-icon [name]="item.icon" [size]="20" />
              {{ item.label }}
            </a>
          }
        </nav>
        <div class="access">
          <small>AKSES ANDA</small>
          <strong>{{ user.role }} · {{ user.type }}</strong>
          <p>Buat dan pantau laporan milik Anda sendiri.</p>
        </div>
      </aside>

      <main class="main"><router-outlet /></main>
    </div>

    <!-- Menu bawah: hanya tampil di HP -->
    @if (!onPortal()) {
      <nav class="bottom-nav" aria-label="Menu utama">
        @for (item of menu; track item.path) {
          <a [routerLink]="item.path" [class.active]="active() === item.path" [attr.aria-current]="active() === item.path ? 'page' : null">
            <app-icon [name]="item.icon" [size]="24" />
            {{ item.short }}
          </a>
        }
      </nav>
    }
  `,
  styles: `
    .body { display: grid; grid-template-columns: var(--sidebar-w) 1fr; min-height: calc(100vh - var(--header-h)); }
    .sidebar { display: flex; flex-direction: column; padding: 16px 16px 24px; background: var(--white); }
    .side-title { padding: 0 8px; margin-bottom: 20px; color: var(--muted); font-size: 11px; font-weight: 600; letter-spacing: 0.02em; line-height: 1.5; }
    .sidebar nav { display: flex; flex-direction: column; gap: 8px; }
    .item { display: flex; align-items: center; gap: 12px; min-height: 44px; padding: 0 14px; border-radius: 8px; color: var(--ink); font-size: 15px; }
    .item app-icon { color: var(--muted); }
    .item:hover { background: var(--bg); }
    .item.active { background: var(--blue-50); color: var(--blue-600); font-weight: 600; }
    .item.active app-icon { color: var(--blue-600); }
    .access { margin-top: auto; padding: 14px 16px; border-radius: 12px; background: var(--bg); }
    .access small { display: block; color: var(--muted); font-size: 10px; font-weight: 600; letter-spacing: 0.02em; }
    .access strong { display: block; margin: 4px 0 2px; font-size: 13px; font-weight: 600; }
    .access p { color: var(--muted); font-size: 13px; line-height: 1.5; }

    .main { padding: 16px 32px 48px; min-width: 0; }

    .bottom-nav { display: none; }

    /* HP: sembunyikan sidebar, tampilkan menu bawah */
    @media (max-width: 800px) {
      .body { display: block; min-height: calc(100vh - 68px); }
      .sidebar { display: none; }
      .main { padding: 40px 16px 96px; }
      .body.no-bottom .main { padding-bottom: 32px; }
      .bottom-nav { display: grid; grid-template-columns: repeat(4, 1fr); position: fixed; inset: auto 0 0 0; height: 64px; background: var(--white); border-top: 1px solid var(--line); z-index: 20; }
      .bottom-nav a { position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; color: var(--muted); font-size: 11px; line-height: 1.2; }
      .bottom-nav a.active { color: var(--blue-600); font-weight: 500; }
      .bottom-nav a.active::before { content: ''; position: absolute; top: -1px; left: 50%; width: 40px; height: 3px; margin-left: -20px; border-radius: 0 0 3px 3px; background: var(--blue-600); }
    }
  `,
})
export class Shell {
  private router = inject(Router);
  private service = inject(ReportService);

  get user() {
    return this.service.user;
  }

  // true saat berada di halaman Portal (menu bawah disembunyikan)
  private url = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map(() => this.router.url.split('?')[0]),
    ),
    { initialValue: this.router.url.split('?')[0] },
  );
  onPortal = () => this.url().startsWith('/portal');

  // Menu yang disorot. Detail laporan dianggap bagian dari "Laporan Saya";
  // halaman "berhasil dikirim" dan preview foto bagian dari "Buat laporan".
  active = () => {
    const u = this.url();
    if (u.startsWith('/laporan/baru') || u.endsWith('/terkirim')) return '/laporan/baru';
    if (u.startsWith('/laporan-saya') || u.startsWith('/laporan/')) return '/laporan-saya';
    if (u.startsWith('/laporan-publik')) return '/laporan-publik';
    if (u.startsWith('/beranda')) return '/beranda';
    return '';
  };

  // Satu daftar menu dipakai untuk sidebar DAN menu bawah.
  menu: { path: string; label: string; short: string; icon: IconName }[] = [
    { path: '/beranda', label: 'Beranda', short: 'Beranda', icon: 'grid' },
    { path: '/laporan/baru', label: 'Buat laporan', short: 'Buat laporan', icon: 'plus' },
    { path: '/laporan-saya', label: 'Laporan Saya', short: 'Laporan Saya', icon: 'list' },
    { path: '/laporan-publik', label: 'Laporan publik', short: 'Publik', icon: 'ring' },
  ];
}
