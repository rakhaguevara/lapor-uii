import { Component, input } from '@angular/core';
import { ALL_STATUS_LABEL } from '../core/report.model';

// Lencana status. Cara pakai: <app-status-badge [status]="report.status" />
// Desktop: pil berwarna. HP: hanya titik + teks berwarna (kelas `plain`), sesuai desain.
// Warna per status ada di styles.css (badge-dikirim, dst).
@Component({
  selector: 'app-status-badge',
  template: `<span [class]="'badge badge-' + status()" [class.plain]="plain()">{{ label() }}</span>`,
  styles: `
    .badge.plain { min-width: 0; height: auto; padding: 0; background: none; font-size: 13px; }
    @media (max-width: 800px) {
      .badge { min-width: 0; height: auto; padding: 0; background: none !important; font-size: 12.5px; }
    }
  `,
})
export class StatusBadge {
  status = input.required<string>();
  plain = input(false);
  label = () => ALL_STATUS_LABEL[this.status()] ?? this.status();
}
