import { Component, input, output } from '@angular/core';

// Sakelar aktif/nonaktif. Tidak mengubah dirinya sendiri: induk yang memutuskan nilai baru lewat (toggled), jadi tampilan selalu sama dengan data.
@Component({
  selector: 'app-switch',
  template: `
    <button type="button" role="switch" class="sw" [class.on]="checked()" [attr.aria-checked]="checked()" [attr.aria-label]="label()"
      [disabled]="busy()" (click)="toggled.emit(!checked())"><span class="knob"></span></button>
  `,
  styles: `
    .sw { position: relative; width: 44px; height: 24px; padding: 0; border: 0; border-radius: 999px; background: var(--muted, #9aa3b2); cursor: pointer; transition: background 0.2s; flex: none; }
    .sw.on { background: var(--green, #2e7d52); }
    .sw:disabled { opacity: 0.5; cursor: wait; }
    .sw:focus-visible { outline: 2px solid var(--blue, #2563eb); outline-offset: 2px; }
    .knob { position: absolute; top: 3px; left: 3px; width: 18px; height: 18px; border-radius: 50%; background: #fff; box-shadow: 0 1px 3px rgb(0 0 0 / 25%); transition: transform 0.2s; }
    .on .knob { transform: translateX(20px); }
    @media (prefers-reduced-motion: reduce) { .sw, .knob { transition: none; } }
  `,
})
export class Switch {
  checked = input.required<boolean>();
  label = input('');
  busy = input(false);
  toggled = output<boolean>();
}
