import { Component, ElementRef, afterNextRender, input, output, viewChild } from '@angular/core';

/*
  POP-UP "Batalkan dukungan?" (batal suka). Dipakai di daftar Laporan publik dan di halaman detail,
  supaya tampilannya sama di kedua tempat. Induk menampilkannya dengan @if dan menutupnya lewat (cancel) / (confirm).
  <dialog> bawaan browser: Esc menutup, fokus terkunci di dalamnya.
*/
@Component({
  selector: 'app-unlike-dialog',
  template: `
    <dialog #box class="dlg" aria-labelledby="unlike-title" (cancel)="onCancel($event)" (click)="onBackdrop($event)">
      <span class="warn" aria-hidden="true">!</span>
      <h2 id="unlike-title">Batalkan dukungan?</h2>
      <p>Apakah kamu yakin ingin membatalkan dukungan untuk laporan <strong>{{ id() }} · {{ title() }}</strong>? Dukungan membantu laporan ini lebih cepat ditangani.</p>
      <div class="acts">
        <button class="btn btn-outline" type="button" (click)="cancel.emit()">Tidak, tetap dukung</button>
        <button class="btn btn-danger" type="button" (click)="confirm.emit()">Ya, batalkan</button>
      </div>
    </dialog>
  `,
  styles: `
    .dlg { width: min(420px, calc(100vw - 32px)); padding: 28px 24px 24px; border: 0; border-radius: var(--r-card); background: var(--white); color: var(--ink); text-align: center; box-shadow: 0 20px 60px rgba(20, 36, 62, 0.25); }
    .dlg::backdrop { background: rgba(20, 36, 62, 0.45); }
    .warn { display: grid; place-items: center; width: 48px; height: 48px; margin: 0 auto 16px; border-radius: 50%; background: var(--amber-bg); color: var(--amber); font-size: 20px; font-weight: 700; }
    h2 { font-size: 18px; font-weight: 700; }
    p { margin-top: 10px; color: var(--muted); font-size: 14px; line-height: 1.6; }
    strong { color: var(--ink); font-weight: 600; }
    .acts { display: flex; justify-content: center; gap: 12px; margin-top: 24px; }
    @media (max-width: 800px) { .acts { flex-direction: column-reverse; } .acts .btn { width: 100%; } }
  `,
})
export class UnlikeDialog {
  id = input.required<string>();
  title = input.required<string>();
  confirm = output<void>();
  cancel = output<void>();

  private box = viewChild.required<ElementRef<HTMLDialogElement>>('box');

  constructor() {
    afterNextRender(() => this.box().nativeElement.showModal());
  }

  // Esc: serahkan penutupan ke induk
  onCancel(e: Event): void {
    e.preventDefault();
    this.cancel.emit();
  }

  // Klik di area gelap (di luar kotak) = batal
  onBackdrop(e: MouseEvent): void {
    if (e.target === this.box().nativeElement) this.cancel.emit();
  }
}
