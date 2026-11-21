import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth.guard';
import { Shell } from './layout/shell';

/*
  PETA HALAMAN: alamat URL -> halaman yang tampil.
  - Landing (/) dan Login berdiri sendiri, tanpa menu samping.
  - Halaman lain dibungkus Shell (header + menu) dan wajib login.
  loadComponent = halaman baru diunduh saat dibuka (lazy loading), supaya awal muat ringan.
  Urutan penting: 'laporan/baru' harus di atas 'laporan/:id', kalau tidak "baru" dianggap id.
*/
export const routes: Routes = [
  { path: '', pathMatch: 'full', canActivate: [guestGuard], loadComponent: () => import('./pages/landing').then((m) => m.Landing) },
  { path: 'login', loadComponent: () => import('./pages/login').then((m) => m.Login) },
  {
    path: '',
    component: Shell,
    canActivate: [authGuard], // semua halaman di bawah ini wajib login
    children: [
      { path: 'portal', loadComponent: () => import('./pages/portal').then((m) => m.Portal) },
      { path: 'beranda', loadComponent: () => import('./pages/home').then((m) => m.Home) },
      { path: 'laporan/baru', loadComponent: () => import('./pages/create-report').then((m) => m.CreateReport) },
      { path: 'laporan/baru/foto', loadComponent: () => import('./pages/photo-preview').then((m) => m.PhotoPreview) },
      { path: 'laporan/:id/terkirim', loadComponent: () => import('./pages/report-success').then((m) => m.ReportSuccess) },
      { path: 'laporan/:id', loadComponent: () => import('./pages/report-detail').then((m) => m.ReportDetail) },
      // Dua alamat ini memakai halaman yang sama; `data.mode` membedakan isinya
      { path: 'laporan-saya', data: { mode: 'mine' }, loadComponent: () => import('./pages/reports-page').then((m) => m.ReportsPage) },
      { path: 'laporan-publik', data: { mode: 'public' }, loadComponent: () => import('./pages/reports-page').then((m) => m.ReportsPage) },
      { path: '**', redirectTo: 'beranda' },
    ],
  },
  { path: '**', redirectTo: '' },
];
