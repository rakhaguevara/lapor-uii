import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Icon } from '../../../shared/icon/icon';
import { PageHead } from '../../../shared/page-head/page-head';

// PENUGASAN DIKEMBALIKAN (teknisi): layar konfirmasi setelah alasan penolakan terkirim.
// Setelah dikembalikan, tugas tidak ada lagi di daftar teknisi, jadi hanya nomor tiket dari alamat yang ditampilkan.
@Component({
  selector: 'app-teknisi-rejected',
  imports: [RouterLink, Icon, PageHead],
  template: `
    <app-page-head title="Penugasan dikembalikan" subtitle="Kelola penanganan fasilitas di gedung tanggung jawab Anda."
      [crumbs]="[{ label: 'Portal Teknisi', link: '/teknisi' }, { label: 'Penugasan dikembalikan' }]" />

    <section class="card done">
      <h2><app-icon name="check" [size]="26" [stroke]="3" /> Penugasan dikembalikan</h2>
      <p class="sub">Alasan Anda telah diteruskan ke Admin Unit untuk penugasan ulang.</p>
      <div class="info">
        <strong>{{ id }} · Dikirim</strong>
        <span>Laporan tetap aktif dan menunggu penugasan ulang.</span>
      </div>
      <a class="btn btn-primary" routerLink="/teknisi/saya">Kembali ke Tugas Saya</a>
    </section>
  `,
  styles: `
    .done { display: flex; flex-direction: column; align-items: flex-start; gap: 20px; max-width: 904px; margin: 24px auto 0; padding: 40px; }
    h2 { display: flex; align-items: center; gap: 14px; font-size: 28px; font-weight: 700; }
    .sub { font-size: 16px; }
    .info { align-self: stretch; padding: 18px 20px; border-radius: 12px; background: var(--blue-50); }
    .info strong { display: block; color: var(--blue-600); font-size: 18px; font-weight: 600; }
    .info span { display: block; margin-top: 6px; color: var(--muted); font-size: 14px; }
    @media (max-width: 800px) { .done { margin-top: 0; padding: 20px 16px; } h2 { font-size: 22px; } .done .btn { width: 100%; } }
  `,
})
export class TeknisiRejected {
  id = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';
}
