import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, input } from '@angular/core';

/*
  KERANGKA PEMUATAN (skeleton)
  Placeholder berkilau yang menggantikan bagian halaman selagi datanya dimuat dari backend.
  Pakai: <app-skeleton variant="rows" [count]="4" />
    stats      4 kartu angka
    rows       baris daftar/tabel (cells = jumlah kolom, cols = lebar kolom untuk desktop)
    dashboard  kartu angka + dua panel (dashboard dan statistik petugas)
  Tampil dengan jeda singkat (.sk-fade) supaya tidak berkedip bila data cepat tiba.
  Blok dasarnya, kelas global .sk, ada di styles.css.
*/
@Component({
  selector: 'app-skeleton',
  template: `
    <div class="sk-fade" role="status" aria-label="Memuat data">
      @switch (variant()) {
        @case ('stats') { <ng-container *ngTemplateOutlet="stats" /> }
        @case ('dashboard') {
          <div class="stack">
            <ng-container *ngTemplateOutlet="stats" />
            <div class="split wide">
              <section class="card panel">
                <span class="sk" style="width: 180px; height: 20px"></span>
                <span class="sk" style="width: 140px; height: 12px; margin-top: 10px"></span>
                <span class="sk" style="width: 100%; height: 150px; margin-top: 24px; border-radius: 12px"></span>
              </section>
              <section class="card panel">
                <span class="sk" style="width: 160px; height: 20px"></span>
                @for (i of [1, 2, 3, 4]; track i) { <span class="sk" style="width: 100%; height: 14px; margin-top: 22px"></span> }
              </section>
            </div>
          </div>
        }
        @default {
          @for (r of items(); track r) {
            <div class="row" [style.--cols]="cols()">
              <div class="first">
                <span class="sk" style="width: 64px; height: 11px"></span>
                <span class="sk" style="width: 70%; height: 15px; margin-top: 8px"></span>
              </div>
              @for (c of rest(); track c) {
                <div><span class="sk" style="width: 75%; height: 13px"></span><span class="sk" style="width: 50%; height: 11px; margin-top: 7px"></span></div>
              }
            </div>
          }
        }
      }
    </div>
    <ng-template #stats>
      <div class="grid-4">
        @for (i of [1, 2, 3, 4]; track i) {
          <div class="card stat"><span class="sk" style="width: 90px; height: 12px"></span><span class="sk" style="width: 56px; height: 28px; margin-top: 16px"></span></div>
        }
      </div>
    </ng-template>
  `,
  styles: `
    :host { display: block; }
    .row { display: grid; grid-template-columns: var(--cols); gap: 16px; align-items: center; min-height: 78px; padding: 12px 16px; border-bottom: 1px solid var(--line); }
    .row:last-child { border-bottom: 0; }
    .first { display: flex; flex-direction: column; }
    @media (max-width: 800px) {
      .row { display: flex; flex-direction: column; align-items: flex-start; gap: 12px; margin-bottom: 16px; padding: 16px; border: 1px solid var(--line); border-radius: var(--r-card); background: var(--white); }
      .row > div { width: 100%; }
    }
  `,
  imports: [NgTemplateOutlet],
})
export class Skeleton {
  variant = input<'stats' | 'rows' | 'dashboard'>('rows');
  count = input(4);                              // jumlah baris (variant rows)
  cells = input(4);                              // jumlah kolom (variant rows)
  cols = input('2.1fr 1.33fr 1fr 0.8fr');        // lebar kolom di desktop
  items = computed(() => Array.from({ length: this.count() }, (_, i) => i));
  rest = computed(() => Array.from({ length: this.cells() - 1 }, (_, i) => i));
}
