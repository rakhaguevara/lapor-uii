import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AdminReport, rows, toAdminReport } from '../admin/admin.service';
import { allPages } from '../http/all-pages';
import { AuthService } from '../auth/auth.service';

/*
  SERVICE TEKNISI. Endpoint kontrak API referensi:
    GET  /reports/tasks?tab=available|mine   daftar tugas (server menyaring sesuai cakupan gedung)
    POST /reports/self-assign?uuid=          ambil tugas
    POST /reports/respond-assignment?uuid=   ACCEPT / REJECT (kembalikan tugas dengan alasan)
    POST /reports/status?uuid=               DIPROSES / SELESAI (+ foto bukti)
  Jawabannya tidak terdokumentasi; pemetaan memakai toAdminReport (longgar).
  Tiap tab diminta 15 baris (per_page terbesar yang terdokumentasi); belum ada halaman berikutnya.
*/
export type TechStatus = 'DIPROSES' | 'SELESAI' | 'MENUNGGU' | 'TIDAK_DAPAT_DIPERBAIKI';

@Injectable({ providedIn: 'root' })
export class TechService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  readonly me = computed(() => this.auth.user().name);
  readonly available = signal<AdminReport[]>([]);
  readonly mine = signal<AdminReport[]>([]);
  // Gedung tanggung jawab teknisi: diambil dari tugas yang dikirim server (sudah disaring per cakupan gedung)
  readonly building = computed(() => [...this.mine(), ...this.available()].find((r) => r.building)?.building ?? '');
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

  // false selama pemuatan pertama; dipakai halaman untuk kerangka pemuatan
  readonly loaded = signal(false);

  async load(silent = false): Promise<void> {
    if (!silent) this.loaded.set(false);
    try {
      await this.fetchTasks();
    } finally {
      this.loaded.set(true);
    }
  }

  private async fetchTasks(): Promise<void> {
    const tab = (t: string) => allPages(this.http, '/api/reports/tasks', { tab: t }).then((r) => r.map(toAdminReport));
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
    await this.load(true);
  }

  // ACCEPT = terima penugasan dari Admin Unit
  async accept(uuid: string): Promise<void> {
    await this.post('/api/reports/respond-assignment', uuid, { action: 'ACCEPT' });
  }

  async reject(uuid: string, reason: string): Promise<void> {
    await this.post('/api/reports/respond-assignment', uuid, { action: 'REJECT', reject_reason: reason });
    await this.load(true);
  }

  // Catatan (untuk semua status) dikirim sebagai `note`, sesuai Swagger POST /reports/status.
  // Mengembalikan kode HTTP dan pesan dari backend, untuk ditampilkan di kartu hasil.
  async setStatus(uuid: string, ticket: string, status: TechStatus, opts: { proof?: File | null; note?: string } = {}): Promise<{ status: number; message: string }> {
    const form = new FormData();
    form.append('status', status);
    if (opts.note) form.append('note', opts.note);
    if (opts.proof) { form.append('proof_photo', opts.proof); this.proofs.update((p) => ({ ...p, [ticket]: URL.createObjectURL(opts.proof!) })); }
    const res = await firstValueFrom(this.http.post<{ msg?: string }>('/api/reports/status', form, { params: { uuid }, observe: 'response' }));
    await this.load(true).catch(() => {}); // status sudah tersimpan; gagal memuat ulang tidak boleh dilaporkan sebagai gagal mengubah status
    return { status: res.status, message: res.body?.msg ?? '' };
  }
}
