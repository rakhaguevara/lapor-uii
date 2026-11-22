import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ReportService } from '../../../core/reports/report.service';
import { PageHead } from '../../../shared/page-head/page-head';

/*
  PREVIEW FOTO: foto kerusakan dari form yang sedang diisi, ditampilkan besar.
  Datanya dari draft di ReportService. Tanpa draft (mis. halaman di-refresh) kembali ke form.
*/
@Component({
  selector: 'app-photo-preview',
  imports: [RouterLink, PageHead],
  template: `
    <app-page-head
      title="Preview foto"
      subtitle="Layanan fasilitas yang transparan, dari laporan hingga penyelesaian."
      [mobileSubtitle]="mobileSub"
      [crumbs]="[{ label: 'Portal Pelapor' }, { label: 'Preview foto' }]" />

    @if (draft; as d) {
      <section class="view">
        <figure class="card photo">
          <img [src]="d.photoUrl" [alt]="'Foto kerusakan: ' + d.title">
          <figcaption class="m-only">
            <strong>{{ d.photo?.name }}</strong>
            <span>{{ size }} · {{ d.building }} · {{ d.room }}</span>
          </figcaption>
        </figure>
        <div class="info">
          <h2 class="d-only">{{ d.photo?.name }}</h2>
          <p class="meta d-only">Foto kerusakan · {{ size }}</p>
          <p class="where d-only">{{ d.title }} {{ d.room }}<br>{{ d.building }}</p>
          <a class="btn back" routerLink="/laporan/baru">Kembali ke form</a>
        </div>
      </section>
    }
  `,
  styles: `
    .view { display: grid; grid-template-columns: minmax(0, 720px) 1fr; gap: 40px; align-items: start; padding: 4px 24px 0; }
    .photo { margin: 0; padding: 0; border: 0; background: none; }
    .photo img { width: 100%; aspect-ratio: 3 / 2; object-fit: cover; border-radius: 12px; }
    h2 { font-size: 18px; font-weight: 600; line-height: 1.4; overflow-wrap: anywhere; }
    .meta { margin-top: 4px; color: var(--muted); font-size: 13px; }
    .where { margin-top: 28px; font-size: 14px; line-height: 1.6; }
    .back { margin-top: 48px; min-width: 228px; align-self: flex-start; }

    @media (max-width: 1100px) { .view { grid-template-columns: 1fr; } }
    @media (max-width: 800px) {
      .view { gap: 16px; padding: 0; }
      .photo { padding: 16px; border: 1px solid var(--line); background: var(--white); border-radius: var(--r-card); }
      .photo img { aspect-ratio: 1; border-radius: 12px; }
      figcaption { display: flex; flex-direction: column; margin-top: 16px; }
      figcaption strong { font-size: 16px; font-weight: 700; overflow-wrap: anywhere; }
      figcaption span { margin-top: 10px; color: var(--muted); font-size: 12px; }
      .back { width: 100%; margin: 0; border-color: var(--blue-600); background: var(--blue-600); color: var(--white); }
    }
  `,
})
export class PhotoPreview {
  private service = inject(ReportService);
  draft = this.service.draft();
  mobileSub = this.draft ? `Foto kerusakan · ${this.draft.title}` : '';
  size = this.draft?.photo ? (this.draft.photo.size / 1024 / 1024).toFixed(1).replace('.', ',') + ' MB' : '';

  constructor() {
    // Tanpa draft tidak ada foto yang bisa ditampilkan
    if (!this.draft) inject(Router).navigate(['/laporan/baru']);
  }
}
