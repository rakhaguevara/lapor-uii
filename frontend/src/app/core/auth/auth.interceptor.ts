import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

// Menempelkan token login ke setiap permintaan ke backend.
// Kalau backend menjawab 401 (token kedaluwarsa), sesi dibersihkan dan pengguna diarahkan ke halaman login.
// Login sendiri dikecualikan: 401 di sana berarti email/kata sandi salah, bukan sesi habis.
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const token = auth.token();
  const request = token ? req.clone({ setHeaders: { Authorization: 'Bearer ' + token } }) : req;
  return next(request).pipe(
    catchError((err) => {
      if (err instanceof HttpErrorResponse && err.status === 401 && token && !req.url.endsWith('/auth/login')) {
        auth.clear();
        router.navigate(['/login']);
      }
      return throwError(() => err);
    }),
  );
};
