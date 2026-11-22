import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { AdminService, Technician } from '../core/admin.service';
import { PageHead } from '../shared/page-head';

// TUGASKAN TEKNISI: GET /reports/technicians?building_uuid= (teknisi di gedung laporan),
// lalu POST /reports/assign. Kolom catatan di desain tidak punya kolom di API, jadi tidak dikirim.
@Component({
  selector: 'app-unit-assign',
  imports: [RouterLink, PageHead],
  template: `
    <app-page-head title="Tugaskan teknisi" subtitle="Prioritaskan laporan dan koordinasikan penanganan fasilitas."
      [crumbs]="[{ label: 'Portal Admin Unit', link: '/unit' }, { label: 'Tugaskan teknisi' }]" />

    @if (r(); as r) {
      <div class="split">
        <form class="card form-card" style="max-width: none" (ngSubmit)="confirm()" novalidate>
          <h2 style="font-size: 22px; font-weight: 700">Pilih teknisi yang sesuai</h2>
          <p class="sub" style="margin: 8px 0 28px">{{ r.id }} · {{ r.category }} · {{ r.building }}</p>

          <div role="radiogroup" aria-label="Teknisi">
            @for (t of techs(); track t.uuid) {
              <button type="button" class="opt" role="radio" [class.on]="pick() === t.uuid" [attr.aria-checked]="pick() === t.uuid" (click)="pick.set(t.uuid)">
                <span><strong>{{ t.name }}</strong><small>{{ t.buildings.join(', ') || r.building }} · {{ t.active }} tugas aktif</small></span>
                <span class="tagr">{{ pick() === t.uuid ? 'Terpilih ✓' : '' }}</span>
              </button>
            } @empty {
              <p class="empty">{{ loading() ? 'Memuat teknisi…' : 'Belum ada teknisi aktif di gedung ini.' }}</p>
            }
          </div>
          @if (error()) { <p class="error" role="alert" style="color: var(--red); font-size: 12px">{{ error() }}</p> }

          <div class="foot">
            <a class="btn" [routerLink]="['/unit/laporan', r.id]">Batal</a>
            <button class="btn btn-primary" type="submit" [disabled]="!pick() || busy()">Konfirmasi penugasan</button>
          </div>
        </form>

        <aside class="card panel">
          <h2>Sesuai gedung</h2>
          <p class="sub" style="margin-top: 24px; font-size: 13px">Hanya teknisi aktif dengan akses ke {{ r.building }} yang dapat ditugaskan.</p>
          <p class="sub" style="margin-top: 16px; font-size: 13px">Teknisi dapat mengembalikan penugasan dengan alasan.</p>
        </aside>
      </div>
    } @else {
      <p class="empty">Laporan tidak ditemukan.</p>
    }
  `,
})
export class UnitAssign {
  private admin = inject(AdminService);
  private router = inject(Router);
  private id = toSignal(inject(ActivatedRoute).paramMap.pipe(map((p) => p.get('id') ?? '')), { initialValue: '' });

  r = computed(() => this.admin.find(this.id()));
  techs = signal<Technician[]>([]);
  pick = signal('');
  loading = signal(true);
  busy = signal(false);
  error = signal('');

  constructor() {
    const r = this.r();
    this.admin.technicians(r?.buildingUuid ?? '')
      .then((t) => { this.techs.set(t); const cur = t.find((x) => x.uuid === r?.technicianUuid); if (cur) this.pick.set(cur.uuid); })
      .catch(() => this.error.set('Daftar teknisi belum bisa dimuat.'))
      .finally(() => this.loading.set(false));
  }

  async confirm(): Promise<void> {
    if (!this.pick() || this.busy()) return;
    this.busy.set(true);
    this.error.set('');
    try {
      await this.admin.assign(this.r()!.uuid, this.pick());
      this.router.navigate(['/unit/laporan', this.id()], { queryParams: { tersimpan: 1 } });
    } catch {
      this.error.set('Penugasan belum tersimpan. Coba lagi.');
    }
    this.busy.set(false);
  }
}
