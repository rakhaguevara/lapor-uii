import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { AdminService } from '../../../core/admin/admin.service';
import { TechService } from '../../../core/tech/tech.service';
import { ReportService } from '../../../core/reports/report.service';
import { DEMO } from '../../../core/mock/mock-api';
import { AppHeader } from '../../../layout/app-header/app-header';

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
          <p class="alert" role="alert">{{ failed() }}</p>
        }

        <button class="btn btn-primary" type="submit" [disabled]="busy()">{{ busy() ? 'Memproses…' : 'Masuk' }}</button>
        <a class="back" routerLink="/">← Kembali ke beranda</a>

        @if (demo) {
          <div class="demo" aria-label="Akun demo">
            <p class="hint">Mode demo (tanpa backend). Masuk cepat sebagai:</p>
            @for (a of accounts; track a.email) {
              <button class="btn" type="button" (click)="quick(a.email, a.pw)">{{ a.label }}</button>
            }
          </div>
        }
      </form>
    </main>
  `,
  styles: `
    .wrap { display: grid; place-items: start center; padding: 64px 24px; }
    form { display: flex; flex-direction: column; gap: 20px; width: 100%; max-width: 440px; padding: 32px; }
    h1 { font-size: 28px; line-height: 1.3; font-weight: 600; }
    .sub { margin-top: -12px; font-size: 15px; }
    .demo { display: flex; flex-wrap: wrap; gap: 8px; padding-top: 16px; border-top: 1px solid var(--line); }
    .demo .hint { width: 100%; }
    .demo .btn { min-height: 36px; padding: 0 14px; }
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
  private tech = inject(TechService);
  private router = inject(Router);

  form = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });
  demo = DEMO;
  accounts = [
    { label: 'Pelapor', email: 'aisyah@uii.ac.id', pw: 'password123' },
    { label: 'Teknisi', email: 'budi@uii.ac.id', pw: 'teknisi123' },
    { label: 'Admin Unit', email: 'admin@uii.ac.id', pw: 'admin123' },
    { label: 'Admin Universitas', email: 'adminuniv@uii.ac.id', pw: 'univ12345' },
  ];
  quick(email: string, password: string): void {
    this.form.setValue({ email, password });
    this.submit();
  }
  submitted = signal(false);
  failed = signal('');
  busy = signal(false);

  invalid(name: 'email' | 'password'): boolean {
    const control = this.form.controls[name];
    return control.invalid && (control.touched || this.submitted());
  }

  async submit(): Promise<void> {
    this.submitted.set(true);
    if (this.form.invalid || this.busy()) return;

    this.busy.set(true);
    this.failed.set('');
    const { email, password } = this.form.getRawValue();
    const loginError = await this.auth.login(email, password);
    // Kosongkan isian setelah percobaan masuk, benar atau salah
    this.form.reset();
    this.submitted.set(false);
    if (!loginError) {
      // ambil data dari backend sebelum masuk portal (pelapor dan petugas butuh data berbeda)
      const role = this.auth.roleCode();
      await (role === 'PELAPOR' ? this.reports.loadAll() : role === 'TEKNISI' ? this.tech.load() : this.admin.load(role));
      this.router.navigate(['/portal']);
    } else {
      this.failed.set(loginError);
    }
    this.busy.set(false);
  }
}
