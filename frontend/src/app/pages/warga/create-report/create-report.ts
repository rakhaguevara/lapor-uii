import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { errorMessage } from '../../../core/http/api-error';
import { PHOTO_MAX_MB, PHOTO_TYPES, SAMPLE_REPORT } from '../../../core/reports/report.model';
import { ReportService } from '../../../core/reports/report.service';
import { Icon } from '../../../shared/icon/icon';
import { PageHead } from '../../../shared/page-head/page-head';

/*
  FORM BUAT LAPORAN
  Satu halaman (jauh di bawah batas 3 langkah). Memakai Reactive Forms:
  aturan isian ditulis di kode (Validators), bukan di HTML.
  Foto dipegang terpisah karena berupa file, bukan teks.
  Judul halaman mengikuti kondisi form (sesuai desain): "Buat laporan" -> "Validasi laporan"
  jika Kirim ditekan padahal belum lengkap -> "Laporan siap dikirim" jika sudah lengkap.
*/
@Component({
  selector: 'app-create-report',
  imports: [ReactiveFormsModule, Icon, PageHead],
  template: `
    <app-page-head
      [title]="heading()"
      subtitle="Ceritakan kerusakan yang Anda temukan. Kolom bertanda * wajib diisi."
      [crumbs]="[{ label: 'Portal Pelapor' }, { label: heading() }]" />

    @if (showSummary()) {
      <p class="alert m-only" role="alert">
        <strong>Periksa kembali laporan Anda</strong>
        Lengkapi semua kolom wajib dan unggah minimal satu foto.
      </p>
    }

    <div class="layout">
      <!-- novalidate: validasi kita atur sendiri agar pesannya berbahasa Indonesia -->
      <form class="card" [formGroup]="form" (ngSubmit)="send()" novalidate>
        <h2>Informasi kerusakan</h2>
        <p class="sub intro">Lokasi yang jelas membantu teknisi menemukan kerusakan.</p>

        <div class="grid">
          <!-- Pola tiap kolom: label + input + pesan error (tampil jika kolom salah) -->
          <div class="field full" [class.invalid]="invalid('title')">
            <label for="title">Nama kerusakan *</label>
            <input id="title" formControlName="title" placeholder="Contoh: AC tidak dingin" [attr.aria-invalid]="invalid('title')">
            @if (invalid('title')) { <span class="error">Nama kerusakan wajib diisi.</span> }
          </div>

          <div class="field" [class.invalid]="invalid('building')">
            <label for="building">Gedung *</label>
            <select id="building" formControlName="building" [class.empty]="!form.controls.building.value" [attr.aria-invalid]="invalid('building')">
              <option value="">Pilih gedung</option>
              @for (b of service.buildings(); track b) { <option [value]="b">{{ b }}</option> }
            </select>
            @if (invalid('building')) { <span class="error">Pilih gedung terlebih dahulu.</span> }
          </div>

          <div class="field">
            <label for="floor">Lantai (opsional)</label>
            <select id="floor" formControlName="floor" [class.empty]="!form.controls.floor.value">
              <option value="">Pilih lantai</option>
              @for (f of service.floors; track f) { <option [value]="f">{{ f }}</option> }
            </select>
          </div>

          <div class="field half" [class.invalid]="invalid('room')">
            <label for="room">Detail Lokasi *</label>
            <input id="room" formControlName="room" placeholder="Contoh: Ruang 3.12" [attr.aria-invalid]="invalid('room')">
            @if (invalid('room')) { <span class="error">Detail lokasi wajib diisi.</span> }
          </div>

          <!-- Unggah foto: input file disembunyikan secara visual, label jadi area klik -->
          <div class="field full" [class.invalid]="submitted() && !photoUrl()">
            <span class="label">Foto kerusakan *</span>
            @if (photoUrl()) {
              <div class="preview">
                <button class="thumb" type="button" (click)="openPreview()" aria-label="Perbesar foto kerusakan">
                  <img [src]="photoUrl()" alt="Pratinjau foto kerusakan">
                </button>
                <div class="meta">
                  <strong>{{ photoName() }}</strong>
                  <span>{{ photoSize() }} · Klik foto untuk memperbesar</span>
                </div>
                <label class="btn change">
                  <input class="sr-only" type="file" accept="image/jpeg,image/png" (change)="pickPhoto($event)">
                  Ganti foto
                </label>
              </div>
            } @else {
              <label class="upload">
                <input class="sr-only" type="file" accept="image/jpeg,image/png" (change)="pickPhoto($event)">
                <strong><app-icon name="upload" [size]="16" [stroke]="2.2" /> Klik untuk unggah foto</strong>
                <small>JPG / PNG · Maks. {{ maxMb }} MB</small>
              </label>
            }
            @if (photoError()) { <span class="error" role="alert">{{ photoError() }}</span> }
          </div>

          <div class="field full" [class.invalid]="invalid('description')">
            <label for="description">Deskripsi kerusakan *</label>
            <textarea id="description" formControlName="description" placeholder="Jelaskan kondisi, waktu kejadian, dan dampaknya…" [attr.aria-invalid]="invalid('description')"></textarea>
            @if (invalid('description')) { <span class="error">Deskripsi wajib diisi.</span> }
          </div>
        </div>

        @if (showSummary()) {
          <p class="error summary d-only" role="alert">Lengkapi semua kolom wajib dan unggah minimal satu foto.</p>
        }
        @if (sendError()) {
          <p class="error summary" role="alert">{{ sendError() }}</p>
        }

        <div class="actions">
          <button class="btn" type="button" (click)="cancel()">Batal</button>
          <button class="btn btn-primary" type="submit" [disabled]="busy()">
            {{ busy() ? 'Mengirim…' : 'Kirim laporan' }} <app-icon name="right" [size]="16" [stroke]="2.2" />
          </button>
        </div>
      </form>

      <aside class="side">
        <section class="card tips d-only">
          <h2>Laporan yang baik, penanganan lebih cepat.</h2>
          <ol>
            <li>
              <b>01</b>
              <div><strong>Pastikan lokasi tepat</strong><p>Pilih gedung dan lantai, lalu tulis ruangan atau titiknya agar teknisi langsung menemukan tempatnya.</p></div>
            </li>
            <li>
              <b>02</b>
              <div><strong>Ambil foto yang jelas</strong><p>Foto bagian yang rusak dari dekat dengan cahaya cukup, supaya tingkat kerusakannya bisa dinilai tanpa survei ulang.</p></div>
            </li>
            <li>
              <b>03</b>
              <div><strong>Jelaskan kondisi kerusakan</strong><p>Ceritakan apa yang terjadi, sejak kapan, dan apakah membahayakan, supaya penanganannya bisa diprioritaskan.</p></div>
            </li>
          </ol>
        </section>
        <section class="card safe d-only">
          <h2>Identitas Anda aman</h2>
          <p class="sub">Nama dan kontak hanya dapat dilihat oleh petugas yang berwenang.</p>
        </section>
        <!-- Khusus prototipe: mengisi kolom dengan contoh, termasuk foto contoh -->
        <div class="sample">
          <button class="btn" type="button" (click)="fillSample()">Isi contoh laporan</button>
          <p class="sub">Mode prototipe: gunakan data dan foto contoh untuk mencoba pengisian.</p>
        </div>
      </aside>
    </div>
  `,
  styles: `
    .layout { display: grid; grid-template-columns: 1fr 367px; gap: 24px; align-items: start; }
    .intro { margin: 4px 0 20px; font-size: 12px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .full { grid-column: 1 / -1; }
    .half { grid-column: 1 / 2; }
    .label { font-size: 12px; font-weight: 500; }

    .upload { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; min-height: 104px; padding: 16px; border: 1px solid var(--line); border-radius: var(--r-ctl); background: var(--bg); cursor: pointer; }
    .upload strong { display: inline-flex; align-items: center; gap: 8px; color: var(--blue-600); font-size: 14px; font-weight: 600; }
    .upload small { color: var(--muted); font-size: 12px; }
    .upload:focus-within { outline: 3px solid #8ab8f5; outline-offset: 2px; }
    .field.invalid .upload { border-color: var(--red); }

    .preview { display: flex; align-items: center; gap: 16px; min-height: 103px; padding: 9px 12px 9px 12px; border: 1px solid var(--line); border-radius: var(--r-ctl); background: var(--bg); }
    .thumb { flex: none; width: 116px; height: 82px; padding: 0; border: 0; border-radius: 8px; overflow: hidden; cursor: zoom-in; background: var(--line); }
    .thumb img { width: 100%; height: 100%; object-fit: cover; }
    .meta { display: flex; flex-direction: column; min-width: 0; flex: 1; }
    .meta strong { font-size: 13px; font-weight: 600; overflow-wrap: anywhere; }
    .meta span { color: var(--muted); font-size: 12px; }
    .change { position: relative; min-height: 44px; }
    .change:focus-within { outline: 3px solid #8ab8f5; outline-offset: 2px; }

    .summary { margin-top: 20px; font-size: 12px; }
    .alert { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; padding: 16px; border-radius: var(--r-card); background: var(--red-bg); color: var(--red); font-size: 12.5px; }
    .alert strong { font-size: 14px; font-weight: 600; }
    .error { color: var(--red); }
    .actions { display: flex; justify-content: space-between; margin-top: 32px; }
    .actions .btn { padding: 0 36px; }
    .actions .btn-primary { min-width: 196px; }

    .side { display: flex; flex-direction: column; gap: 24px; }
    .tips { padding: 24px; }
    .tips h2 { font-size: 21px; font-weight: 700; line-height: 30px; }
    .tips ol { display: grid; gap: 24px; margin-top: 24px; }
    .tips li { display: flex; gap: 20px; font-size: 13px; }
    .tips b { color: var(--blue-600); font-weight: 700; min-width: 20px; }
    .tips strong { display: block; font-weight: 600; font-size: 13px; }
    .tips p { margin-top: 4px; color: var(--muted); font-size: 12px; line-height: 1.5; }
    .safe { min-height: 167px; }
    .safe h2 { font-size: 16px; }
    .safe .sub { margin-top: 20px; font-size: 13px; }
    .sample { display: flex; flex-direction: column; gap: 12px; padding: 0 20px; }
    .sample .sub { padding-left: 3px; font-size: 12px; }
    .sample .btn { width: 100%; }

    @media (max-width: 800px) {
      .layout { grid-template-columns: 1fr; gap: 16px; }
      .side { order: -1; gap: 12px; }
      .sample .btn { color: var(--blue-600); }
      .sample .sub { padding-left: 4px; font-size: 11.5px; }
      .sample { padding: 0; }
      .intro { margin-bottom: 20px; font-size: 11px; }
      .upload strong { font-size: 13px; }
      .meta strong { font-size: 12.5px; }
      .grid { grid-template-columns: 1fr; gap: 20px; }
      .half { grid-column: 1; }
      .preview { flex-wrap: wrap; }
      .change { width: 100%; }
      .actions { flex-direction: column-reverse; gap: 12px; }
      .actions .btn { width: 100%; }
    }
  `,
})
export class CreateReport {
  service = inject(ReportService);
  private router = inject(Router);
  maxMb = PHOTO_MAX_MB;

  // Aturan isian: Validators.required = wajib diisi
  form = inject(FormBuilder).nonNullable.group({
    title: ['', Validators.required],
    building: ['', Validators.required],
    floor: [''],
    room: ['', Validators.required],
    description: ['', Validators.required],
  });

  // Data foto (dipisah dari form)
  photoFile: File | null = null; // file asli yang dikirim ke backend
  photoUrl = signal('');         // alamat sementara untuk pratinjau
  photoName = signal('');
  photoSize = signal('');
  photoError = signal('');
  // Menjadi true setelah tombol Kirim ditekan; baru saat itu semua error ditampilkan
  submitted = signal(false);
  busy = signal(false);
  sendError = signal('');
  // true jika semua kolom wajib dan foto sudah terisi
  ready = signal(false);

  heading = () => (this.ready() ? 'Laporan siap dikirim' : this.submitted() ? 'Validasi laporan' : 'Buat laporan');
  showSummary = () => this.submitted() && !this.ready();

  constructor() {
    // Kembalikan isi form jika pelapor baru saja melihat preview foto
    const draft = this.service.draft();
    if (draft) {
      const { photo, photoUrl, ...values } = draft;
      this.form.patchValue(values);
      this.photoFile = photo;
      this.photoUrl.set(photoUrl);
      this.photoName.set(photo?.name ?? '');
      this.photoSize.set(photo ? this.sizeText(photo.size) : '');
      this.service.draft.set(null);
    }
    this.refresh();
    this.form.valueChanges.pipe(takeUntilDestroyed(inject(DestroyRef))).subscribe(() => this.refresh());
  }

  private refresh(): void {
    this.ready.set(this.form.valid && !!this.photoFile);
  }

  private sizeText(bytes: number): string {
    return (bytes / 1024 / 1024).toFixed(1).replace('.', ',') + ' MB';
  }

  // Apakah kolom `name` salah DAN perlu menampilkan error?
  // Error muncul jika pengguna sudah menyentuh kolom itu atau sudah menekan Kirim.
  invalid(name: 'title' | 'building' | 'room' | 'description'): boolean {
    const control = this.form.controls[name];
    return control.invalid && (control.touched || this.submitted());
  }

  private setPhoto(file: File): void {
    if (this.photoUrl()) URL.revokeObjectURL(this.photoUrl());
    this.photoError.set('');
    this.photoFile = file;
    this.photoUrl.set(URL.createObjectURL(file)); // alamat sementara agar foto bisa ditampilkan
    this.photoName.set(file.name);                // hanya ditampilkan sebagai teks
    this.photoSize.set(this.sizeText(file.size));
    this.refresh();
  }

  // Dipanggil saat pengguna memilih file. Cek tipe dan ukuran dulu.
  pickPhoto(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!PHOTO_TYPES.includes(file.type)) {
      this.photoError.set('Format foto harus JPG atau PNG.');
    } else if (file.size > PHOTO_MAX_MB * 1024 * 1024) {
      this.photoError.set(`Ukuran foto maksimal ${PHOTO_MAX_MB} MB.`);
    } else {
      this.setPhoto(file);
    }
    input.value = ''; // supaya file yang sama bisa dipilih ulang
  }

  // Simpan isi form sebagai draft, lalu buka halaman preview foto
  openPreview(): void {
    this.service.draft.set({ ...this.form.getRawValue(), photo: this.photoFile, photoUrl: this.photoUrl() });
    this.router.navigate(['/laporan/baru/foto']);
  }

  // Mode prototipe: isi kolom teks dan foto dari data contoh
  async fillSample(): Promise<void> {
    this.form.patchValue({
      title: SAMPLE_REPORT.title,
      building: this.service.buildings()[0] ?? '',
      floor: SAMPLE_REPORT.floor,
      room: SAMPLE_REPORT.room,
      description: SAMPLE_REPORT.description,
    });
    try {
      const blob = await (await fetch(SAMPLE_REPORT.photoUrl)).blob();
      this.setPhoto(new File([blob], SAMPLE_REPORT.photoName, { type: blob.type || 'image/jpeg' }));
    } catch {
      this.photoError.set('Foto contoh gagal dimuat. Pilih foto sendiri.');
    }
  }

  async send(): Promise<void> {
    this.submitted.set(true);
    this.sendError.set('');
    // Jika ada yang kurang, berhenti di sini. Isi form tetap utuh.
    if (this.form.invalid || !this.photoFile || this.busy()) {
      this.form.markAllAsTouched();
      return;
    }

    this.busy.set(true);
    try {
      const report = await this.service.add({ ...this.form.getRawValue(), photoUrl: '' }, this.photoFile);
      this.router.navigate(['/laporan', report.id, 'terkirim']);
    } catch (err) {
      // Isi form tetap utuh supaya pelapor tinggal mencoba lagi
      const fallback = 'Laporan belum terkirim. Periksa koneksi Anda lalu coba kirim lagi.';
      this.sendError.set(err instanceof Error && !(err instanceof HttpErrorResponse) ? err.message : errorMessage(err, fallback));
    } finally {
      this.busy.set(false);
    }
  }

  cancel(): void {
    this.service.draft.set(null);
    this.router.navigate(['/beranda']);
  }
}
