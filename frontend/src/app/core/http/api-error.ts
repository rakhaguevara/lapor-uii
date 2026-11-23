import { HttpErrorResponse } from '@angular/common/http';

// Mengubah error dari backend jadi pesan untuk pengguna.
// Backend membalas { status, msg, data }: pesan `msg` dipakai kalau ada, kalau tidak pakai pesan bawaan per status.
export function errorMessage(err: unknown, fallback: string): string {
  if (!(err instanceof HttpErrorResponse)) return fallback;
  if (err.status === 0) return 'Tidak dapat terhubung ke server. Periksa koneksi internet.';
  const msg = typeof err.error?.msg === 'string' ? err.error.msg : '';
  if (err.status === 401) return msg || 'Sesi berakhir. Silakan masuk kembali.';
  if (err.status === 403) return msg || 'Kamu tidak punya akses untuk tindakan ini.';
  if (err.status === 422) return msg || fallback;
  return msg || fallback;
}
