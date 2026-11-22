import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { AdminService, Technician } from '../core/admin.service';
import { PageHead } from '../shared/page-head';

// TUGASKAN TEKNISI: pilih teknisi yang keahliannya cocok dengan kategori, tambah catatan, konfirmasi.
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
            @for (t of techs; track t.name) {
              <button type="button" class="opt" role="radio" [class.on]="pick() === t.name" [attr.aria-checked]="pick() === t.name"
                [disabled]="!match(t)" (click)="pick.set(t.name)">
                <span><strong>{{ t.name }}</strong><small>{{ match(t) ? r.category : t.skills[0] }} · {{ t.active }} tugas aktif</small></span>
                <span class="tagr">{{ pick() === t.name ? 'Terpilih ✓' : match(t) ? '' : 'Keahlian berbeda' }}</span>
              </button>
            }
          </div>

          <div class="field" style="margin-top: 24px">
            <label for="cat">Catatan penugasan (opsional)</label>
            <textarea id="cat" rows="3" [value]="note()" (input)="note.set($any($event.target).value)" placeholder="Contoh: Mohon periksa sebelum perkuliahan siang dimulai."></textarea>
          </div>

          <div class="foot">
            <a class="btn" [routerLink]="['/unit/laporan', r.id]">Batal</a>
            <button class="btn btn-primary" type="submit" [disabled]="!pick()">Konfirmasi penugasan</button>
          </div>
        </form>

        <aside class="card panel">
          <h2>Sesuai gedung dan keahlian</h2>
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

  techs = this.admin.technicians;
  r = computed(() => this.admin.find(this.id()));
  pick = signal(this.admin.assignments()[this.id()]?.tech ?? '');
  note = signal('');
  match = (t: Technician) => this.admin.skillMatch(t, this.r()?.category ?? '');

  confirm(): void {
    if (!this.pick()) return;
    this.admin.assign(this.id(), this.pick(), this.note().trim());
    this.router.navigate(['/unit/laporan', this.id()], { queryParams: { tersimpan: 1 } });
  }
}
