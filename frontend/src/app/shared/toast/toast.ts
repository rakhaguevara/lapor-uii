import { Component, inject } from '@angular/core';
import { ToastService } from '../../core/ui/toast.service';

// Kartu notifikasi kecil di pojok kanan atas, di bawah header (supaya tidak menutup profil/tombol masuk). Dipasang sekali di App, jadi tetap tampil walau halaman berpindah.
@Component({
  selector: 'app-toast',
  template: `
    @if (toast.message(); as m) {
      <div class="toast" [class.error]="m.tone === 'error'" [attr.role]="m.tone === 'error' ? 'alert' : 'status'">
        <span>{{ m.text }}</span>
        <button type="button" aria-label="Tutup pesan" (click)="toast.dismiss()">×</button>
      </div>
    }
  `,
  styles: `
    .toast { position: fixed; top: 124px; right: 24px; z-index: 1000; animation: toast-in 0.25s ease; display: flex; align-items: center; gap: 16px; max-width: min(520px, calc(100vw - 32px)); padding: 14px 16px 14px 20px; border-radius: var(--r-ctl); background: var(--green-bg, #e8f5e9); color: var(--green, #1b5e20); border: 1px solid currentColor; box-shadow: 0 8px 24px rgb(20 36 62 / 16%); font-size: 14px; font-weight: 500; }
    .toast.error { background: var(--red-bg); color: var(--red); }
    button { border: 0; background: none; color: inherit; font-size: 20px; line-height: 1; cursor: pointer; }
    @keyframes toast-in { from { opacity: 0; transform: translateX(24px); } to { opacity: 1; transform: none; } }
    @media (prefers-reduced-motion: reduce) { .toast { animation: none; } }
    @media (max-width: 800px) { .toast { top: 80px; right: 12px; left: 12px; max-width: none; } }
  `,
})
export class Toast {
  toast = inject(ToastService);
}
