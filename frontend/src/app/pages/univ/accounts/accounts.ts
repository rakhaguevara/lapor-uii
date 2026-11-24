import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { Account, AdminService, STAFF_ROLES } from '../../../core/admin/admin.service';
import { ROLE_LABEL } from '../../../core/auth/auth.service';
import { ToastService } from '../../../core/ui/toast.service';
import { Icon } from '../../../shared/icon/icon';
import { Switch } from '../../../shared/switch/switch';
import { PageHead } from '../../../shared/page-head/page-head';
import { Skeleton } from '../../../shared/skeleton/skeleton';

// KELOLA AKUN (Admin Universitas): cari nama/email, filter status, tambah, ubah, nonaktifkan.
@Component({
  selector: 'app-accounts',
  imports: [RouterLink, Icon, PageHead, Skeleton, Switch],
  template: `
    <app-page-head title="Kelola akun" subtitle="Kelola data gedung dan akses pengguna universitas."
      [crumbs]="[{ label: 'Portal Admin Universitas', link: '/univ' }, { label: 'Kelola akun' }]">
      <a class="btn btn-primary" routerLink="/univ/akun/baru"><app-icon name="plus" [size]="18" [stroke]="2.2" /> Tambah akun</a>
    </app-page-head>

    <div class="stack">
      <section class="card tbl" style="padding: 16px; --cols: 2.2fr 1fr 1.4fr 1fr 64px 64px">
        <div class="toolbar" style="padding: 4px 0 16px">
          <div class="field search grow"><label class="sr-only" for="q">Cari</label><app-icon name="search" [size]="16" />
            <input id="q" type="search" placeholder="Cari nama atau email…" [value]="dq()" (input)="dq.set($any($event.target).value)" (keydown.enter)="apply()"></div>
          <div class="field"><label class="sr-only" for="st">Status</label>
            <select id="st" [value]="admin.statusDraft()" (change)="admin.statusDraft.set($any($event.target).value)">
              <option value="aktif">Status aktif</option><option value="nonaktif">Nonaktif</option><option value="">Semua status</option></select></div>
          <button class="btn btn-primary" type="button" (click)="apply()">Cari</button>
        </div>
        <p class="sub m-only" style="margin-bottom: 12px">{{ list().length }} ditampilkan</p>

        <div class="tr th d-only"><span>Nama / email</span><span>Role</span><span>Cakupan</span><span>Status</span><span>Aktif</span><span></span></div>
        @if (!admin.accountsLoaded()) {
          <app-skeleton variant="rows" [count]="5" [cells]="6" cols="2.2fr 1fr 1.4fr 1fr 64px 64px" />
        } @else {
        @for (a of list(); track a.id) {
          <div class="tr row">
            <span><span class="main">{{ a.name }}</span><span class="mute">{{ a.email }}</span></span>
            <span>{{ roleName(a.role) }}</span>
            <span class="mute">{{ a.buildings || '–' }}</span>
            <span class="tag-on" [class.off]="!a.active">{{ a.active ? 'Aktif' : 'Nonaktif' }}</span>
            <span class="acts">
              <app-switch [checked]="a.active" [busy]="busyId() === a.id" [label]="(a.active ? 'Nonaktifkan ' : 'Aktifkan ') + a.name" (toggled)="toggle(a)" />
            </span>
            <span class="acts d-only">
              <a class="icon-btn" [routerLink]="['/univ/akun', a.id]" [attr.aria-label]="'Ubah ' + a.name"><app-icon name="edit" [size]="18" /></a>
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
  // Filter status dibagi dengan halaman Gedung (lihat AdminService). Baru berlaku setelah Cari / Enter.
  q = signal(''); dq = signal('');
  apply(): void { this.q.set(this.dq()); this.admin.statusFilter.set(this.admin.statusDraft()); }

  list = computed(() => {
    const q = this.q().toLowerCase();
    return this.admin.accounts().filter((a) =>
      (a.name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q)) && (!this.admin.statusFilter() || a.active === (this.admin.statusFilter() === 'aktif')));
  });

  roleName = (r: string) => STAFF_ROLES[r] ?? ROLE_LABEL[r] ?? r;
  private toast = inject(ToastService);
  error = signal('');
  busyId = signal('');

  // Sakelar = POST /admin/users/toggle-status
  async toggle(a: Account): Promise<void> {
    const to = !a.active;
    if (!confirm((to ? 'Aktifkan akun ' : 'Nonaktifkan akun ') + a.name + '?')) return;
    this.busyId.set(a.id); this.error.set('');
    try {
      await this.admin.toggleAccount(a.id);
      this.toast.show(`Akun ${a.name} berhasil ${to ? 'diaktifkan' : 'dinonaktifkan'}.`);
    } catch {
      this.error.set('Perubahan belum tersimpan. Coba lagi.');
      this.toast.show(`Gagal ${to ? 'mengaktifkan' : 'menonaktifkan'} akun ${a.name}. Coba lagi.`, 'error');
    } finally { this.busyId.set(''); }
  }
}
