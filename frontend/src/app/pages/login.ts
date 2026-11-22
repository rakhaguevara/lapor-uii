import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { AdminService } from '../core/admin.service';
import { ReportService } from '../core/report.service';
import { AppHeader } from '../layout/app-header';

/*
  HALAMAN LOGIN
  Header kuning yang sama dengan halaman lain, lalu kartu form di tengah.
  Form memakai Reactive Forms seperti form laporan. Setelah berhasil masuk,
  pengguna dibawa ke halaman Portal ("Selamat datang").
*/
@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, AppHeader],
  template: `
    <app-header [showLogin]="false" />
    <main class="wrap">
      <form class="card" [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <h1>Masuk</h1>
        <p class="sub">Masuk dengan akun email Anda untuk membuat dan memantau laporan.</p>

        <div class="field" [class.invalid]="invalid('email')">
          <label for="email">Email</label>
          <input id="email" type="email" formControlName="email" autocomplete="username" placeholder="nama@students.uii.ac.id" [attr.aria-invalid]="invalid('email')">
          @if (invalid('email')) { <span class="error">Masukkan email yang valid.</span> }
        </div>

        <div class="field" [class.invalid]="invalid('password')">
          <label for="password">Kata sandi</label>
          <input id="password" type="password" formControlName="password" autocomplete="current-password" [attr.aria-invalid]="invalid('password')">
          @if (invalid('password')) { <span class="error">Kata sandi wajib diisi.</span> }
        </div>

        @if (failed()) {
          <p class="alert" role="alert">Email atau kata sandi tidak sesuai. Periksa lagi lalu coba masuk kembali.</p>
        }

        <button class="btn btn-primary" type="submit" [disabled]="busy()">{{ busy() ? 'Memproses…' : 'Masuk' }}</button>
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
    .back { align-self: center; font-size: 14px; font-weight: 500; }

    @media (max-width: 800px) {
      .wrap { padding: 24px 16px; }
      form { padding: 20px 16px; }
      h1 { font-size: 23px; font-weight: 700; }
    }
  `,
})
export class Login {
  private auth = inject(AuthService);
  private reports = inject(ReportService);
  private admin = inject(AdminService);
  private router = inject(Router);

  form = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });
  submitted = signal(false);
  failed = signal(false);
  busy = signal(false);

  invalid(name: 'email' | 'password'): boolean {
    const control = this.form.controls[name];
    return control.invalid && (control.touched || this.submitted());
  }

  async submit(): Promise<void> {
    this.submitted.set(true);
    if (this.form.invalid || this.busy()) return;

    this.busy.set(true);
    this.failed.set(false);
    const { email, password } = this.form.getRawValue();
    if (await this.auth.login(email, password)) {
      // ambil data dari backend sebelum masuk portal (pelapor dan petugas butuh data berbeda)
      await (this.auth.roleCode() === 'PELAPOR' ? this.reports.loadAll() : this.admin.load());
      this.router.navigate(['/portal']);
    } else {
      this.failed.set(true);
    }
    this.busy.set(false);
  }
}
