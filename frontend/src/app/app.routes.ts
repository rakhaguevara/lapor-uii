import { Routes } from '@angular/router';
import { authGuard, guestGuard, roleGuard } from './core/auth.guard';
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
  {
    // Portal petugas. roleGuard membatasi per peran (Backend tetap pemeriksa sebenarnya).
    path: 'unit',
    component: Shell,
    canActivate: [authGuard, roleGuard('ADMIN_UNIT')],
    children: [
      { path: '', pathMatch: 'full', loadComponent: () => import('./pages/unit-home').then((m) => m.UnitHome) },
      { path: 'laporan', loadComponent: () => import('./pages/unit-reports').then((m) => m.UnitReports) },
      { path: 'laporan/:id/tugaskan', loadComponent: () => import('./pages/unit-assign').then((m) => m.UnitAssign) },
      { path: 'laporan/:id', loadComponent: () => import('./pages/unit-detail').then((m) => m.UnitDetail) },
      { path: 'statistik', loadComponent: () => import('./pages/unit-stats').then((m) => m.UnitStats) },
      { path: '**', redirectTo: '' },
    ],
  },
  {
    path: 'univ',
    component: Shell,
    canActivate: [authGuard, roleGuard('ADMIN_UNIV')],
    children: [
      { path: '', pathMatch: 'full', loadComponent: () => import('./pages/univ-home').then((m) => m.UnivHome) },
      { path: 'gedung', loadComponent: () => import('./pages/buildings').then((m) => m.Buildings) },
      { path: 'gedung/baru', loadComponent: () => import('./pages/building-form').then((m) => m.BuildingForm) },
      { path: 'gedung/:id', loadComponent: () => import('./pages/building-form').then((m) => m.BuildingForm) },
      { path: 'akun', loadComponent: () => import('./pages/accounts').then((m) => m.Accounts) },
      { path: 'akun/baru', loadComponent: () => import('./pages/account-form').then((m) => m.AccountForm) },
      { path: 'akun/:id', loadComponent: () => import('./pages/account-form').then((m) => m.AccountForm) },
      { path: '**', redirectTo: '' },
    ],
  },
  { path: '**', redirectTo: '' },
];
