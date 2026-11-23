import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AppHeader } from '../../../layout/app-header/app-header';

/*
  LUPA KATA SANDI (tanpa backend)
  Mengatur ulang kata sandi lewat email butuh server, dan belum tersedia. Jalur yang sudah ada:
  Admin Universitas dapat mengganti kata sandi akun di menu Kelola akun. Halaman ini membantu pengguna
  menyiapkan permintaannya: memeriksa format email, lalu menyusun pesan siap salin untuk dikirim ke admin.
*/
@Component({
  selector: 'app-forgot-password',
  imports: [ReactiveFormsModule, RouterLink, AppHeader],
  template: `
    <app-header [showLogin]="false" />
    <main class="wrap">
      <section class="card">
        <h1>Lupa kata sandi</h1>
        <p class="sub">Kata sandi diatur ulang oleh Admin Universitas. Isi email akun Anda, lalu kirim pesan di bawah ini ke admin atau layanan fasilitas FTI UII.</p>

        <form [formGroup]="form" (ngSubmit)="prepare()" novalidate>
          <div class="field" [class.invalid]="invalid()">
            <label for="email">Email akun <span class="req" aria-hidden="true">*</span></label>
            <input id="email" type="email" formControlName="email" autocomplete="username" placeholder="nama@students.uii.ac.id" [attr.aria-invalid]="invalid()">
            @if (invalid()) { <span class="error">{{ form.controls.email.hasError('required') ? 'Email wajib diisi.' : 'Masukkan email yang valid.' }}</span> }
          </div>
          <button class="btn btn-primary" type="submit">Siapkan pesan permintaan</button>
        </form>

        @if (message(); as text) {
          <div class="msg" role="status">
            <p class="label">Pesan untuk admin</p>
            <p class="text">{{ text }}</p>
            <button class="btn" type="button" (click)="copy(text)">{{ copied() ? 'Tersalin ✓' : 'Salin pesan' }}</button>
          </div>
          <ol class="steps">
            <li>Kirim pesan ini ke Admin Universitas atau layanan fasilitas FTI UII.</li>
            <li>Admin mengatur kata sandi baru untuk akun Anda lewat menu Kelola akun.</li>
            <li>Masuk dengan kata sandi baru, lalu simpan di tempat yang aman.</li>
          </ol>
        }

        <a class="back" routerLink="/login">← Kembali ke halaman masuk</a>
      </section>
    </main>
  `,
  styles: `
    .wrap { display: grid; place-items: start center; padding: 64px 24px; }
    .card { display: flex; flex-direction: column; gap: 20px; width: 100%; max-width: 440px; padding: 32px; }
    form { display: flex; flex-direction: column; gap: 20px; }
    h1 { font-size: 28px; line-height: 1.3; font-weight: 600; }
    .sub { margin-top: -12px; font-size: 15px; line-height: 1.6; }
    .msg { display: flex; flex-direction: column; gap: 10px; padding: 16px; border-radius: var(--r-ctl); background: var(--blue-50); }
    .msg .label { color: var(--blue-600); font-size: 12px; font-weight: 600; }
    .msg .text { font-size: 14px; line-height: 1.6; overflow-wrap: anywhere; }
    .msg .btn { align-self: flex-start; min-height: 36px; padding: 0 16px; }
    .steps { display: grid; gap: 8px; padding-left: 20px; color: var(--muted); font-size: 13px; line-height: 1.5; list-style: decimal; }
    .back { align-self: center; font-size: 14px; font-weight: 500; }
    @media (max-width: 800px) {
      .wrap { padding: 24px 16px; }
      .card { padding: 20px 16px; }
      h1 { font-size: 23px; font-weight: 700; }
    }
  `,
})
export class ForgotPassword {
  form = inject(FormBuilder).nonNullable.group({ email: ['', [Validators.required, Validators.email]] });
  private submitted = signal(false);
  private email = signal('');
  copied = signal(false);

  message = computed(() => (this.email()
    ? `Halo Admin, saya lupa kata sandi akun UII SIRA dengan email ${this.email()}. Mohon bantu atur ulang kata sandi akun saya. Terima kasih.`
    : ''));

  invalid(): boolean {
    const c = this.form.controls.email;
    return c.invalid && (c.touched || this.submitted());
  }

  prepare(): void {
    this.submitted.set(true);
    this.copied.set(false);
    if (this.form.invalid) { this.email.set(''); return; }
    this.email.set(this.form.getRawValue().email.trim());
  }

  async copy(text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      this.copied.set(true);
    } catch {
      this.copied.set(false);   // clipboard ditolak: pengguna masih bisa menyalin teks secara manual
    }
  }
}
