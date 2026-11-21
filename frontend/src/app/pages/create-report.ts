import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { PHOTO_MAX_MB, PHOTO_TYPES } from '../core/report.model';
import { ReportService } from '../core/report.service';

/*
  FORM BUAT LAPORAN
  Satu halaman (jauh di bawah batas 3 langkah). Memakai Reactive Forms:
  aturan isian ditulis di kode (Validators), bukan di HTML.
  Foto dipegang terpisah (signal) karena berupa file, bukan teks.
*/
@Component({
  selector: 'app-create-report',
  imports: [ReactiveFormsModule],
  template: `
    <div class="page-head">
      <h1>Buat laporan</h1>
      <p>Ceritakan kerusakan yang Anda temukan. Kolom bertanda * wajib diisi.</p>
    </div>

    <div class="layout">
      <!-- novalidate: validasi kita atur sendiri agar pesannya berbahasa Indonesia -->
      <form class="card" [formGroup]="form" (ngSubmit)="send()" novalidate>
        <h2>Informasi kerusakan</h2>
        <p class="sub">Lokasi yang jelas membantu teknisi menemukan kerusakan.</p>

        <div class="grid">
          <!-- Pola tiap kolom: label + input + pesan error (tampil jika kolom salah) -->
          <div class="field full" [class.invalid]="invalid('title')">
            <label for="title">Nama kerusakan *</label>
            <input id="title" formControlName="title" placeholder="Contoh: AC tidak dingin" [attr.aria-invalid]="invalid('title')">
            @if (invalid('title')) { <span class="error">Nama kerusakan wajib diisi.</span> }
          </div>

          <div class="field" [class.invalid]="invalid('building')">
            <label for="building">Gedung *</label>
            <select id="building" formControlName="building">
              <option value="">Pilih gedung</option>
              @for (b of service.buildings(); track b) { <option [value]="b">{{ b }}</option> }
            </select>
            @if (invalid('building')) { <span class="error">Pilih gedung.</span> }
          </div>

          <div class="field">
            <label for="floor">Lantai (opsional)</label>
            <select id="floor" formControlName="floor">
              <option value="">Pilih lantai</option>
              @for (f of service.floors; track f) { <option [value]="f">{{ f }}</option> }
            </select>
          </div>

          <div class="field" [class.invalid]="invalid('room')">
            <label for="room">Ruangan *</label>
            <input id="room" formControlName="room" placeholder="Contoh: Ruang 3.12">
            @if (invalid('room')) { <span class="error">Ruangan wajib diisi.</span> }
          </div>

          <div class="field" [class.invalid]="invalid('category')">
            <label for="category">Kategori *</label>
            <select id="category" formControlName="category">
              <option value="">Pilih kategori</option>
              @for (c of service.categories(); track c) { <option [value]="c">{{ c }}</option> }
            </select>
            @if (invalid('category')) { <span class="error">Pilih kategori.</span> }
          </div>

          <!-- Unggah foto: input file disembunyikan secara visual, label jadi area klik -->
          <div class="field full" [class.invalid]="submitted() && !photoUrl()">
            <span class="label">Foto kerusakan *</span>
            @if (photoUrl()) {
              <div class="preview">
                <img [src]="photoUrl()" alt="Pratinjau foto kerusakan">
                <div>
                  <strong>{{ photoName() }}</strong>
                  <p>{{ photoSize() }}</p>
                  <button class="btn" type="button" (click)="removePhoto()">Hapus foto</button>
                </div>
              </div>
            } @else {
              <label class="upload">
                <input class="sr-only" type="file" accept="image/jpeg,image/png" (change)="pickPhoto($event)">
                <strong>↑ Klik untuk unggah foto</strong>
                <small>JPG / PNG · Maks. {{ maxMb }} MB</small>
              </label>
            }
            @if (photoError()) { <span class="error" role="alert">{{ photoError() }}</span> }
          </div>

          <div class="field full" [class.invalid]="invalid('description')">
            <label for="description">Deskripsi kerusakan *</label>
            <textarea id="description" formControlName="description" placeholder="Jelaskan kondisi, waktu kejadian, dan dampaknya…"></textarea>
            @if (invalid('description')) { <span class="error">Deskripsi wajib diisi.</span> }
          </div>
        </div>

        @if (submitted() && (form.invalid || !photoUrl())) {
          <p class="error summary" role="alert">Lengkapi semua kolom wajib dan unggah minimal satu foto.</p>
        }

        <div class="actions">
          <button class="btn" type="button" (click)="cancel()">Batal</button>
          <button class="btn btn-primary" type="submit">Kirim laporan →</button>
        </div>
      </form>

      <aside class="side">
        <div class="card">
          <h2>Laporan yang baik, penanganan lebih cepat.</h2>
          <ol>
            <li><b>01</b> Pastikan lokasi tepat</li>
            <li><b>02</b> Ambil foto yang jelas</li>
            <li><b>03</b> Jelaskan kondisi kerusakan</li>
          </ol>
        </div>
        <div class="card">
          <h2>Identitas Anda aman</h2>
          <p class="sub">Nama dan kontak hanya dapat dilihat oleh petugas yang berwenang.</p>
        </div>
        <!-- Khusus prototipe: mengisi kolom teks dengan contoh. Foto tetap dipilih manual. -->
        <button class="btn" type="button" (click)="fillSample()">Isi contoh laporan</button>
        <p class="sub">Mode prototipe: gunakan data contoh untuk mencoba pengisian dan unggah foto.</p>
      </aside>
    </div>
  `,
  styles: `
    .layout { display: grid; grid-template-columns: 1fr 340px; gap: 24px; align-items: start; }
    h2 { font-size: 20px; }
    .sub { color: var(--muted); font-size: 14px; margin: 4px 0 16px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .full { grid-column: 1 / -1; }
    .label { font-weight: 600; font-size: 14px; }

    .upload { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 32px 16px; border: 1px dashed #b9c4d6; border-radius: 8px; background: var(--bg); cursor: pointer; }
    .upload strong { color: var(--blue-600); }
    .upload small { color: var(--muted); }
    .upload:focus-within { outline: 3px solid #8ab8f5; }
    .field.invalid .upload { border-color: var(--danger); }
    .sr-only { position: absolute; width: 1px; height: 1px; opacity: 0; overflow: hidden; }

    .preview { display: flex; gap: 16px; align-items: center; padding: 12px; border: 1px solid var(--line); border-radius: 8px; }
    .preview img { width: 120px; height: 90px; object-fit: cover; border-radius: 8px; }
    .preview p { color: var(--muted); font-size: 13px; margin-bottom: 8px; }

    .summary { margin-top: 16px; color: var(--danger); font-size: 14px; }
    .actions { display: flex; justify-content: space-between; margin-top: 24px; }

    .side { display: flex; flex-direction: column; gap: 16px; }
    .side ol { list-style: none; padding: 0; margin: 16px 0 0; display: grid; gap: 12px; }
    .side b { color: var(--blue-600); margin-right: 12px; }

    @media (max-width: 800px) {
      .layout { grid-template-columns: 1fr; }
      .grid { grid-template-columns: 1fr; }
      .side { order: -1; }                   /* di HP, tombol contoh ada di atas form */
      .side .card { display: none; }
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
    category: ['', Validators.required],
    description: ['', Validators.required],
  });

  // Data foto (dipisah dari form)
  photoUrl = signal('');
  photoFile: File | null = null; // file asli yang dikirim ke backend
  photoName = signal('');
  photoSize = signal('');
  photoError = signal('');
  // Menjadi true setelah tombol Kirim ditekan; baru saat itu semua error ditampilkan
  submitted = signal(false);

  // Apakah kolom `name` salah DAN perlu menampilkan error?
  // Error muncul jika pengguna sudah menyentuh kolom itu atau sudah menekan Kirim.
  invalid(name: 'title' | 'building' | 'room' | 'category' | 'description'): boolean {
    const control = this.form.controls[name];
    return control.invalid && (control.touched || this.submitted());
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
      this.photoError.set('');
      this.photoFile = file;
      this.photoUrl.set(URL.createObjectURL(file)); // alamat sementara agar foto bisa ditampilkan
      this.photoName.set(file.name);                // hanya ditampilkan sebagai teks
      this.photoSize.set((file.size / 1024 / 1024).toFixed(1).replace('.', ',') + ' MB');
    }
    input.value = ''; // supaya file yang sama bisa dipilih ulang
  }

  removePhoto(): void {
    URL.revokeObjectURL(this.photoUrl());
    this.photoFile = null;
    this.photoUrl.set('');
  }

  fillSample(): void {
    this.form.patchValue({
      title: 'AC tidak dingin',
      building: this.service.buildings()[0],
      floor: 'Lantai 3',
      room: 'Ruang 3.12',
      category: 'AC & Pendingin',
      description: 'AC menyala tetapi tidak mengeluarkan udara dingin sejak pagi.',
    });
  }

  async send(): Promise<void> {
    this.submitted.set(true);
    // Jika ada yang kurang, berhenti di sini. Isi form tetap utuh.
    if (this.form.invalid || !this.photoFile) return;

    const report = await this.service.add({ ...this.form.getRawValue(), photoUrl: '' }, this.photoFile);
    this.router.navigate(['/laporan', report.id, 'terkirim']);
  }

  cancel(): void {
    this.router.navigate(['/']);
  }
}
