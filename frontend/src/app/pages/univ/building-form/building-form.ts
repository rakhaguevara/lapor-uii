import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AdminService } from '../../../core/admin/admin.service';
import { PageHead } from '../../../shared/page-head/page-head';
import { errorMessage } from '../../../core/http/api-error';

// TAMBAH / UBAH GEDUNG (alamat /univ/gedung/baru atau /univ/gedung/:id)
@Component({
  selector: 'app-building-form',
  imports: [ReactiveFormsModule, RouterLink, PageHead],
  template: `
    <app-page-head [title]="id ? 'Ubah gedung' : 'Tambah gedung'" subtitle="Kelola data gedung dan akses pengguna universitas."
      [crumbs]="[{ label: 'Portal Admin Universitas', link: '/univ' }, { label: id ? 'Ubah gedung' : 'Tambah gedung' }]" />

    <form class="card form-card" [formGroup]="form" (ngSubmit)="save()" novalidate>
      <h2 style="font-size: 22px; font-weight: 700">Data gedung</h2>
      <p class="hint" style="margin-top: 14px">* Wajib diisi</p>
      <div class="fields">
        <div class="field" [class.invalid]="bad('name')">
          <label for="name">Nama gedung <span class="req" aria-hidden="true">*</span></label>
          <input id="name" formControlName="name" placeholder="Gedung Laboratorium Terpadu" [attr.aria-invalid]="bad('name')">
          @if (bad('name')) { <span class="error" role="alert">Nama gedung wajib diisi.</span> }
        </div>
        <div class="field" [class.invalid]="bad('code')">
          <label for="code">Kode gedung <span class="req" aria-hidden="true">*</span></label>
          <input id="code" formControlName="code" placeholder="GLT" maxlength="6" [attr.aria-invalid]="bad('code')">
          @if (bad('code')) { <span class="error" role="alert">Kode gedung wajib diisi.</span> }
        </div>
        <div class="field" [class.invalid]="bad('faculty')">
          <label for="faculty">Fakultas / unit <span class="req" aria-hidden="true">*</span></label>
          <input id="faculty" formControlName="faculty" placeholder="Fakultas Teknologi Industri" [attr.aria-invalid]="bad('faculty')">
          @if (bad('faculty')) { <span class="error" role="alert">Fakultas / unit wajib diisi.</span> }
        </div>
        <div class="field" [class.invalid]="bad('floors')">
          <label for="floors">Jumlah lantai <span class="req" aria-hidden="true">*</span></label>
          <input id="floors" type="number" min="1" max="30" formControlName="floors" [attr.aria-invalid]="bad('floors')">
          @if (bad('floors')) { <span class="error" role="alert">Isi jumlah lantai (1–30).</span> }
        </div>
      </div>
      @if (error()) { <p class="error" role="alert" style="margin-top: 16px; color: var(--red); font-size: 12px">{{ error() }}</p> }
      <div class="foot">
        <a class="btn" routerLink="/univ/gedung">Batal</a>
        <button class="btn btn-primary" type="submit" [disabled]="busy()">Simpan gedung</button>
      </div>
    </form>
  `,
})
export class BuildingForm {
  private admin = inject(AdminService);
  private router = inject(Router);
  id = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';
  private sent = false;
  busy = signal(false);
  error = signal('');

  form = inject(FormBuilder).nonNullable.group({
    name: ['', Validators.required], code: ['', Validators.required], faculty: ['', Validators.required],
    floors: [4, [Validators.required, Validators.min(1), Validators.max(30)]],
  });

  constructor() {
    const b = this.admin.buildings().find((x) => x.id === this.id);
    if (b) this.form.patchValue({ name: b.name, code: b.code, faculty: b.faculty, floors: b.floors });
  }

  bad(name: 'name' | 'code' | 'faculty' | 'floors'): boolean {
    const c = this.form.controls[name];
    return c.invalid && (c.touched || this.sent);
  }

  async save(): Promise<void> {
    this.sent = true;
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    this.busy.set(true);
    this.error.set('');
    try {
      await this.admin.saveBuilding({ ...v, name: v.name.trim(), code: v.code.trim().toUpperCase(), faculty: v.faculty.trim(), id: this.id || undefined });
      this.router.navigate(['/univ/gedung'], { queryParams: { tersimpan: v.name.trim() } });
    } catch (err) {
      this.error.set(errorMessage(err, 'Gedung belum tersimpan. Periksa isian lalu coba lagi.'));
    }
    this.busy.set(false);
  }
}
