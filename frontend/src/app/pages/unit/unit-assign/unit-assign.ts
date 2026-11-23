import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { AdminService, Technician } from '../../../core/admin/admin.service';
import { errorMessage } from '../../../core/http/api-error';
import { PageHead } from '../../../shared/page-head/page-head';
import { ResultDialog, ResultRow } from '../../../shared/result-dialog/result-dialog';

// TUGASKAN TEKNISI: GET /reports/technicians?building_uuid= (teknisi di gedung laporan),
// lalu POST /reports/assign. Kolom catatan di desain tidak punya kolom di API, jadi tidak dikirim.
@Component({
  selector: 'app-unit-assign',
  imports: [RouterLink, PageHead, ResultDialog],
  template: `
    <app-page-head title="Tugaskan teknisi" subtitle="Prioritaskan laporan dan koordinasikan penanganan fasilitas."
      [crumbs]="[{ label: 'Portal Admin Unit', link: '/unit' }, { label: 'Tugaskan teknisi' }]" />

    @if (r(); as r) {
      <div class="split">
        <form class="card form-card" style="max-width: none" (submit)="$event.preventDefault(); confirm()" novalidate>
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
      <p class="empty">{{ admin.reportsLoaded() ? 'Laporan tidak ditemukan.' : 'Memuat laporan…' }}</p>
    }

    @if (result(); as res) {
      <app-result-dialog [ok]="res.ok" [title]="res.ok ? 'Teknisi berhasil ditugaskan' : 'Teknisi gagal ditugaskan'"
        [message]="res.message" [rows]="rows()" [code]="res.code" [codeText]="res.ok ? 'OK' : 'Gagal'"
        [okLabel]="res.ok ? 'Lihat detail laporan' : 'Tutup'" (closed)="closeResult()" />
    }
  `,
})
export class UnitAssign {
  admin = inject(AdminService);
  private router = inject(Router);
  private id = toSignal(inject(ActivatedRoute).paramMap.pipe(map((p) => p.get('id') ?? '')), { initialValue: '' });

  r = computed(() => this.admin.find(this.id()));
  techs = signal<Technician[]>([]);
  pick = signal('');
  loading = signal(true);
  busy = signal(false);
  error = signal('');

  constructor() {
    // Muat teknisi setelah laporan tersedia. Kalau halaman dibuka sebelum daftar laporan selesai dimuat
    // (mis. langsung setelah login), gedung laporan belum diketahui dan daftar teknisi akan salah / tidak terfilter.
    effect(() => {
      const r = this.r();
      if (!r) return;
      untracked(() => {
        this.loading.set(true);
        this.techs.set([]);
        this.admin.technicians(r.buildingUuid)
          .then((t) => { this.techs.set(t); const cur = t.find((x) => x.uuid === r.technicianUuid); if (cur) this.pick.set(cur.uuid); })
          .catch(() => this.error.set('Daftar teknisi belum bisa dimuat.'))
          .finally(() => this.loading.set(false));
      });
    });
  }

  // Hasil penugasan, ditampilkan sebagai kartu pop-up (berhasil atau gagal, lengkap dengan kode dari backend)
  result = signal<{ ok: boolean; code: number; message: string; tech: string } | null>(null);

  rows = computed<ResultRow[]>(() => {
    const r = this.r();
    const res = this.result();
    return r && res ? [{ label: 'Laporan', value: r.id }, { label: 'Teknisi', value: res.tech }, { label: 'Gedung', value: r.building }] : [];
  });

  async confirm(): Promise<void> {
    if (!this.pick() || this.busy()) return;
    this.busy.set(true);
    this.error.set('');
    const tech = this.techs().find((t) => t.uuid === this.pick())?.name ?? '';
    try {
      const res = await this.admin.assign(this.r()!.uuid, this.pick());
      this.result.set({ ok: true, code: res.status, message: res.message || 'Teknisi berhasil ditugaskan untuk laporan ini.', tech });
    } catch (err) {
      const code = err instanceof HttpErrorResponse ? err.status : 0;
      const message = code === 401 || code === 403
        ? 'Penugasan ditolak server. Pastikan akun Admin Unit Anda punya akses ke gedung laporan ini.'
        : errorMessage(err, 'Penugasan belum tersimpan. Coba lagi.');
      this.result.set({ ok: false, code, message, tech });
    }
    this.busy.set(false);
  }

  // Tutup kartu: kalau berhasil, kembali ke detail laporan; kalau gagal, tetap di halaman untuk mencoba lagi
  closeResult(): void {
    const ok = this.result()?.ok;
    this.result.set(null);
    if (ok) this.router.navigate(['/unit/laporan', this.id()], { queryParams: { tersimpan: 1 } });
  }
}
