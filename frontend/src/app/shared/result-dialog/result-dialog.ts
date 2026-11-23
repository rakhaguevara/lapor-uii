import { Component, ElementRef, afterNextRender, input, output, viewChild } from '@angular/core';

export interface ResultRow { label: string; value: string }

/*
  KARTU HASIL AKSI (pop-up): menampilkan berhasil atau gagalnya sebuah aksi ke server, lengkap dengan
  kode status HTTP dan pesan dari backend. Satu tombol saja (tutup). Induk menampilkannya dengan @if.
*/
@Component({
  selector: 'app-result-dialog',
  template: `
    <dialog #box class="box" [class.fail]="!ok()" aria-labelledby="res-title" (cancel)="onEsc($event)" (click)="onBackdrop($event)">
      <div class="card-in">
        <span class="mark" aria-hidden="true">{{ ok() ? '✓' : '!' }}</span>
        <h2 id="res-title">{{ title() }}</h2>
        @if (message()) { <p class="msg">{{ message() }}</p> }

        <dl class="rows">
          @for (r of rows(); track r.label) {
            <div><dt>{{ r.label }}</dt><dd>{{ r.value }}</dd></div>
          }
          @if (code()) {
            <div><dt>Respons server</dt><dd><span class="code">{{ code() }}</span> {{ codeText() }}</dd></div>
          }
        </dl>

        <button class="btn btn-primary" type="button" (click)="closed.emit()">{{ okLabel() }}</button>
      </div>
    </dialog>
  `,
  styles: `
    .box { width: min(440px, calc(100vw - 32px)); max-height: calc(100dvh - 32px); padding: 0; border: 0; border-radius: var(--r-card, 16px); background: var(--white); color: var(--ink); box-shadow: 0 16px 48px rgb(20 36 62 / 28%); overflow: auto; }
    .box::backdrop { background: rgb(20 36 62 / 48%); }
    .card-in { display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 28px 24px 24px; text-align: center; }
    .mark { display: grid; place-items: center; width: 52px; height: 52px; border-radius: 50%; background: var(--green-bg, #e8f5e9); color: var(--green, #1b5e20); font-size: 24px; font-weight: 700; }
    .fail .mark { background: var(--red-bg); color: var(--red); }
    h2 { font-size: 20px; line-height: 1.3; font-weight: 700; }
    .msg { color: var(--muted); font-size: 14px; line-height: 1.6; overflow-wrap: anywhere; }
    .rows { align-self: stretch; display: grid; gap: 0; margin: 4px 0 0; border: 1px solid var(--line); border-radius: var(--r-ctl); text-align: left; }
    .rows > div { display: flex; justify-content: space-between; gap: 16px; padding: 10px 14px; font-size: 13px; }
    .rows > div + div { border-top: 1px solid var(--line); }
    dt { color: var(--muted); flex: none; }
    dd { margin: 0; font-weight: 600; text-align: right; overflow-wrap: anywhere; }
    .code { display: inline-block; padding: 1px 8px; border-radius: 999px; background: var(--green-bg, #e8f5e9); color: var(--green, #1b5e20); font-size: 12px; }
    .fail .code { background: var(--red-bg); color: var(--red); }
    .btn { align-self: stretch; margin-top: 6px; }
  `,
})
export class ResultDialog {
  ok = input.required<boolean>();
  title = input.required<string>();
  message = input('');
  rows = input<ResultRow[]>([]);
  code = input(0);               // kode status HTTP dari backend (200 = berhasil); 0 = tidak ditampilkan
  codeText = input('');
  okLabel = input('Tutup');
  closed = output<void>();

  private box = viewChild.required<ElementRef<HTMLDialogElement>>('box');

  constructor() {
    afterNextRender(() => this.box().nativeElement.showModal());
  }

  onEsc(e: Event): void {
    e.preventDefault();
    this.closed.emit();
  }

  onBackdrop(e: MouseEvent): void {
    if (e.target === this.box().nativeElement) this.closed.emit();
  }
}
