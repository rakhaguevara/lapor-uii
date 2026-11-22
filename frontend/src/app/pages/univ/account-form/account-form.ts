import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AdminService, STAFF_ROLES } from '../../../core/admin/admin.service';
import { PageHead } from '../../../shared/page-head/page-head';

// TAMBAH / UBAH AKUN STAF (POST/PUT /admin/users). API wajib password saat tambah akun,
// jadi ada kolom "Kata sandi awal" (tidak ada di desain). Cakupan = building_uuids.
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
        <div class="field" [class.invalid]="bad('password')">
          <label for="password">Kata sandi awal {{ id ? '(kosongkan bila tidak diubah)' : '*' }}</label>
          <input id="password" type="password" formControlName="password" autocomplete="new-password" [attr.aria-invalid]="bad('password')">
          @if (bad('password')) { <span class="error" role="alert">Kata sandi awal minimal 8 karakter.</span> }
        </div>
        <div class="field">
          <label for="role">Role *</label>
          <select id="role" formControlName="role">@for (r of roles; track r[0]) { <option [value]="r[0]">{{ r[1] }}</option> }</select>
        </div>
        <div class="field">
          <label for="scope">Cakupan gedung *</label>
          <select id="scope" formControlName="scope">
            <option value="">Semua gedung</option>
            @for (b of buildings(); track b.id) { <option [value]="b.id">{{ b.name }}</option> }
          </select>
        </div>
        <p class="hint">Akses teknisi dibatasi pada gedung yang ditetapkan.</p>
      </div>
      @if (error()) { <p class="error" role="alert" style="margin-top: 16px; color: var(--red); font-size: 12px">{{ error() }}</p> }
      <div class="foot">
        <a class="btn" routerLink="/univ/akun">Batal</a>
        <button class="btn btn-primary" type="submit" [disabled]="busy()">Simpan akun</button>
      </div>
    </form>
  `,
})
export class AccountForm {
  private admin = inject(AdminService);
  private router = inject(Router);
  id = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';
  roles = Object.entries(STAFF_ROLES);
  buildings = this.admin.buildings;
  private sent = false;
  busy = signal(false);
  error = signal('');

  form = inject(FormBuilder).nonNullable.group({
    name: ['', Validators.required], email: ['', [Validators.required, Validators.email]],
    password: ['', this.id ? [] : [Validators.required, Validators.minLength(8)]],
    role: ['TEKNISI'], scope: [''],
  });

  constructor() {
    const a = this.admin.accounts().find((x) => x.id === this.id);
    if (a) this.form.patchValue({ name: a.name, email: a.email, role: a.role, scope: a.buildingIds.length === 1 ? a.buildingIds[0] : '' });
  }

  bad(name: 'name' | 'email' | 'password'): boolean {
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
      await this.admin.saveAccount({
        id: this.id || undefined, name: v.name.trim(), email: v.email.trim(), role: v.role, password: v.password,
        buildingIds: v.scope ? [v.scope] : this.admin.buildings().filter((b) => b.active).map((b) => b.id),
      });
      this.router.navigate(['/univ/akun'], { queryParams: { tersimpan: v.name.trim() } });
    } catch {
      this.error.set('Akun belum tersimpan. Periksa isian lalu coba lagi.');
    }
    this.busy.set(false);
  }
}
