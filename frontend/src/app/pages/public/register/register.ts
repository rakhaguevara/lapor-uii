import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService, REPORTER_TYPES } from '../../../core/auth/auth.service';
import { AppHeader } from '../../../layout/app-header/app-header';

// HALAMAN DAFTAR (UC-01a): nama, email, kata sandi, jenis pelapor. Setelah berhasil, pengguna diarahkan ke Masuk.
@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink, AppHeader],
  template: `
    <app-header [showLogin]="false" />
    <main class="wrap">
      <form class="card" [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <h1>Daftar</h1>
        <p class="sub">Buat akun pelapor untuk membuat dan memantau laporan kerusakan fasilitas.</p>

        <div class="field" [class.invalid]="invalid('name')">
          <label for="name">Nama lengkap</label>
          <input id="name" formControlName="name" autocomplete="name" [attr.aria-invalid]="invalid('name')">
          @if (invalid('name')) { <span class="error">Nama lengkap wajib diisi.</span> }
        </div>

        <div class="field" [class.invalid]="invalid('email')">
          <label for="email">Email</label>
          <input id="email" type="email" formControlName="email" autocomplete="username" placeholder="nama@students.uii.ac.id" [attr.aria-invalid]="invalid('email')">
          @if (invalid('email')) { <span class="error">Masukkan email yang valid.</span> }
        </div>

        <div class="field">
          <label for="type">Jenis pelapor</label>
          <select id="type" formControlName="type">
            @for (t of types; track t[0]) { <option [value]="t[0]">{{ t[1] }}</option> }
          </select>
        </div>

        <div class="field" [class.invalid]="invalid('password')">
          <label for="password">Kata sandi</label>
          <input id="password" type="password" formControlName="password" autocomplete="new-password" [attr.aria-invalid]="invalid('password')">
          @if (invalid('password')) { <span class="error">Kata sandi minimal 8 karakter.</span> }
        </div>

        @if (failed()) { <p class="alert" role="alert">{{ failed() }}</p> }

        <button class="btn btn-primary" type="submit" [disabled]="busy()">{{ busy() ? 'Memproses…' : 'Daftar' }}</button>
        <p class="switch">Sudah punya akun? <a routerLink="/login">Masuk</a></p>
        <a class="back" routerLink="/">← Kembali ke beranda</a>
      </form>
    </main>
  `,
  styles: `
    .wrap { display: grid; place-items: start center; padding: 64px 24px; }
    form { display: flex; flex-direction: column; gap: 20px; width: 100%; max-width: 440px; padding: 32px; }
    h1 { font-size: 28px; line-height: 1.3; font-weight: 600; }
    .sub { margin-top: -12px; font-size: 15px; }
    .alert { padding: 12px 16px; border-radius: var(--r-ctl); background: var(--red-bg); color: var(--red); font-size: 14px; }
    .switch { align-self: center; font-size: 14px; }
    .switch a { font-weight: 600; }
    .back { align-self: center; font-size: 14px; font-weight: 500; }

    @media (max-width: 800px) {
      .wrap { padding: 24px 16px; }
      form { padding: 20px 16px; }
      h1 { font-size: 23px; font-weight: 700; }
    }
  `,
})
export class Register {
  private auth = inject(AuthService);
  private router = inject(Router);
  types = Object.entries(REPORTER_TYPES);

  form = inject(FormBuilder).nonNullable.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    type: ['MAHASISWA'],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });
  submitted = signal(false);
  failed = signal('');
  busy = signal(false);

  invalid(name: 'name' | 'email' | 'password'): boolean {
    const c = this.form.controls[name];
    return c.invalid && (c.touched || this.submitted());
  }

  async submit(): Promise<void> {
    this.submitted.set(true);
    if (this.form.invalid || this.busy()) return;
    this.busy.set(true);
    this.failed.set('');
    const v = this.form.getRawValue();
    const error = await this.auth.register({ name: v.name.trim(), email: v.email.trim(), password: v.password, type: v.type });
    this.busy.set(false);
    if (error) this.failed.set(error);
    else this.router.navigate(['/login'], { queryParams: { terdaftar: '1' } });
  }
}
