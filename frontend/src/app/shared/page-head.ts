import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

export interface Crumb { label: string; link?: string }

/*
  KEPALA HALAMAN: breadcrumb + judul + subjudul, dan slot tombol di kanan.
  Pakai: <app-page-head title="..." subtitle="..." [crumbs]="[...]"> <a class="btn">...</a> </app-page-head>
  Isi di antara tag pembuka dan penutup tampil di sisi kanan (desktop).
  Di HP breadcrumb disembunyikan, sesuai desain.
*/
@Component({
  selector: 'app-page-head',
  imports: [RouterLink],
  template: `
    <div class="wrap">
      <div class="text">
        @if (crumbs().length) {
          <nav class="crumbs d-only" aria-label="Breadcrumb">
            @for (c of crumbs(); track c.label; let last = $last) {
              @if (c.link && !last) { <a [routerLink]="c.link">{{ c.label }}</a> } @else { <span [attr.aria-current]="last ? 'page' : null">{{ c.label }}</span> }
              @if (!last) { <span class="sep" aria-hidden="true">/</span> }
            }
          </nav>
        }
        <h1>{{ title() }}</h1>
        @if (subtitle()) { <p>{{ subtitle() }}</p> }
      </div>
      <div class="actions"><ng-content /></div>
    </div>
  `,
  styles: `
    :host { display: block; margin-bottom: 32px; }
    .wrap { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
    .crumbs { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; font-size: 13px; color: var(--muted); }
    .crumbs a { color: var(--blue-900); }
    .crumbs .sep { color: var(--muted); }
    h1 { font-size: 28px; line-height: 1.3; font-weight: 600; letter-spacing: -0.01em; }
    p { margin-top: 8px; color: var(--muted); font-size: 15px; }
    .actions:empty { display: none; }
    .actions { flex: none; padding-top: 4px; }

    @media (max-width: 800px) {
      :host { margin-bottom: 20px; }
      .wrap { flex-direction: column; gap: 12px; }
      h1 { font-size: 24px; font-weight: 700; }
      p { margin-top: 12px; font-size: 14px; }
      .actions { width: 100%; padding: 0; }
    }
  `,
})
export class PageHead {
  title = input.required<string>();
  subtitle = input('');
  crumbs = input<Crumb[]>([]);
}
