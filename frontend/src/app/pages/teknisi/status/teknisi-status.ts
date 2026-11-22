import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { ALL_STATUS_LABEL, PHOTO_MAX_MB, PHOTO_TYPES } from '../../../core/reports/report.model';
import { TechService, TechStatus } from '../../../core/tech/tech.service';
import { Icon } from '../../../shared/icon/icon';
import { PageHead } from '../../../shared/page-head/page-head';

type Choice = Exclude<TechStatus, 'DIPROSES'>;
interface Form { page: string; noteLabel: string; photoLabel: string; photoRequired: boolean; hint: string }

// Teks per pilihan status, sesuai design-refrence/teknisi (update, waitform, beyondform)
const FORMS: Record<Choice, Form> = {
  SELESAI: { page: 'Pembaruan status', noteLabel: 'Catatan penanganan', photoLabel: 'Bukti penyelesaian', photoRequired: true, hint: 'Wajib melampirkan bukti dan catatan untuk menyelesaikan tugas.' },
  MENUNGGU: { page: 'Catatan menunggu', noteLabel: 'Alasan perubahan status', photoLabel: 'Foto pemeriksaan (opsional)', photoRequired: false, hint: 'Catatan alasan wajib diisi. Foto pemeriksaan bersifat opsional.' },
  TIDAK_DAPAT_DIPERBAIKI: { page: 'Tidak dapat diperbaiki', noteLabel: 'Alasan perubahan status', photoLabel: 'Bukti pemeriksaan', photoRequired: true, hint: 'Wajib melampirkan bukti dan alasan untuk menyatakan tugas tidak dapat diperbaiki.' },
};

/*
  PEMBARUAN STATUS (teknisi): pilih Selesai / Menunggu / Tidak dapat diperbaiki, isi catatan atau alasan,
  lampirkan foto (wajib untuk Selesai dan Tidak dapat diperbaiki). Simpan -> kembali ke detail tugas.
*/
@Component({
  selector: 'app-teknisi-status',
  imports: [RouterLink, Icon, PageHead],
  template: `
    <app-page-head [title]="form().page" subtitle="Kelola penanganan fasilitas di gedung tanggung jawab Anda."
      [crumbs]="[{ label: 'Portal Teknisi', link: '/teknisi' }, { label: 'Pembaruan status' }]" />

    @if (r(); as r) {
      <div class="split">
        <form class="card" (submit)="$event.preventDefault(); save()" novalidate>
          <h2 class="head">{{ r.id }} · {{ r.title }}</h2>
          <p class="sub now">Status saat ini: {{ label(r.status) }}</p>

          <div class="field" role="group" aria-labelledby="lbl-status">
            <span class="label" id="lbl-status">Status baru *</span>
            <div class="choices">
              @for (c of choices; track c.key) {
                <button type="button" class="btn" [class.btn-primary]="choice() === c.key" [attr.aria-pressed]="choice() === c.key" (click)="pick(c.key)">
                  {{ c.label }}@if (choice() === c.key) { <app-icon name="check" [size]="14" [stroke]="2.4" /> }
                </button>
              }
            </div>
          </div>

          <div class="field" [class.invalid]="submitted() && !note().trim()">
            <label for="note">{{ form().noteLabel }} *</label>
            <textarea id="note" rows="4" [value]="note()" (input)="note.set($any($event.target).value)"></textarea>
            @if (submitted() && !note().trim()) { <span class="error" role="alert">Catatan wajib diisi.</span> }
          </div>

          <div class="field" [class.invalid]="submitted() && !!photoError()">
            <span class="label">{{ form().photoLabel }}{{ form().photoRequired ? ' *' : '' }}</span>
            <div class="photo-row">
              @if (preview()) {
                <img class="thumb" [src]="preview()" alt="Pratinjau foto bukti">
              } @else {
                <div class="thumb blank">Belum ada foto</div>
              }
              <div class="info">
                @if (file(); as f) {
                  <strong>{{ f.name }}</strong>
                  <span class="sub">{{ size(f) }} · {{ f.type === 'image/png' ? 'PNG' : 'JPG' }}</span>
                }
                <div class="btns">
                  <label class="btn" for="proof">Pilih foto</label>
                  <button class="btn" type="button" (click)="useSample()">Gunakan foto contoh</button>
                </div>
                <input id="proof" class="sr-only" type="file" accept="image/jpeg,image/png" (change)="onFile($any($event.target).files?.[0] ?? null)">
              </div>
            </div>
            @if (photoError()) { <span class="error" role="alert">{{ photoError() }}</span> }
          </div>

          <p class="sub hint">{{ form().hint }}</p>
          @if (error()) { <p class="error" role="alert">{{ error() }}</p> }

          <div class="foot">
            <a class="btn" [routerLink]="['/teknisi/tugas', r.id]">Batal</a>
            <button class="btn btn-primary" type="submit" [disabled]="busy()">Simpan pembaruan</button>
          </div>
        </form>

        <aside class="card legend">
          <h2>Status yang jelas</h2>
          <dl>
            <div><dt>Diproses</dt><dd>Perbaikan sedang dikerjakan.</dd></div>
            <div><dt>Menunggu</dt><dd>Tertunda karena komponen atau akses.</dd></div>
            <div><dt>Selesai</dt><dd>Sudah diuji dan disertai bukti.</dd></div>
          </dl>
        </aside>
      </div>
    } @else {
      <p class="empty">Tugas tidak ditemukan.</p>
    }
  `,
  styles: `
    form.card { display: flex; flex-direction: column; gap: 24px; }
    .head { font-size: 20px; font-weight: 600; }
    .now { margin-top: -14px; }
    .choices { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 4px; }
    .choices .btn { gap: 6px; }
    textarea { min-height: 100px; }
    .photo-row { display: flex; gap: 24px; align-items: center; margin-top: 4px; }
    .thumb { width: 250px; height: 150px; border-radius: 12px; object-fit: cover; flex: none; }
    .thumb.blank { display: grid; place-items: center; border: 1px dashed var(--line); color: var(--muted); font-size: 13px; }
    .info { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
    .info strong { font-size: 14px; word-break: break-all; }
    .btns { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 12px; }
    .btns .btn { cursor: pointer; }
    .hint { margin-top: -4px; }
    .foot { display: flex; justify-content: space-between; gap: 16px; margin-top: 8px; }
    .foot .btn-primary { min-width: 228px; }
    .legend dl { display: flex; flex-direction: column; gap: 16px; margin-top: 24px; }
    .legend dt { color: var(--muted); font-size: 14px; }
    .legend dd { color: var(--muted); font-size: 14px; }
    @media (max-width: 800px) {
      .choices { grid-template-columns: 1fr; gap: 12px; }
      .photo-row { flex-direction: column; align-items: stretch; gap: 16px; }
      .thumb { width: 100%; height: auto; aspect-ratio: 5 / 3; }
      .foot { flex-direction: column-reverse; }
      .foot .btn-primary { min-width: 0; }
      .legend { display: none; }
    }
  `,
})
export class TeknisiStatus {
  private tech = inject(TechService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private id = toSignal(this.route.paramMap.pipe(map((p) => p.get('id') ?? '')), { initialValue: '' });

  r = computed(() => this.tech.find(this.id()));
  choices: { key: Choice; label: string }[] = [
    { key: 'SELESAI', label: 'Selesai' },
    { key: 'MENUNGGU', label: 'Menunggu' },
    { key: 'TIDAK_DAPAT_DIPERBAIKI', label: 'Tidak dapat diperbaiki' },
  ];
  choice = signal<Choice>('SELESAI');
  form = computed(() => FORMS[this.choice()]);
  label = (s: string) => ALL_STATUS_LABEL[s] ?? s;

  note = signal('');
  file = signal<File | null>(null);
  preview = signal('');
  submitted = signal(false);
  busy = signal(false);
  error = signal('');

  photoError = computed(() => {
    const f = this.file();
    if (!f) return this.form().photoRequired ? 'Foto bukti wajib dilampirkan.' : '';
    if (!PHOTO_TYPES.includes(f.type)) return 'Foto harus berformat JPG atau PNG.';
    if (f.size > PHOTO_MAX_MB * 1024 * 1024) return `Ukuran foto maksimal ${PHOTO_MAX_MB} MB.`;
    return '';
  });

  pick(c: Choice): void { this.choice.set(c); this.submitted.set(false); }
  size = (f: File) => (f.size / 1024 / 1024).toFixed(1).replace('.', ',') + ' MB';

  onFile(f: File | null): void {
    this.file.set(f);
    this.preview.set(f ? URL.createObjectURL(f) : '');
  }

  // Foto contoh untuk prototipe: memakai berkas di /samples
  async useSample(): Promise<void> {
    try {
      const blob = await (await fetch('/samples/ac-ruang-312.jpg')).blob();
      this.onFile(new File([blob], 'bukti-perbaikan.jpg', { type: 'image/jpeg' }));
    } catch {
      this.error.set('Foto contoh tidak dapat dimuat.');
    }
  }

  async save(): Promise<void> {
    this.submitted.set(true);
    this.error.set('');
    if (!this.note().trim() || this.photoError()) return;
    const r = this.r()!;
    this.busy.set(true);
    try {
      await this.tech.setStatus(r.uuid, r.id, this.choice(), { proof: this.file(), note: this.note().trim() });
      this.router.navigate(['/teknisi/tugas', r.id]);
    } catch {
      this.error.set('Status belum bisa diubah. Coba lagi.');
    }
    this.busy.set(false);
  }
}
