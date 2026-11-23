import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, input, output, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { errorMessage } from '../../../core/http/api-error';
import { Report } from '../../../core/reports/report.model';
import { ReportService } from '../../../core/reports/report.service';
import { Dialog } from '../../../shared/dialog/dialog';

// Isian yang hanya berisi spasi dianggap kosong
const notBlank = (c: AbstractControl): ValidationErrors | null => (String(c.value ?? '').trim() ? null : { blank: true });

const LIMIT = { title: 100, room: 60, description: 1000 };

/*
  POP-UP EDIT LAPORAN
  Mengubah nama kerusakan, gedung, lantai, detail lokasi, dan deskripsi. Nomor tiket dan foto tetap.
  Validasi per kondisi: kolom kosong / hanya spasi, terlalu panjang, belum ada yang berubah, dan gagal dari server.
  Pop-up tetap terbuka saat gagal supaya isian tidak hilang.
*/
@Component({
  selector: 'app-edit-report-dialog',
  imports: [ReactiveFormsModule, Dialog],
  template: `
    <app-dialog title="Edit laporan" confirmLabel="Simpan perubahan" busyLabel="Menyimpan…"
      [busy]="busy()" [error]="serverError()" (confirm)="save()" (cancel)="closed.emit()">
      <form class="form" [formGroup]="form" (ngSubmit)="save()" novalidate>
        <p class="sub">{{ report().id }} · nomor tiket dan foto tidak berubah. Kolom bertanda * wajib diisi.</p>

        <div class="field" [class.invalid]="invalid('title')">
          <label for="e-title">Nama kerusakan *</label>
          <input id="e-title" formControlName="title" [attr.aria-invalid]="invalid('title')">
          @if (invalid('title')) { <span class="error">{{ message('title', 'Nama kerusakan') }}</span> }
        </div>

        <div class="row">
          <div class="field" [class.invalid]="invalid('building')">
            <label for="e-building">Gedung *</label>
            <select id="e-building" formControlName="building" [attr.aria-invalid]="invalid('building')">
              <option value="">Pilih gedung</option>
              @for (b of service.buildings(); track b) { <option [value]="b">{{ b }}</option> }
            </select>
            @if (invalid('building')) { <span class="error">Pilih gedung terlebih dahulu.</span> }
          </div>
          <div class="field">
            <label for="e-floor">Lantai (opsional)</label>
            <select id="e-floor" formControlName="floor">
              <option value="">Pilih lantai</option>
              @for (f of service.floors; track f) { <option [value]="f">{{ f }}</option> }
            </select>
          </div>
        </div>

        <div class="field" [class.invalid]="invalid('room')">
          <label for="e-room">Detail lokasi *</label>
          <input id="e-room" formControlName="room" [attr.aria-invalid]="invalid('room')">
          @if (invalid('room')) { <span class="error">{{ message('room', 'Detail lokasi') }}</span> }
        </div>

        <div class="field" [class.invalid]="invalid('description')">
          <label for="e-desc">Deskripsi kerusakan *</label>
          <textarea id="e-desc" formControlName="description" [attr.aria-invalid]="invalid('description')"></textarea>
          @if (invalid('description')) { <span class="error">{{ message('description', 'Deskripsi') }}</span> }
        </div>

        @if (unchanged()) { <p class="error" role="alert">Belum ada perubahan untuk disimpan.</p> }
      </form>
    </app-dialog>
  `,
  styles: `
    .form { display: flex; flex-direction: column; gap: 16px; }
    .row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .sub { color: var(--muted); font-size: 12px; }
    .error { color: var(--red); font-size: 12px; }
    @media (max-width: 800px) { .row { grid-template-columns: 1fr; } }
  `,
})
export class EditReportDialog {
  service = inject(ReportService);
  report = input.required<Report>();
  saved = output<void>();
  closed = output<void>();

  busy = signal(false);
  serverError = signal('');
  unchanged = signal(false);
  private submitted = signal(false);

  form = inject(FormBuilder).nonNullable.group({
    title: ['', [Validators.required, notBlank, Validators.maxLength(LIMIT.title)]],
    building: ['', Validators.required],
    floor: [''],
    room: ['', [Validators.required, notBlank, Validators.maxLength(LIMIT.room)]],
    description: ['', [Validators.required, notBlank, Validators.maxLength(LIMIT.description)]],
  });

  constructor() {
    queueMicrotask(() => {
      const r = this.report();
      this.form.setValue({ title: r.title, building: r.building, floor: r.floor ?? '', room: r.room, description: r.description });
    });
    this.form.valueChanges.subscribe(() => { this.unchanged.set(false); this.serverError.set(''); });
  }

  invalid(name: 'title' | 'building' | 'room' | 'description'): boolean {
    const c = this.form.controls[name];
    return c.invalid && (c.touched || this.submitted());
  }

  // Pesan sesuai kondisi kesalahan: kosong, hanya spasi, atau terlalu panjang
  message(name: 'title' | 'room' | 'description', label: string): string {
    const e = this.form.controls[name].errors;
    if (e?.['maxlength']) return `${label} maksimal ${LIMIT[name]} karakter.`;
    if (e?.['blank']) return `${label} tidak boleh hanya berisi spasi.`;
    return `${label} wajib diisi.`;
  }

  async save(): Promise<void> {
    if (this.busy()) return;
    this.submitted.set(true);
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const v = this.form.getRawValue();
    const r = this.report();
    const same = v.title.trim() === r.title && v.building === r.building && v.floor === (r.floor ?? '')
      && v.room.trim() === r.room && v.description.trim() === r.description;
    if (same) { this.unchanged.set(true); return; }

    this.busy.set(true);
    this.serverError.set('');
    try {
      await this.service.update(r, v);
      this.saved.emit();
    } catch (err) {
      const fallback = 'Perubahan belum tersimpan. Periksa koneksi Anda lalu coba lagi.';
      this.serverError.set(err instanceof Error && !(err instanceof HttpErrorResponse) ? err.message : errorMessage(err, fallback));
    } finally {
      this.busy.set(false);
    }
  }
}
