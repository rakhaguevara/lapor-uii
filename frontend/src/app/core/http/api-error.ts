import { HttpErrorResponse } from '@angular/common/http';

// Mengubah error dari backend jadi pesan untuk pengguna.
// Backend membalas { status, msg, data }: pesan `msg` dipakai kalau ada, kalau tidak pakai pesan bawaan per status.
export function errorMessage(err: unknown, fallback: string): string {
  if (!(err instanceof HttpErrorResponse)) return fallback;
  if (err.status === 0) return 'Tidak dapat terhubung ke server. Periksa koneksi internet.';
  const msg = typeof err.error?.msg === 'string' ? err.error.msg : '';
  if (err.status === 401) return msg || 'Sesi berakhir. Silakan masuk kembali.';
  if (err.status === 403) return msg || 'Kamu tidak punya akses untuk tindakan ini.';
  if (err.status === 422) {
    // Validasi Laravel: { message, errors: { field: [pesan] } }. Pesan bawaannya berbahasa Inggris, jadi dipakai fallback kecuali ada `msg`.
    const taken = Object.values(err.error?.errors ?? {}).flat().some((m) => /already been taken/i.test(String(m)));
    if (taken) return 'Data ini sudah terdaftar. Gunakan yang lain.';
    return msg || fallback;
  }
  return msg || fallback;
}
