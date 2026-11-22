import { Component, inject } from '@angular/core';
import { AuthService } from '../core/auth.service';
import { Welcome } from '../shared/welcome';

// PORTAL ("Selamat datang"): halaman pertama setelah login. Pelapor memilih "Buka portal".
@Component({
  selector: 'app-portal',
  imports: [Welcome],
  template: `
    <div class="m-only intro">
      <h1>Selamat datang</h1>
      <p>Sedang masuk sebagai {{ user.name }} · {{ user.role }}</p>
    </div>
    <app-welcome [authed]="true" [home]="auth.home()" [access]="access()" />
  `,
  styles: `
    .intro { margin-bottom: 16px; }
    h1 { font-size: 23px; line-height: 1.3; font-weight: 700; }
    p { margin-top: 8px; color: var(--muted); font-size: 12.5px; }
    :host { display: block; padding-top: 16px; }
    @media (max-width: 800px) { :host { padding-top: 0; } }
  `,
})
export class Portal {
  auth = inject(AuthService);
  user = this.auth.user();
  // Teks kartu akses per peran
  access = () => ({
    PELAPOR: { title: 'Pelapor', text: 'Buat laporan dan pantau perkembangannya.' },
    ADMIN_UNIT: { title: 'Admin Unit', text: 'Prioritaskan laporan dan tugaskan teknisi.' },
    ADMIN_UNIV: { title: 'Admin Universitas', text: 'Kelola data gedung dan akun pengguna.' },
  } as Record<string, { title: string; text: string }>)[this.auth.roleCode()] ?? { title: this.user.role, text: '' };
}
