import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { TechService } from '../../../core/tech/tech.service';
import { PageHead } from '../../../shared/page-head/page-head';

// TOLAK PENUGASAN (teknisi): alasan wajib, diteruskan ke Admin Unit. Laporan tidak dihapus.
@Component({
  selector: 'app-teknisi-reject',
  imports: [RouterLink, PageHead],
  template: `
    <app-page-head title="Tolak penugasan" subtitle="Kelola penanganan fasilitas di gedung tanggung jawab Anda."
      [crumbs]="[{ label: 'Portal Teknisi', link: '/teknisi' }, { label: 'Tolak penugasan' }]" />

    @if (r(); as r) {
      <form class="card" (submit)="$event.preventDefault(); send()" novalidate>
        <h2>Kembalikan penugasan ke Admin Unit</h2>
        <p class="sub">{{ r.id }} · {{ r.title }}</p>

        <div class="field" [class.invalid]="submitted() && !reason().trim()">
          <label for="reason">Alasan penolakan *</label>
          <textarea id="reason" rows="4" [value]="reason()" (input)="reason.set($any($event.target).value)"></textarea>
          @if (submitted() && !reason().trim()) { <span class="error" role="alert">Alasan wajib diisi.</span> }
        </div>

        <p class="sub hint">Alasan diteruskan ke Admin Unit. Laporan tidak dihapus atau ditolak.</p>
        @if (error()) { <p class="error" role="alert">{{ error() }}</p> }

        <div class="foot">
          <a class="btn" [routerLink]="['/teknisi/tugas', r.id]">Batal</a>
          <button class="btn btn-primary" type="submit" [disabled]="busy()">Kirim alasan</button>
        </div>
      </form>
    } @else {
      <p class="empty">Tugas tidak ditemukan.</p>
    }
  `,
  styles: `
    form { display: flex; flex-direction: column; gap: 24px; max-width: 752px; }
    h2 { font-size: 22px; font-weight: 600; }
    textarea { min-height: 116px; }
    .error { color: var(--red); font-size: 12px; }
    .foot { display: flex; justify-content: space-between; gap: 16px; }
    .foot .btn-primary { min-width: 210px; }
    @media (max-width: 800px) { .foot { flex-direction: column-reverse; } .foot .btn-primary { min-width: 0; } }
  `,
})
export class TeknisiReject {
  private tech = inject(TechService);
  private router = inject(Router);
  private id = toSignal(inject(ActivatedRoute).paramMap.pipe(map((p) => p.get('id') ?? '')), { initialValue: '' });

  r = computed(() => this.tech.find(this.id()));
  reason = signal('');
  submitted = signal(false);
  busy = signal(false);
  error = signal('');

  async send(): Promise<void> {
    this.submitted.set(true);
    if (!this.reason().trim()) return;
    this.busy.set(true);
    this.error.set('');
    try {
      await this.tech.reject(this.r()!.uuid, this.reason().trim());
      this.router.navigate(['/teknisi/tugas', this.id(), 'dikembalikan']);
    } catch {
      this.error.set('Tugas belum bisa dikembalikan. Coba lagi.');
    }
    this.busy.set(false);
  }
}
