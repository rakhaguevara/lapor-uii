import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminService } from '../core/admin.service';
import { Icon } from '../shared/icon';
import { PageHead } from '../shared/page-head';

// BERANDA ADMIN UNIVERSITAS: 4 angka ringkas dan dua pintu masuk (Gedung, Akun pengguna).
@Component({
  selector: 'app-univ-home',
  imports: [RouterLink, Icon, PageHead],
  template: `
    <app-page-head title="Dashboard Admin Universitas" subtitle="Kelola data gedung dan akses pengguna universitas."
      [crumbs]="[{ label: 'Portal Admin Universitas', link: '/portal' }, { label: 'Dashboard Admin Universitas' }]" />

    <div class="stack">
      <section class="grid-4" aria-label="Ringkasan">
        <div class="card stat"><span>Gedung aktif</span><strong>{{ n().gedung }}</strong></div>
        <div class="card stat"><span>Akun staf aktif</span><strong>{{ n().akun }}</strong></div>
        <div class="card stat"><span>Teknisi</span><strong>{{ n().teknisi }}</strong></div>
        <div class="card stat"><span>Role akses</span><strong>{{ n().role }}</strong></div>
      </section>

      <div class="grid-2">
        <section class="card panel go">
          <h2>Gedung</h2>
          <p class="sub">Kelola lokasi laporan dan teknisi penanggung jawab.</p>
          <a class="btn btn-primary" routerLink="/univ/gedung">Kelola Gedung <app-icon name="right" [size]="16" [stroke]="2" /></a>
        </section>
        <section class="card panel go">
          <h2>Akun pengguna</h2>
          <p class="sub">Kelola akun, role, dan cakupan akses pengguna.</p>
          <a class="btn btn-primary" routerLink="/univ/akun">Kelola Akun pengguna <app-icon name="right" [size]="16" [stroke]="2" /></a>
        </section>
      </div>
    </div>
  `,
  styles: `
    .go { display: flex; flex-direction: column; align-items: flex-start; gap: 16px; min-height: 246px; padding: 28px 24px; }
    .go h2 { font-size: 24px; font-weight: 700; }
    .go .sub { margin: 0; font-size: 14px; }
    .go .btn { margin-top: auto; min-width: 300px; }
    @media (max-width: 800px) { .go { min-height: 0; } .go .btn { width: 100%; min-width: 0; margin-top: 8px; } }
  `,
})
export class UnivHome {
  private admin = inject(AdminService);
  n = computed(() => {
    const acc = this.admin.accounts().filter((a) => a.active);
    return {
      gedung: this.admin.buildings().filter((b) => b.active).length,
      akun: acc.length,
      teknisi: acc.filter((a) => a.role === 'TEKNISI').length,
      role: new Set(acc.map((a) => a.role)).size,
    };
  });
}
