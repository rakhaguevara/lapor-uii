import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

// "Satpam" halaman: jika belum login, arahkan ke /login.
// Ini hanya kenyamanan tampilan. Pengamanan data sungguhan tetap di Backend.
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.loggedIn() ? true : inject(Router).createUrlTree(['/login']);
};

// Kebalikannya, untuk landing page: pengguna yang sudah login langsung dibawa ke portal.
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.loggedIn() ? inject(Router).createUrlTree(['/portal']) : true;
};

// Batasi halaman untuk peran tertentu. Peran lain dibawa ke beranda miliknya.
// (Kenyamanan tampilan saja; Backend tetap yang memeriksa hak akses.)
export const roleGuard = (...roles: string[]): CanActivateFn => () => {
  const auth = inject(AuthService);
  return roles.includes(auth.roleCode()) ? true : inject(Router).createUrlTree([auth.home()]);
};
