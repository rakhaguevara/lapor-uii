import { HttpClient } from '@angular/common/http';
import { Injectable, computed, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

// Bentuk data pengguna dari backend
interface ApiUser { full_name: string; role: string; reporter_type?: string }

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
  // Nama dan peran untuk ditampilkan di header
  readonly user = computed(() => ({
    name: this._user()?.full_name ?? '',
    role: this._user()?.role === 'PELAPOR' ? 'Pelapor' : (this._user()?.role ?? ''),
    type: (this._user()?.reporter_type ?? '').charAt(0) + (this._user()?.reporter_type ?? '').slice(1).toLowerCase(),
  }));

  constructor(private http: HttpClient) {}

  // Mengembalikan true jika email dan password benar
  async login(email: string, password: string): Promise<boolean> {
    try {
      const res = await firstValueFrom(
        this.http.post<{ data: { token: string; user: ApiUser } }>('/api/auth/login', { email, password }),
      );
      this._token.set(res.data.token);
      this._user.set(res.data.user);
      return true;
    } catch {
      return false;
    }
  }

  logout(): void {
    this.http.post('/api/auth/logout', {}).subscribe({ error: () => {} });
    this._token.set('');
    this._user.set(null);
  }
}
