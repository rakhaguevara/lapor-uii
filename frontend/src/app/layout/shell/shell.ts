import { Component, DestroyRef, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { AdminService } from '../../core/admin/admin.service';
import { AuthService } from '../../core/auth/auth.service';
import { TechService } from '../../core/tech/tech.service';
import { Icon, IconName } from '../../shared/icon/icon';
import { AppHeader } from '../app-header/app-header';

interface MenuItem { path: string; label: string; short: string; icon: IconName }
interface RoleView { title: string; access: string; showType: boolean; tag?: string; menu: MenuItem[] }

const ROLES: Record<string, RoleView> = {
  PELAPOR: {
    title: 'PELAPOR', access: 'Buat dan pantau laporan milik Anda sendiri.', showType: true,
    menu: [
      { path: '/beranda', label: 'Beranda', short: 'Beranda', icon: 'grid' },
      { path: '/laporan/baru', label: 'Buat laporan', short: 'Buat laporan', icon: 'plus' },
      { path: '/laporan-saya', label: 'Laporan Saya', short: 'Laporan Saya', icon: 'list' },
      { path: '/laporan-publik', label: 'Laporan publik', short: 'Publik', icon: 'ring' },
    ],
  },
  TEKNISI: {
    title: 'TEKNISI', access: 'Tugas sesuai cakupan gedung.', showType: false, tag: 'UII',
    menu: [
      { path: '/teknisi', label: 'Beranda', short: 'Beranda', icon: 'grid' },
      { path: '/teknisi/tugas', label: 'Semua tugas', short: 'Semua tugas', icon: 'list' },
      { path: '/teknisi/tersedia', label: 'Tersedia', short: 'Tersedia', icon: 'plus' },
      { path: '/teknisi/saya', label: 'Tugas Saya', short: 'Tugas Saya', icon: 'check' },
    ],
  },
  ADMIN_UNIT: {
    title: 'ADMIN UNIT', access: 'Laporan fasilitas UII. Kelola dan tugaskan teknisi.', showType: false,
    menu: [
      { path: '/unit', label: 'Beranda', short: 'Beranda', icon: 'grid' },
      { path: '/unit/laporan', label: 'Kelola laporan', short: 'Laporan', icon: 'list' },
      { path: '/unit/statistik', label: 'Statistik', short: 'Statistik', icon: 'chart' },
    ],
  },
  ADMIN_UNIV: {
    title: 'ADMIN UNIVERSITAS', access: 'Seluruh universitas. Kelola gedung dan akun.', showType: false,
    menu: [
      { path: '/univ', label: 'Beranda', short: 'Beranda', icon: 'grid' },
      { path: '/univ/gedung', label: 'Gedung', short: 'Gedung', icon: 'building' },
      { path: '/univ/akun', label: 'Akun pengguna', short: 'Akun', icon: 'users' },
    ],
  },
};

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
        <p class="side-title">PORTAL {{ role().title }}</p>
        <nav aria-label="Menu utama">
          @for (item of role().menu; track item.path) {
            <a class="item" [routerLink]="item.path" [class.active]="active() === item.path" [attr.aria-current]="active() === item.path ? 'page' : null">
              <app-icon [name]="item.icon" [size]="20" />
              {{ item.label }}
            </a>
          }
        </nav>
        <div class="access">
          <small>AKSES ANDA</small>
          <strong>{{ user().role }}{{ role().showType && user().type ? ' · ' + user().type : role().tag ? ' · ' + role().tag : '' }}</strong>
          <p>@if (role().tag && building()) { {{ building() }}<br> }{{ role().access }}</p>
        </div>
      </aside>

      <main class="main"><router-outlet /></main>
    </div>

    <!-- Menu bawah: hanya tampil di HP -->
    @if (!onPortal()) {
      <nav class="bottom-nav" aria-label="Menu utama">
        @for (item of role().menu; track item.path) {
          <a [routerLink]="item.path" [class.active]="active() === item.path" [attr.aria-current]="active() === item.path ? 'page' : null">
            <app-icon [name]="item.icon" [size]="24" />
            {{ item.short }}
          </a>
        }
      </nav>
    }
  `,
  styles: `
    /* Desktop: body setinggi layar sisa header. Sidebar diam, hanya .main yang scroll. */
    .body { display: grid; grid-template-columns: var(--sidebar-w) minmax(0, 1fr); grid-template-rows: minmax(0, 1fr); height: calc(100vh - var(--header-h)); height: calc(100dvh - var(--header-h)); overflow: hidden; }
    .sidebar { display: flex; flex-direction: column; min-height: 0; overflow-y: auto; padding: 16px 16px 24px; background: var(--white); }
    .side-title { padding: 0 8px; margin-bottom: 17px; color: var(--muted); font-size: 10px; font-weight: 600; letter-spacing: 0.02em; line-height: 1.5; }
    .sidebar nav { display: flex; flex-direction: column; gap: 8px; }
    .item { display: flex; align-items: center; gap: 10px; min-height: 44px; padding: 0 14px; border-radius: 8px; color: var(--ink); font-size: 13px; }
    .item app-icon { color: var(--muted); }
    .item:hover { background: var(--bg); }
    .item.active { background: var(--blue-50); color: var(--blue-600); font-weight: 600; }
    .item.active app-icon { color: var(--blue-600); }
    .access { margin-top: auto; padding: 14px 16px; border-radius: 12px; background: var(--bg); }
    .access small { display: block; color: var(--muted); font-size: 10px; font-weight: 600; letter-spacing: 0.02em; }
    .access strong { display: block; margin: 4px 0 2px; font-size: 12px; font-weight: 600; }
    .access p { color: var(--muted); font-size: 12px; line-height: 1.5; }

    .main { min-height: 0; overflow-y: auto; overscroll-behavior: contain; padding: 16px 32px 48px; min-width: 0; }

    .bottom-nav { display: none; }

    /* HP: sembunyikan sidebar, tampilkan menu bawah */
    @media (max-width: 800px) {
      .body { display: block; height: auto; overflow: visible; min-height: calc(100vh - 68px); }
      .sidebar { display: none; }
      .main { overflow: visible; padding: 40px 16px 96px; }
      .body.no-bottom .main { padding-bottom: 32px; }
      .bottom-nav { display: grid; grid-auto-flow: column; grid-auto-columns: 1fr; position: fixed; inset: auto 0 0 0; height: 64px; background: var(--white); border-top: 1px solid var(--line); z-index: 20; }
      .bottom-nav a { position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; color: var(--muted); font-size: 11px; line-height: 1.2; }
      .bottom-nav a.active { color: var(--blue-600); font-weight: 500; }
      .bottom-nav a.active::before { content: ''; position: absolute; top: -1px; left: 50%; width: 40px; height: 3px; margin-left: -20px; border-radius: 0 0 3px 3px; background: var(--blue-600); }
    }
  `,
})
export class Shell {
  private router = inject(Router);
  private auth = inject(AuthService);

  user = this.auth.user;
  building = inject(TechService).building;

  constructor() {
    // Admin Unit: data laporan hanya dimuat sekali saat login, jadi laporan baru dari pelapor tidak muncul.
    // Segarkan tiap 15 detik selama tab terlihat (tanpa kerangka pemuatan ulang).
    if (this.auth.roleCode() === 'ADMIN_UNIT') {
      const admin = inject(AdminService);
      const timer = setInterval(() => { if (!document.hidden) admin.loadReports().catch(() => {}); }, 15000);
      inject(DestroyRef).onDestroy(() => clearInterval(timer));
    }
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

  // Menu dan teks samping bergantung pada peran. Satu daftar dipakai untuk sidebar DAN menu bawah.
  role = computed(() => ROLES[this.auth.roleCode()] ?? ROLES['PELAPOR']);

  // Menu yang disorot: item dengan awalan alamat terpanjang yang cocok.
  // Khusus pelapor: detail laporan = "Laporan Saya", "terkirim" dan preview foto = "Buat laporan".
  active = () => {
    const u = this.url();
    if (u.startsWith('/laporan/baru') || u.endsWith('/terkirim')) return '/laporan/baru';
    if (u.startsWith('/laporan/')) {
      // Detail laporan mengikuti asalnya (?dari=publik), bukan selalu "Laporan Saya"
      const dari = this.router.parseUrl(this.router.url).queryParams['dari'];
      return dari === 'publik' ? '/laporan-publik' : dari === 'beranda' ? '/beranda' : '/laporan-saya';
    }
    const hit = this.role().menu.filter((m) => (['/unit', '/univ', '/teknisi'].includes(m.path) ? u === m.path : u.startsWith(m.path)));
    return hit.sort((a, b) => b.path.length - a.path.length)[0]?.path ?? '';
  };
}
