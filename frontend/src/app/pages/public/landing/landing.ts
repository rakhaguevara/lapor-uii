import { Component } from '@angular/core';
import { AppHeader } from '../../../layout/app-header/app-header';
import { Welcome } from '../../../shared/welcome/welcome';

// LANDING PAGE (belum login): header kuning dengan tombol "Masuk" + isi sambutan.
@Component({
  selector: 'app-landing',
  imports: [AppHeader, Welcome],
  template: `
    <app-header />
    <main class="wrap">
      <h1 class="m-only">Selamat datang</h1>
      <app-welcome />
    </main>
    <footer>Your report matters. Let’s make campus better</footer>
  `,
  styles: `
    .wrap { max-width: 1192px; margin: 0 auto; padding: 52px 24px 24px; }
    h1 { margin-bottom: 16px; font-size: 23px; line-height: 1.3; font-weight: 700; }
    footer { padding: 0 24px 24px; text-align: center; color: var(--muted); font-size: 10px; }
    @media (max-width: 800px) {
      .wrap { padding: 40px 16px 16px; }
    }
  `,
})
export class Landing {}
