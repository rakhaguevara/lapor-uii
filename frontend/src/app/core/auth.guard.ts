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
