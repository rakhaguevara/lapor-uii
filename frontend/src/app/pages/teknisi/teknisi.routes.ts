import { Routes } from '@angular/router';

// PETA HALAMAN TEKNISI (di bawah /teknisi). Semua halaman portal teknisi ada di folder ini.
const dashboard = () => import('./dashboard/teknisi-dashboard').then((m) => m.TeknisiDashboard);

export const TEKNISI_ROUTES: Routes = [
  // Dashboard dan tiga daftar tugas: satu halaman, dibedakan oleh data.mode
  { path: '', pathMatch: 'full', data: { mode: 'home' }, loadComponent: dashboard },
  { path: 'tugas', data: { mode: 'all' }, loadComponent: dashboard },
  { path: 'tersedia', data: { mode: 'available' }, loadComponent: dashboard },
  { path: 'saya', data: { mode: 'mine' }, loadComponent: dashboard },
  // Satu tugas
  { path: 'tugas/:id', loadComponent: () => import('./detail/teknisi-detail').then((m) => m.TeknisiDetail) },
  { path: 'tugas/:id/status', loadComponent: () => import('./status/teknisi-status').then((m) => m.TeknisiStatus) },
  { path: 'tugas/:id/tolak', loadComponent: () => import('./reject/teknisi-reject').then((m) => m.TeknisiReject) },
  { path: 'tugas/:id/dikembalikan', loadComponent: () => import('./rejected/teknisi-rejected').then((m) => m.TeknisiRejected) },
  { path: '**', redirectTo: '' },
];
