import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { errorMessage } from '../http/api-error';

// Bentuk data pengguna dari backend
interface ApiUser { uuid?: string; full_name: string; role: string; reporter_type?: string }

// Peran dari backend -> nama tampil dan halaman beranda masing-masing
export const ROLE_LABEL: Record<string, string> = {
  PELAPOR: 'Pelapor', TEKNISI: 'Teknisi', ADMIN_UNIT: 'Admin Unit', ADMIN_UNIV: 'Admin Universitas',
};
export const ROLE_HOME: Record<string, string> = {
  PELAPOR: '/beranda', TEKNISI: '/teknisi', ADMIN_UNIT: '/unit', ADMIN_UNIV: '/univ',
};

/*
  SERVICE LOGIN
  Login memanggil backend (POST /api/auth/login) dan menyimpan token di memori.
  Token sengaja tidak disimpan di localStorage (aturan keamanan di README),
  jadi refresh halaman = harus login lagi.
*/
@Injectable({ providedIn: 'root' })
export class AuthService {
  private _token = signal('');
  private _user = signal<ApiUser | null>(null);

  readonly token = this._token.asReadonly();
  readonly loggedIn = computed(() => this._token() !== '');
  // Kode peran (PELAPOR, ADMIN_UNIT, ADMIN_UNIV, ...) dan beranda miliknya
  readonly uuid = computed(() => this._user()?.uuid ?? '');
  readonly roleCode = computed(() => this._user()?.role ?? '');
  readonly home = computed(() => ROLE_HOME[this.roleCode()] ?? '/beranda');
  // Nama dan peran untuk ditampilkan di header
  readonly user = computed(() => ({
    name: this._user()?.full_name ?? '',
    role: ROLE_LABEL[this._user()?.role ?? ''] ?? (this._user()?.role ?? ''),
    type: (this._user()?.reporter_type ?? '').charAt(0) + (this._user()?.reporter_type ?? '').slice(1).toLowerCase(),
  }));

  constructor(private http: HttpClient) {}

  // Mengembalikan null jika berhasil, atau pesan kegagalan untuk ditampilkan.
  // 401 = email/kata sandi salah, 403 = akun dinonaktifkan (lihat Swagger POST /auth/login).
  async login(email: string, password: string): Promise<string | null> {
    try {
      const res = await firstValueFrom(
        this.http.post<{ data: { token: string; user: ApiUser } }>('/api/auth/login', { email, password }),
      );
      this._token.set(res.data.token);
      this._user.set(res.data.user);
      return null;
    } catch (err) {
      if (err instanceof HttpErrorResponse && err.status === 401) return 'Email atau kata sandi tidak sesuai. Periksa lagi lalu coba masuk kembali.';
      if (err instanceof HttpErrorResponse && err.status === 403) return 'Akun kamu dinonaktifkan. Hubungi admin untuk mengaktifkannya kembali.';
      return errorMessage(err, 'Login belum berhasil. Coba lagi.');
    }
  }

  // Hapus sesi di sisi browser saja (dipakai saat token ditolak backend)
  clear(): void {
    this._token.set('');
    this._user.set(null);
  }

  logout(): void {
    this.http.post('/api/auth/logout', {}).subscribe({ error: () => {} });
    this._token.set('');
    this._user.set(null);
  }
}
