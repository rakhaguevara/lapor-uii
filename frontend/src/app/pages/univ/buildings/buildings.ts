import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { AdminService, Building } from '../../../core/admin/admin.service';
import { ToastService } from '../../../core/ui/toast.service';
import { Icon } from '../../../shared/icon/icon';
import { Switch } from '../../../shared/switch/switch';
import { PageHead } from '../../../shared/page-head/page-head';
import { Skeleton } from '../../../shared/skeleton/skeleton';

// KELOLA GEDUNG (Admin Universitas): cari, filter status, tambah, ubah, nonaktifkan.
// Setelah simpan, ?tersimpan=<nama> menampilkan kotak hijau di bawah daftar.
@Component({
  selector: 'app-buildings',
  imports: [RouterLink, Icon, PageHead, Skeleton, Switch],
  template: `
    <app-page-head title="Kelola gedung" subtitle="Kelola data gedung dan akses pengguna universitas."
      [crumbs]="[{ label: 'Portal Admin Universitas', link: '/univ' }, { label: 'Kelola gedung' }]">
      <a class="btn btn-primary" routerLink="/univ/gedung/baru"><app-icon name="plus" [size]="18" [stroke]="2.2" /> Tambah gedung</a>
    </app-page-head>

    <div class="stack">
      <section class="card tbl" style="padding: 16px; --cols: 2.2fr 1fr 1.4fr 1fr 64px 64px">
        <div class="toolbar" style="padding: 4px 0 16px">
          <div class="field search grow"><label class="sr-only" for="q">Cari</label><app-icon name="search" [size]="16" />
            <input id="q" type="search" placeholder="Cari nama gedung…" [value]="dq()" (input)="dq.set($any($event.target).value)" (keydown.enter)="apply()"></div>
          <div class="field"><label class="sr-only" for="st">Status</label>
            <select id="st" [value]="admin.statusDraft()" (change)="admin.statusDraft.set($any($event.target).value)">
              <option value="">Semua status</option><option value="aktif">Status aktif</option><option value="nonaktif">Nonaktif</option></select></div>
          <button class="btn btn-primary" type="button" (click)="apply()">Cari</button>
        </div>
        <p class="sub m-only" style="margin-bottom: 12px">{{ list().length }} ditampilkan</p>

        <div class="tr th d-only"><span>Nama gedung</span><span>Kode</span><span>Cakupan</span><span>Status</span><span>Aktif</span><span></span></div>
        @if (!admin.buildingsLoaded()) {
          <app-skeleton variant="rows" [count]="5" [cells]="6" cols="2.2fr 1fr 1.4fr 1fr 64px 64px" />
        } @else {
        @for (b of list(); track b.id) {
          <div class="tr row">
            <span class="main">{{ b.name }}</span>
            <span><span class="m-only mute">Kode </span>{{ b.code }}</span>
            <span class="mute">{{ b.faculty }}{{ b.floors ? ' · ' + b.floors + ' lantai' : '' }}</span>
            <span class="tag-on" [class.off]="!b.active">{{ b.active ? 'Aktif' : 'Nonaktif' }}</span>
            <span class="acts">
              <app-switch [checked]="b.active" [busy]="busyId() === b.id" [label]="(b.active ? 'Nonaktifkan ' : 'Aktifkan ') + b.name" (toggled)="toggle(b)" />
            </span>
            <span class="acts d-only">
              <a class="icon-btn" [routerLink]="['/univ/gedung', b.id]" [attr.aria-label]="'Ubah ' + b.name"><app-icon name="edit" [size]="18" /></a>
            </span>
            <span class="acts m-only"><a class="btn" [routerLink]="['/univ/gedung', b.id]">Lihat / ubah gedung</a></span>
          </div>
        } @empty { <p class="empty">Tidak ada gedung yang cocok.</p> }
        }
      </section>

      @if (error()) { <p class="alert" role="alert" style="padding: 12px 16px; border-radius: var(--r-ctl); background: var(--red-bg); color: var(--red)">{{ error() }}</p> }
      @if (saved()) { <p class="ok-note" role="status"><app-icon name="check" [size]="16" [stroke]="2.4" /> {{ saved() }} berhasil disimpan.</p> }
    </div>
  `,
})
export class Buildings {
  admin = inject(AdminService);
  saved = toSignal(inject(ActivatedRoute).queryParamMap.pipe(map((p) => p.get('tersimpan') ?? '')), { initialValue: '' });
  // Filter status dibagi dengan halaman Akun pengguna (lihat AdminService). Baru berlaku setelah Cari / Enter.
  q = signal(''); dq = signal('');
  apply(): void { this.q.set(this.dq()); this.admin.statusFilter.set(this.admin.statusDraft()); }

  list = computed(() => {
    const q = this.q().toLowerCase();
    return this.admin.buildings().filter((b) =>
      b.name.toLowerCase().includes(q) && (!this.admin.statusFilter() || b.active === (this.admin.statusFilter() === 'aktif')))
      .sort((x, y) => Number(y.active) - Number(x.active)); // nonaktif di paling bawah, tetap bisa diaktifkan lagi
  });

  // Sakelar = nonaktifkan/aktifkan (data tidak dihapus, laporan lama tetap utuh)
  private toast = inject(ToastService);
  error = signal('');
  busyId = signal('');

  async toggle(b: Building): Promise<void> {
    const to = !b.active;
    if (!confirm((to ? 'Aktifkan ' : 'Nonaktifkan ') + b.name + '?')) return;
    this.busyId.set(b.id); this.error.set('');
    try {
      await this.admin.setBuildingActive(b, to);
      this.toast.show(`${b.name} berhasil ${to ? 'diaktifkan' : 'dinonaktifkan'}.`);
    } catch (e) {
      // 422 = ditolak validasi backend; tampilkan alasannya bila ada
      const body = (e as { error?: { message?: string; msg?: string; errors?: Record<string, string[]> } }).error;
      const why = body?.errors ? Object.values(body.errors).flat().join(' ') : (body?.message ?? body?.msg ?? '');
      this.error.set('Perubahan belum tersimpan. Coba lagi.');
      this.toast.show(`Gagal ${to ? 'mengaktifkan' : 'menonaktifkan'} ${b.name}.${why ? ' ' + why : ' Coba lagi.'}`, 'error');
    } finally { this.busyId.set(''); }
  }
}
