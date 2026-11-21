import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { ReportService } from '../core/report.service';

/*
  HALAMAN LOGIN
  Dua bagian: panel gambar di kiri (disembunyikan di HP) dan form di kanan.
  Form memakai Reactive Forms seperti form laporan.
*/
@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  template: `
    <div class="page">
      <!-- Panel kiri. Ganti background dengan foto gedung FTI bila sudah ada berkasnya -->
      <section class="hero" aria-hidden="true">
        <p>FAKULTAS TEKNOLOGI INDUSTRI · UII</p>
        <h2>Kampus nyaman,<br>belajar lebih tenang.</h2>
      </section>

      <main class="panel">
        <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <!-- Placeholder logo. Ganti dengan logo resmi UII -->
          <span class="logo" aria-hidden="true">UII</span>
          <h1>Facility Reporting</h1>
          <p class="sub">Laporkan kerusakan fasilitas kampus<br>Fakultas Teknologi Industri</p>

          <div class="field" [class.invalid]="invalid('email')">
            <label for="email">Email</label>
            <input id="email" type="email" formControlName="email" autocomplete="username" placeholder="nama@students.uii.ac.id">
            @if (invalid('email')) { <span class="error">Masukkan email yang valid.</span> }
          </div>

          <div class="field" [class.invalid]="invalid('password')">
            <label for="password">Kata sandi</label>
            <input id="password" type="password" formControlName="password" autocomplete="current-password">
            @if (invalid('password')) { <span class="error">Kata sandi wajib diisi.</span> }
          </div>

          @if (failed()) {
            <p class="error" role="alert">Email atau kata sandi tidak sesuai.</p>
          }

          <button class="btn btn-primary" type="submit">Masuk</button>
          <p class="hint">Mode prototipe: isi email valid dan kata sandi apa saja.</p>
        </form>
        <footer>Facility Reporting · FTI UII</footer>
      </main>
    </div>
  `,
  styles: `
    .page { display: grid; grid-template-columns: 1.1fr 1fr; min-height: 100vh; }
    .hero { display: flex; flex-direction: column; justify-content: flex-end; gap: 12px; padding: 64px; color: #fff; background: linear-gradient(160deg, var(--blue-900), #0b66d8); }
    .hero p { font-size: 13px; font-weight: 600; letter-spacing: 0.05em; opacity: 0.85; }
    .hero h2 { font-size: 44px; line-height: 1.15; }
    .panel { display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 32px; background: #fff; }
    form { display: flex; flex-direction: column; gap: 20px; width: 100%; max-width: 360px; text-align: center; }
    .logo { display: grid; place-items: center; width: 64px; height: 64px; margin: 0 auto; border-radius: 8px; background: var(--blue-900); color: var(--gold); font-weight: 700; }
    h1 { font-size: 24px; }
    .sub { color: var(--muted); font-size: 14px; margin-bottom: 8px; }
    .field { text-align: left; }
    .hint { color: var(--muted); font-size: 13px; }
    footer { margin-top: 48px; color: var(--muted); font-size: 12px; }

    @media (max-width: 800px) {
      .page { grid-template-columns: 1fr; }
      .hero { display: none; }
    }
  `,
})
export class Login {
  private auth = inject(AuthService);
  private reports = inject(ReportService);
  private router = inject(Router);

  form = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });
  submitted = signal(false);
  failed = signal(false);

  invalid(name: 'email' | 'password'): boolean {
    const control = this.form.controls[name];
    return control.invalid && (control.touched || this.submitted());
  }

  async submit(): Promise<void> {
    this.submitted.set(true);
    if (this.form.invalid) return;

    const { email, password } = this.form.getRawValue();
    if (await this.auth.login(email, password)) {
      await this.reports.loadAll(); // ambil data dari backend sebelum masuk Beranda
      this.router.navigate(['/']);
    } else {
      this.failed.set(true);
    }
  }
}
