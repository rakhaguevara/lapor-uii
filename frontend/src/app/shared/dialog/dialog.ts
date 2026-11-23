import { Component, ElementRef, afterNextRender, input, output, viewChild } from '@angular/core';

/*
  POP-UP (kartu dialog) yang dipakai bersama: konfirmasi hapus, konfirmasi keluar, dan form edit.
  Memakai elemen <dialog> bawaan browser (showModal): tampil di lapisan paling atas, latar belakang
  tidak bisa diklik, fokus terkunci di dalam kartu, dan Esc menutupnya.
  Komponen ini tidak menutup dirinya sendiri: induk yang memutuskan lewat (cancel) dan (confirm).
  Isi tambahan (misalnya form) dimasukkan di antara tag <app-dialog>.
*/
@Component({
  selector: 'app-dialog',
  template: `
    <dialog #box class="box" [class.danger]="danger()" [attr.aria-labelledby]="'dlg-title'"
      (cancel)="onEsc($event)" (click)="onBackdrop($event)">
      <div class="card-in">
        <h2 id="dlg-title">{{ title() }}</h2>
        @if (message()) { <p class="msg">{{ message() }}</p> }
        <ng-content />
        @if (error()) { <p class="error" role="alert">{{ error() }}</p> }
        <div class="actions">
          <button class="btn" type="button" [disabled]="busy()" (click)="cancel.emit()">{{ cancelLabel() }}</button>
          <button class="btn" [class.btn-primary]="!danger()" [class.btn-danger]="danger()" type="button" [disabled]="busy()" (click)="confirm.emit()">
            {{ busy() ? busyLabel() : confirmLabel() }}
          </button>
        </div>
      </div>
    </dialog>
  `,
  styles: `
    .box { width: min(480px, calc(100vw - 32px)); max-height: calc(100dvh - 32px); padding: 0; border: 0; border-radius: var(--r-card, 16px); background: var(--white); color: var(--ink); box-shadow: 0 16px 48px rgb(20 36 62 / 28%); overflow: auto; }
    .box::backdrop { background: rgb(20 36 62 / 48%); }
    .card-in { display: flex; flex-direction: column; gap: 16px; padding: 28px 28px 24px; }
    h2 { font-size: 20px; line-height: 1.3; font-weight: 700; }
    .danger h2 { color: var(--red); }
    .msg { color: var(--muted); font-size: 14px; line-height: 1.6; }
    .error { padding: 12px 16px; border-radius: var(--r-ctl); background: var(--red-bg); color: var(--red); font-size: 13px; }
    .actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 8px; }
    .actions .btn { min-width: 112px; padding: 0 24px; }
    @media (max-width: 800px) {
      .card-in { padding: 22px 18px 18px; }
      .actions { flex-direction: column-reverse; }
      .actions .btn { width: 100%; }
    }
  `,
})
export class Dialog {
  title = input.required<string>();
  message = input('');
  confirmLabel = input('Ya');
  cancelLabel = input('Batal');
  busyLabel = input('Memproses…');
  danger = input(false);   // true = aksi merusak (hapus): tombol dan judul merah
  busy = input(false);     // true = sedang menyimpan: tombol dikunci, Esc dan klik latar diabaikan
  error = input('');       // pesan gagal dari server, ditampilkan di dalam kartu

  confirm = output<void>();
  cancel = output<void>();

  private box = viewChild.required<ElementRef<HTMLDialogElement>>('box');

  constructor() {
    afterNextRender(() => this.box().nativeElement.showModal());
  }

  // Esc: jangan tutup sendiri, serahkan ke induk (dan abaikan saat sedang menyimpan)
  onEsc(e: Event): void {
    e.preventDefault();
    if (!this.busy()) this.cancel.emit();
  }

  // Klik di area gelap (di luar kartu) = batal
  onBackdrop(e: MouseEvent): void {
    if (e.target === this.box().nativeElement && !this.busy()) this.cancel.emit();
  }
}
