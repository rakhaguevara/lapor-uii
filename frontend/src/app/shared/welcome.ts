import { Component, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon } from './icon';

// Langkah "How It Works". Teks mengikuti desain.
const STEPS = [
  { no: '01', title: 'Temukan', text: 'Identifikasi fasilitas bermasalah' },
  { no: '02', title: 'Laporkan', text: 'Isi detail dan lampirkan foto' },
  { no: '03', title: 'Diterima', text: 'Laporan diterima sistem' },
  { no: '04', title: 'Ditangani', text: 'Proses perbaikan dilakukan' },
  { no: '05', title: 'Selesai', text: 'Periksa hasil dan beri feedback' },
];

/*
  ISI HALAMAN SAMBUTAN: hero, kartu akses, "See It. Report It. Fix It.", dan "How It Works".
  Dipakai di Landing (belum login, authed=false) dan Portal (sudah login, authed=true).
  Desktop: hero biru tua. HP: hero biru muda, kartu peran terbatas (Teknisi, Kaur) tampil di Portal.
*/
@Component({
  selector: 'app-welcome',
  imports: [RouterLink, Icon],
  template: `
    <section class="hero">
      <p class="tag">FAKULTAS TEKNOLOGI INDUSTRI · UII</p>
      <h2>Kampus nyaman,<br>belajar lebih tenang.</h2>
      <p class="lead">Laporkan kerusakan dan pantau penanganannya dalam satu tempat.</p>
    </section>

    <div class="two">
      <section class="card access">
        <p class="label"><span class="d-only">Akses</span><span class="m-only">{{ authed() ? 'AKSES ANDA' : 'AKSES' }}</span></p>
        <h3>{{ access().title }}</h3>
        <p class="desc">{{ access().text }}</p>
        @if (authed()) {
          <a class="btn btn-dark open" [routerLink]="home()">Buka portal <app-icon name="right" [size]="16" [stroke]="2" /></a>
        } @else {
          <p class="hint">Masuk dengan akun email mu!</p>
        }
      </section>

      <section class="card tagline">
        <h3>See It. Report It. Fix It.</h3>
        <p class="desc">Lihat masalahnya, laporkan, dan wujudkan perubahan.</p>
        <div class="privacy">
          <strong>Privasi terjaga</strong>
          <p>Identitas pelapor tidak ditampilkan pada laporan publik.</p>
        </div>
      </section>

      @if (authed() && access().title === 'Pelapor') {
        <!-- Peran lain: terkunci. Hanya tampil di HP, sesuai desain -->
        @for (r of locked; track r.title) {
          <section class="card locked m-only">
            <p class="label muted">Akses terbatas</p>
            <h3>{{ r.title }}</h3>
            <p class="desc">{{ r.text }}</p>
            <p class="hint">Masuk dengan akun berwenang</p>
          </section>
        }
      }
    </div>

    <section class="card how">
      <p class="label green">Pelapor</p>
      <h3>How It Works</h3>
      <p class="desc">Melaporkan fasilitas kampus kini lebih mudah.<br>Cukup ikuti beberapa langkah berikut!</p>

      <ol class="steps">
        @for (s of steps; track s.no; let i = $index) {
          <li class="step" [class.on]="i === active()" (mouseenter)="active.set(i)">
            <span class="num"><b>{{ s.no }}</b></span>
            <span class="txt"><strong>{{ s.title }}</strong><small>{{ s.text }}</small></span>
          </li>
        }
      </ol>
    </section>
  `,
  styles: `
    :host { display: block; }
    .hero { padding: 30px 32px 29px; border-radius: 24px; background: var(--blue-hero); color: var(--white); }
    .tag { font-size: 12px; font-weight: 600; color: #bbd8ff; line-height: 1.5; }
    .hero h2 { margin: 17px 0 18px; font-size: 36px; line-height: 52px; font-weight: 700; }
    .lead { font-size: 14px; }

    .two { display: grid; grid-template-columns: 1fr 1.19fr; gap: 16px; margin: 24px 0; }
    .card { display: flex; flex-direction: column; padding: 24px; }
    .card h3 { font-size: 22px; line-height: 1.3; font-weight: 700; }
    .tagline h3 { font-size: 20px; font-weight: 600; }
    .label { margin-bottom: 20px; font-size: 12px; font-weight: 600; color: var(--green); }
    .label.muted { color: var(--muted); }
    .desc { margin-top: 12px; color: var(--muted); font-size: 13px; }
    .hint { margin-top: auto; padding-top: 24px; color: var(--muted); font-size: 12px; }
    .open { align-self: flex-start; margin-top: auto; min-height: 44px; }
    .access .desc { margin-bottom: 24px; }
    .privacy { display: grid; grid-template-columns: 170px 1fr; gap: 16px; margin-top: 28px; font-size: 13px; }
    .privacy strong { color: var(--blue-600); font-weight: 600; }
    .privacy p { color: var(--muted); }

    .how { padding-bottom: 40px; }
    .how h3 { margin-top: -8px; }
    .steps { position: relative; display: flex; justify-content: space-between; gap: 8px; margin-top: 19px; padding: 0 52px 0 44px; }
    .steps::before { content: ''; position: absolute; left: 12px; right: 8px; top: 73px; height: 2px; border-radius: 2px; background: var(--blue-hero); }
    .step { position: relative; display: flex; flex-direction: column; align-items: center; gap: 42px; }
    .num { position: relative; display: grid; place-items: center; width: 50px; height: 50px; border-radius: 50%; background: var(--amber-bg); }
    .num b { position: relative; z-index: 1; font-size: 20px; font-weight: 600; color: var(--yellow); }
    .step.on .num { background: var(--yellow); }
    .step.on .num b { color: var(--amber-bg); }
    .step.on .num { z-index: 1; }
    .txt { position: relative; z-index: 1; display: flex; flex-direction: column; text-align: left; }
    .txt strong { font-size: 12px; font-weight: 600; color: var(--muted); }
    .txt small { font-size: 11px; color: var(--muted); }

    @media (max-width: 800px) {
      .hero { padding: 17px 20px 17px; border-radius: 16px; background: var(--blue-50); color: var(--ink); }
      .tag { color: var(--blue-600); font-size: 10px; }
      .hero h2 { margin: 14px 0 12px; font-size: 25px; line-height: 38px; }
      .lead { color: var(--muted); font-size: 12px; line-height: 1.65; }
      .two { grid-template-columns: 1fr; margin: 16px 0; }
      .card { padding: 17px 16px 18px; }
      .card h3 { font-size: 20px; }
      .tagline h3 { font-size: 19px; }
      .label { margin-bottom: 10px; font-size: 11px; color: var(--blue-600); }
      .label.green { color: var(--green); }
      .label.muted { color: var(--muted); font-weight: 500; }
      .desc { margin-top: 10px; font-size: 12px; }
      .access .desc, .hint { color: var(--ink); }
      .locked .desc { color: var(--muted); }
      .locked .hint { color: var(--muted); font-size: 12px; }
      .locked h3, .access h3 { font-size: 20px; }
      .hint { margin-top: 14px; padding-top: 0; font-size: 12px; }
      .open { align-self: stretch; margin-top: 8px; }
      .privacy { grid-template-columns: 1fr; gap: 6px; margin-top: 8px; font-size: 13px; }
      .privacy p { font-size: 12px; }
      .how { padding: 20px 20px 24px; }
      .steps { flex-direction: column; gap: 24px; margin-top: 24px; padding: 0; }
      .steps::before { left: 24px; right: auto; top: 25px; bottom: 25px; width: 2px; height: auto; }
      .step { flex-direction: row; align-items: center; gap: 16px; }
      .num { z-index: 1; }
    }
  `,
})
export class Welcome {
  authed = input(false);
  home = input('/beranda');       // tujuan tombol "Buka portal" (beranda sesuai peran)
  access = input({ title: 'Pelapor', text: 'Buat laporan dan pantau perkembangannya.' });
  steps = STEPS;
  active = signal(0);
  locked = [
    { title: 'Teknisi', text: 'Tangani tugas di gedung tanggung jawab Anda.' },
    { title: 'Kaur & Pimpinan', text: 'Pantau dan kelola laporan di unit Anda.' },
  ];
}
