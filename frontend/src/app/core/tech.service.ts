import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AdminService } from './admin.service';
import { AuthService } from './auth.service';

/*
  SERVICE TEKNISI
  Memakai data laporan dari AdminService. "Ambil tugas" belum punya endpoint di backend,
  jadi disimpan sebagai penugasan di memori (hilang saat refresh). "Mulai" dan "Selesai"
  memakai endpoint nyata POST /api/reports/status (DIPROSES / SELESAI).
*/
@Injectable({ providedIn: 'root' })
export class TechService {
  private http = inject(HttpClient);
  private admin = inject(AdminService);
  private auth = inject(AuthService);

  readonly me = computed(() => this.auth.user().name);

  // Cakupan gedung: dari data akun (contoh). Kosong = semua gedung.
  readonly scope = computed(() => {
    const acc = this.admin.accounts().find((a) => a.name === this.me() && a.role === 'Teknisi');
    return (acc && this.admin.buildings().find((b) => b.name.includes(acc.scope))?.name) ?? '';
  });

  private scoped = computed(() => this.admin.reports().filter((r) => !this.scope() || r.building === this.scope()));
  readonly available = computed(() => this.scoped().filter((r) => r.status === 'dikirim'));
  readonly mine = computed(() => this.scoped().filter((r) => this.admin.assignments()[r.id]?.tech === this.me()));
  readonly all = computed(() => [...this.available(), ...this.mine()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));

  readonly stats = computed(() => {
    const mine = this.mine();
    return {
      available: this.available().length,
      active: mine.filter((r) => r.status !== 'selesai' && r.status !== 'gagal').length,
      confirm: mine.filter((r) => r.status === 'ditugaskan').length,
      done: mine.filter((r) => r.status === 'selesai' && r.createdAt.slice(0, 7) === this.admin.month()).length,
    };
  });

  // Foto bukti penyelesaian (alamat sementara di browser; backend belum menyimpannya)
  readonly proofs = signal<Record<string, string>>({});

  take(id: string): void {
    this.admin.assign(id, this.me(), '');
  }

  async setStatus(id: string, status: 'DIPROSES' | 'SELESAI', proof?: File | null): Promise<void> {
    const r = this.admin.find(id);
    if (!r) return;
    const form = new FormData();
    form.append('status', status);
    if (proof) { form.append('proof_photo', proof); this.proofs.update((p) => ({ ...p, [id]: URL.createObjectURL(proof) })); }
    await firstValueFrom(this.http.post('/api/reports/status', form, { params: { uuid: r.uuid } }));
    await this.admin.load();
  }
}
