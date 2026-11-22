import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AdminService, SCOPES } from '../core/admin.service';
import { PageHead } from '../shared/page-head';

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
          <label for="name">Nama gedung *</label>
          <input id="name" formControlName="name" placeholder="Gedung Laboratorium Terpadu" [attr.aria-invalid]="bad('name')">
          @if (bad('name')) { <span class="error" role="alert">Nama gedung wajib diisi.</span> }
        </div>
        <div class="field" [class.invalid]="bad('code')">
          <label for="code">Kode gedung *</label>
          <input id="code" formControlName="code" placeholder="GLT" maxlength="6" [attr.aria-invalid]="bad('code')">
          @if (bad('code')) { <span class="error" role="alert">Kode gedung wajib diisi.</span> }
        </div>
        <div class="field">
          <label for="scope">Fakultas / unit *</label>
          <select id="scope" formControlName="scope">@for (s of scopes; track s) { <option [value]="s">{{ s }}</option> }</select>
        </div>
        <div class="field" [class.invalid]="bad('floors')">
          <label for="floors">Jumlah lantai *</label>
          <input id="floors" type="number" min="1" max="30" formControlName="floors" [attr.aria-invalid]="bad('floors')">
          @if (bad('floors')) { <span class="error" role="alert">Isi jumlah lantai (1–30).</span> }
        </div>
      </div>
      <div class="foot">
        <a class="btn" routerLink="/univ/gedung">Batal</a>
        <button class="btn btn-primary" type="submit">Simpan gedung</button>
      </div>
    </form>
  `,
})
export class BuildingForm {
  private admin = inject(AdminService);
  private router = inject(Router);
  id = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';
  scopes = SCOPES;
  private sent = false;

  form = inject(FormBuilder).nonNullable.group({
    name: ['', Validators.required], code: ['', Validators.required], scope: [SCOPES[0]],
    floors: [4, [Validators.required, Validators.min(1), Validators.max(30)]],
  });

  constructor() {
    const b = this.admin.buildings().find((x) => x.id === this.id);
    if (b) this.form.patchValue(b);
  }

  bad(name: 'name' | 'code' | 'floors'): boolean {
    const c = this.form.controls[name];
    return c.invalid && (c.touched || this.sent);
  }

  save(): void {
    this.sent = true;
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    this.admin.saveBuilding({ ...v, name: v.name.trim(), code: v.code.trim().toUpperCase(), id: this.id || undefined });
    this.router.navigate(['/univ/gedung'], { queryParams: { tersimpan: v.name.trim() } });
  }
}
