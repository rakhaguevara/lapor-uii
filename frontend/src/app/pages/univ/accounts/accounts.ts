import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { Account, AdminService, STAFF_ROLES } from '../../../core/admin/admin.service';
import { ROLE_LABEL } from '../../../core/auth/auth.service';
import { Icon } from '../../../shared/icon/icon';
import { PageHead } from '../../../shared/page-head/page-head';
import { Skeleton } from '../../../shared/skeleton/skeleton';

// KELOLA AKUN (Admin Universitas): cari nama/email, filter status, tambah, ubah, nonaktifkan.
@Component({
  selector: 'app-accounts',
  imports: [RouterLink, Icon, PageHead, Skeleton],
  template: `
    <app-page-head title="Kelola akun" subtitle="Kelola data gedung dan akses pengguna universitas."
      [crumbs]="[{ label: 'Portal Admin Universitas', link: '/univ' }, { label: 'Kelola akun' }]">
      <a class="btn btn-primary" routerLink="/univ/akun/baru"><app-icon name="plus" [size]="18" [stroke]="2.2" /> Tambah akun</a>
    </app-page-head>

    <div class="stack">
      <section class="card tbl" style="padding: 16px; --cols: 2.2fr 1fr 1.4fr 1fr 96px">
        <div class="toolbar" style="padding: 4px 0 16px">
          <div class="field search grow"><label class="sr-only" for="q">Cari</label><app-icon name="search" [size]="16" />
            <input id="q" type="search" placeholder="Cari nama atau email…" [value]="q()" (input)="q.set($any($event.target).value)"></div>
          <div class="field"><label class="sr-only" for="st">Status</label>
            <select id="st" (change)="st.set($any($event.target).value)">
              <option value="aktif">Status aktif</option><option value="nonaktif">Nonaktif</option><option value="">Semua status</option></select></div>
        </div>
        <p class="sub m-only" style="margin-bottom: 12px">{{ list().length }} ditampilkan</p>

        <div class="tr th d-only"><span>Nama / email</span><span>Role</span><span>Cakupan</span><span>Status</span><span></span></div>
        @if (!admin.accountsLoaded()) {
          <app-skeleton variant="rows" [count]="5" [cells]="5" cols="2.2fr 1fr 1.4fr 1fr 96px" />
        } @else {
        @for (a of list(); track a.id) {
          <div class="tr row">
            <span><span class="main">{{ a.name }}</span><span class="mute">{{ a.email }}</span></span>
            <span>{{ roleName(a.role) }}</span>
            <span class="mute">{{ a.buildings || '–' }}</span>
            <span class="tag-on" [class.off]="!a.active">{{ a.active ? 'Aktif' : 'Nonaktif' }}</span>
            <span class="acts d-only">
              <a class="icon-btn" [routerLink]="['/univ/akun', a.id]" [attr.aria-label]="'Ubah ' + a.name"><app-icon name="edit" [size]="18" /></a>
              <button class="icon-btn" type="button" [attr.aria-label]="(a.active ? 'Nonaktifkan ' : 'Aktifkan ') + a.name" (click)="toggle(a)"><app-icon name="trash" [size]="18" /></button>
            </span>
            <span class="acts m-only"><a class="btn" [routerLink]="['/univ/akun', a.id]">Lihat / ubah akun</a></span>
          </div>
        } @empty { <p class="empty">Tidak ada akun yang cocok.</p> }
        }
      </section>

      @if (error()) { <p class="alert" role="alert" style="padding: 12px 16px; border-radius: var(--r-ctl); background: var(--red-bg); color: var(--red)">{{ error() }}</p> }
      @if (saved()) { <p class="ok-note" role="status"><app-icon name="check" [size]="16" [stroke]="2.4" /> Akun {{ saved() }} berhasil disimpan.</p> }
    </div>
  `,
})
export class Accounts {
  admin = inject(AdminService);
  saved = toSignal(inject(ActivatedRoute).queryParamMap.pipe(map((p) => p.get('tersimpan') ?? '')), { initialValue: '' });
  q = signal(''); st = signal('aktif');

  list = computed(() => {
    const q = this.q().toLowerCase();
    return this.admin.accounts().filter((a) =>
      (a.name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q)) && (!this.st() || a.active === (this.st() === 'aktif')));
  });

  roleName = (r: string) => STAFF_ROLES[r] ?? ROLE_LABEL[r] ?? r;
  error = signal('');

  // Tombol tempat sampah = POST /admin/users/toggle-status
  async toggle(a: Account): Promise<void> {
    if (!confirm((a.active ? 'Nonaktifkan akun ' : 'Aktifkan akun ') + a.name + '?')) return;
    try { this.error.set(''); await this.admin.toggleAccount(a.id); } catch { this.error.set('Perubahan belum tersimpan. Coba lagi.'); }
  }
}
