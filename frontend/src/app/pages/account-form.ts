import { Component, computed, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ACCOUNT_ROLES, AdminService, SCOPES } from '../core/admin.service';
import { PageHead } from '../shared/page-head';

// TAMBAH / UBAH AKUN (alamat /univ/akun/baru atau /univ/akun/:id)
@Component({
  selector: 'app-account-form',
  imports: [ReactiveFormsModule, RouterLink, PageHead],
  template: `
    <app-page-head [title]="id ? 'Ubah akun' : 'Tambah akun'" subtitle="Kelola data gedung dan akses pengguna universitas."
      [crumbs]="[{ label: 'Portal Admin Universitas', link: '/univ' }, { label: id ? 'Ubah akun' : 'Tambah akun' }]" />

    <form class="card form-card" [formGroup]="form" (ngSubmit)="save()" novalidate>
      <h2 style="font-size: 22px; font-weight: 700">Data pengguna</h2>
      <p class="hint" style="margin-top: 14px">* Wajib diisi</p>
      <div class="fields">
        <div class="field" [class.invalid]="bad('name')">
          <label for="name">Nama lengkap *</label>
          <input id="name" formControlName="name" placeholder="Rina Handayani" [attr.aria-invalid]="bad('name')">
          @if (bad('name')) { <span class="error" role="alert">Nama lengkap wajib diisi.</span> }
        </div>
        <div class="field" [class.invalid]="bad('email')">
          <label for="email">Email universitas *</label>
          <input id="email" type="email" formControlName="email" placeholder="nama@uii.ac.id" [attr.aria-invalid]="bad('email')">
          @if (bad('email')) { <span class="error" role="alert">Masukkan email yang valid.</span> }
        </div>
        <div class="field">
          <label for="role">Role *</label>
          <select id="role" formControlName="role">@for (r of roles; track r) { <option [value]="r">{{ r }}</option> }</select>
        </div>
        <div class="field">
          <label for="scope">Cakupan gedung *</label>
          <select id="scope" formControlName="scope">@for (s of scopes(); track s) { <option [value]="s">{{ s }}</option> }</select>
        </div>
        <p class="hint">Akses teknisi dibatasi pada gedung yang ditetapkan.</p>
      </div>
      <div class="foot">
        <a class="btn" routerLink="/univ/akun">Batal</a>
        <button class="btn btn-primary" type="submit">Simpan akun</button>
      </div>
    </form>
  `,
})
export class AccountForm {
  private admin = inject(AdminService);
  private router = inject(Router);
  id = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';
  roles = ACCOUNT_ROLES;
  private sent = false;

  // Cakupan: unit/universitas atau satu gedung
  scopes = computed(() => [...SCOPES, ...this.admin.buildings().map((b) => b.name)]);

  form = inject(FormBuilder).nonNullable.group({
    name: ['', Validators.required], email: ['', [Validators.required, Validators.email]],
    role: [ACCOUNT_ROLES[1]], scope: [SCOPES[0]],
  });

  constructor() {
    const a = this.admin.accounts().find((x) => x.id === this.id);
    if (a) this.form.patchValue(a);
  }

  bad(name: 'name' | 'email'): boolean {
    const c = this.form.controls[name];
    return c.invalid && (c.touched || this.sent);
  }

  save(): void {
    this.sent = true;
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    this.admin.saveAccount({ ...v, name: v.name.trim(), email: v.email.trim(), id: this.id || undefined });
    this.router.navigate(['/univ/akun'], { queryParams: { tersimpan: v.name.trim() } });
  }
}
