import { HttpClient, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from './auth.service';

// Alamat pemeriksa sesi: endpoint yang boleh dibaca semua peran yang sudah login
const PROBE = '/api/locations';

// Menempelkan token login ke setiap permintaan ke backend.
// 401 bisa berarti dua hal: (1) token kedaluwarsa, atau (2) server menolak AKSI itu (mis. peran/gedung tidak cocok).
// Hanya yang pertama boleh mengeluarkan pengguna. Jadi saat sebuah aksi dijawab 401, sesi diperiksa dulu lewat
// permintaan baca; kalau sesi masih sah, pengguna tetap di halaman dan melihat pesan gagalnya.
// Login sendiri dikecualikan: 401 di sana berarti email/kata sandi salah, bukan sesi habis.
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const http = inject(HttpClient);
  const token = auth.token();
  const request = token ? req.clone({ setHeaders: { Authorization: 'Bearer ' + token } }) : req;

  const expire = () => {
    auth.clear();
    router.navigate(['/login']);
  };

  return next(request).pipe(
    catchError((err) => {
      if (!(err instanceof HttpErrorResponse && err.status === 401 && token && !req.url.endsWith('/auth/login'))) {
        return throwError(() => err);
      }
      // Pemeriksa sesi sendiri ditolak 401 = sesi memang habis
      if (req.method === 'GET' && req.url.endsWith(PROBE)) {
        expire();
        return throwError(() => err);
      }
      // Aksi lain ditolak 401: periksa dulu apakah sesi masih sah
      return http.get(PROBE).pipe(
        switchMap(() => throwError(() => err)),
        catchError(() => throwError(() => err)),
      );
    }),
  );
};
