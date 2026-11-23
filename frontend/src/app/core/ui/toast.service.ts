import { Injectable, signal } from '@angular/core';

export interface ToastMessage { text: string; tone: 'ok' | 'error'; }

// Pesan singkat hasil sebuah aksi ("Laporan berhasil diperbarui"). Ditampilkan oleh <app-toast> di komponen paling luar.
@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly message = signal<ToastMessage | null>(null);
  private timer: ReturnType<typeof setTimeout> | undefined;

  show(text: string, tone: ToastMessage['tone'] = 'ok'): void {
    clearTimeout(this.timer);
    this.message.set({ text, tone });
    this.timer = setTimeout(() => this.message.set(null), tone === 'error' ? 6000 : 4000);
  }

  dismiss(): void {
    clearTimeout(this.timer);
    this.message.set(null);
  }
}
