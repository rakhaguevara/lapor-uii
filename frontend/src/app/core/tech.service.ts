import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AdminReport, rows, toAdminReport } from './admin.service';
import { AuthService } from './auth.service';

/*
  SERVICE TEKNISI. Endpoint kontrak API referensi:
    GET  /reports/tasks?tab=available|mine   daftar tugas (server menyaring sesuai cakupan gedung)
    POST /reports/self-assign?uuid=          ambil tugas
    POST /reports/respond-assignment?uuid=   ACCEPT / REJECT (kembalikan tugas dengan alasan)
    POST /reports/status?uuid=               DIPROSES / SELESAI (+ foto bukti)
  Jawabannya tidak terdokumentasi; pemetaan memakai toAdminReport (longgar).
  Tiap tab diminta 15 baris (per_page terbesar yang terdokumentasi); belum ada halaman berikutnya.
*/
@Injectable({ providedIn: 'root' })
export class TechService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  readonly me = computed(() => this.auth.user().name);
  readonly available = signal<AdminReport[]>([]);
  readonly mine = signal<AdminReport[]>([]);
  readonly all = computed(() => [...this.available(), ...this.mine()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));

  readonly stats = computed(() => {
    const mine = this.mine();
    return {
      available: this.available().length,
      active: mine.filter((r) => r.status !== 'selesai' && r.status !== 'gagal').length,
      confirm: mine.filter((r) => r.status === 'ditugaskan').length,
      done: mine.filter((r) => r.status === 'selesai').length,
    };
  });

  // Foto bukti penyelesaian (alamat sementara di browser, sampai backend mengembalikan fotonya)
  readonly proofs = signal<Record<string, string>>({});

  async load(): Promise<void> {
    const tab = (t: string) => firstValueFrom(this.http.get<unknown>('/api/reports/tasks', { params: { tab: t, per_page: '15' } })).then((r) => rows(r).map(toAdminReport));
    const [a, m] = await Promise.all([tab('available'), tab('mine')]);
    this.available.set(a);
    this.mine.set(m);
  }

  find(id: string): AdminReport | undefined {
    return this.all().find((r) => r.id === id);
  }

  private post(path: string, uuid: string, body: unknown) {
    return firstValueFrom(this.http.post(path, body, { params: { uuid } }));
  }

  async take(uuid: string): Promise<void> {
    await this.post('/api/reports/self-assign', uuid, {});
    await this.load();
  }

  async reject(uuid: string, reason: string): Promise<void> {
    await this.post('/api/reports/respond-assignment', uuid, { action: 'REJECT', reject_reason: reason });
    await this.load();
  }

  async setStatus(uuid: string, ticket: string, status: 'DIPROSES' | 'SELESAI', proof?: File | null): Promise<void> {
    const form = new FormData();
    form.append('status', status);
    if (proof) { form.append('proof_photo', proof); this.proofs.update((p) => ({ ...p, [ticket]: URL.createObjectURL(proof) })); }
    await this.post('/api/reports/status', uuid, form);
    await this.load();
  }
}
