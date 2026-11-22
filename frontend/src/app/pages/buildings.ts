import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { AdminService } from '../core/admin.service';
import { Icon } from '../shared/icon';
import { PageHead } from '../shared/page-head';

// KELOLA GEDUNG (Admin Universitas): cari, filter status, tambah, ubah, nonaktifkan.
// Setelah simpan, ?tersimpan=<nama> menampilkan kotak hijau di bawah daftar.
@Component({
  selector: 'app-buildings',
  imports: [RouterLink, Icon, PageHead],
  template: `
    <app-page-head title="Kelola gedung" subtitle="Kelola data gedung dan akses pengguna universitas."
      [crumbs]="[{ label: 'Portal Admin Universitas', link: '/univ' }, { label: 'Kelola gedung' }]">
      <a class="btn btn-primary" routerLink="/univ/gedung/baru"><app-icon name="plus" [size]="18" [stroke]="2.2" /> Tambah gedung</a>
    </app-page-head>

    <div class="stack">
      <section class="card tbl" style="padding: 16px; --cols: 2.2fr 1fr 1.4fr 1fr 96px">
        <div class="toolbar" style="padding: 4px 0 16px">
          <div class="field search grow"><label class="sr-only" for="q">Cari</label><app-icon name="search" [size]="16" />
            <input id="q" type="search" placeholder="Cari nama gedung…" [value]="q()" (input)="q.set($any($event.target).value)"></div>
          <div class="field"><label class="sr-only" for="st">Status</label>
            <select id="st" (change)="st.set($any($event.target).value)">
              <option value="aktif">Status aktif</option><option value="nonaktif">Nonaktif</option><option value="">Semua status</option></select></div>
        </div>
        <p class="sub m-only" style="margin-bottom: 12px">{{ list().length }} ditampilkan</p>

        <div class="tr th d-only"><span>Nama gedung</span><span>Kode</span><span>Cakupan</span><span>Status</span><span></span></div>
        @for (b of list(); track b.id) {
          <div class="tr row">
            <span class="main">{{ b.name }}</span>
            <span><span class="m-only mute">Kode </span>{{ b.code }}</span>
            <span class="mute">{{ b.scope }} · {{ b.floors }} lantai</span>
            <span class="tag-on" [class.off]="!b.active">{{ b.active ? 'Aktif' : 'Nonaktif' }}</span>
            <span class="acts d-only">
              <a class="icon-btn" [routerLink]="['/univ/gedung', b.id]" [attr.aria-label]="'Ubah ' + b.name"><app-icon name="edit" [size]="18" /></a>
              <button class="icon-btn" type="button" [attr.aria-label]="(b.active ? 'Nonaktifkan ' : 'Aktifkan ') + b.name" (click)="toggle(b.id, b.name, b.active)"><app-icon name="trash" [size]="18" /></button>
            </span>
            <span class="acts m-only"><a class="btn" [routerLink]="['/univ/gedung', b.id]">Lihat / ubah gedung</a></span>
          </div>
        } @empty { <p class="empty">Tidak ada gedung yang cocok.</p> }
      </section>

      @if (saved()) { <p class="ok-note" role="status"><app-icon name="check" [size]="16" [stroke]="2.4" /> {{ saved() }} berhasil disimpan.</p> }
    </div>
  `,
})
export class Buildings {
  private admin = inject(AdminService);
  saved = toSignal(inject(ActivatedRoute).queryParamMap.pipe(map((p) => p.get('tersimpan') ?? '')), { initialValue: '' });
  q = signal(''); st = signal('aktif');

  list = computed(() => {
    const q = this.q().toLowerCase();
    return this.admin.buildings().filter((b) =>
      b.name.toLowerCase().includes(q) && (!this.st() || b.active === (this.st() === 'aktif')));
  });

  // Tombol tempat sampah = nonaktifkan (data tidak dihapus, laporan lama tetap utuh)
  toggle(id: string, name: string, active: boolean): void {
    if (confirm((active ? 'Nonaktifkan ' : 'Aktifkan ') + name + '?')) this.admin.setBuildingActive(id, !active);
  }
}
