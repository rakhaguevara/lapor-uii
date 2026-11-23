import { Component, computed, inject, input, signal } from '@angular/core';
import { ADMIN_STATUSES } from '../../../../core/admin/admin.service';
import { ALL_STATUS_LABEL, LIKE_ORDER_OPTIONS, byLikeOrder } from '../../../../core/reports/report.model';
import { TechService } from '../../../../core/tech/tech.service';
import { Icon } from '../../../../shared/icon/icon';
import { TaskTable } from '../task-table/task-table';

export type TaskMode = 'all' | 'available' | 'mine';

// DAFTAR TUGAS TEKNISI: tab (Semua / Tersedia / Tugas Saya), cari, filter status, urutan, tabel / kartu.
// Dipakai di Beranda teknisi dan halaman daftar tugas.
@Component({
  selector: 'app-task-list',
  imports: [Icon, TaskTable],
  template: `
    <section class="card">
      <div class="tabs" role="tablist" aria-label="Jenis tugas">
        @for (t of tabs; track t.key) {
          <button type="button" role="tab" class="btn" [class.btn-primary]="cur() === t.key" [attr.aria-selected]="cur() === t.key" (click)="switchTab(t.key)">{{ t.label }}</button>
        }
      </div>

      <div class="toolbar" style="padding: 20px 0">
        <div class="field search grow"><label class="sr-only" for="q">Cari</label><app-icon name="search" [size]="16" />
          <input id="q" type="search" placeholder="Cari tugas atau ruangan…" [value]="dq()" (input)="dq.set($any($event.target).value)" (keydown.enter)="apply()"></div>
        <div class="field"><label class="sr-only" for="st">Status</label>
          <select id="st" [value]="dst()" (change)="dst.set($any($event.target).value)"><option value="">Semua status</option>
            @for (s of statuses; track s) { <option [value]="s">{{ label(s) }}</option> }</select></div>
        <div class="field"><label class="sr-only" for="lk">Urutan suka</label>
          <select id="lk" [value]="dlk()" (change)="dlk.set($any($event.target).value)">
            @for (o of likeOptions; track o.value) { <option [value]="o.value">{{ o.label }}</option> }</select></div>
        <button class="btn btn-primary" type="button" (click)="apply()">Cari</button>
      </div>

      <app-task-table [tasks]="list()" [loading]="!tech.loaded()" emptyText="Tidak ada tugas." />
    </section>

    <p class="note"><strong style="font-size: 15px; font-weight: 600">Hanya tugas {{ tech.building() ? 'Gedung ' + tech.building() : 'di gedung tanggung jawab Anda' }} yang ditampilkan.</strong><br>
      <span class="sub">Mengambil tugas akan menetapkan Anda sebagai teknisi penanggung jawab.</span></p>
  `,
  styles: `
    .tabs { display: flex; gap: 16px; }
    .tabs .btn { min-width: 148px; }
    @media (max-width: 800px) { .tabs { gap: 8px; } .tabs .btn { flex: 1; min-width: 0; padding: 0 8px; } }
  `,
})
export class TaskList {
  tech = inject(TechService);
  initial = input<TaskMode>('all');
  mode = signal<TaskMode | null>(null);
  cur = computed(() => this.mode() ?? this.initial());
  tabs: { key: TaskMode; label: string }[] = [{ key: 'all', label: 'Semua' }, { key: 'available', label: 'Tersedia' }, { key: 'mine', label: 'Tugas Saya' }];
  statuses = ADMIN_STATUSES;
  label = (s: string) => ALL_STATUS_LABEL[s];
  // Filter baru berlaku setelah tombol Cari ditekan (atau Enter di kotak cari): q/st/sort = yang dipakai daftar, d* = isian di layar
  q = signal(''); st = signal('');
  dq = signal(''); dst = signal('');
  lk = signal(''); dlk = signal('');   // urutan suka: '' semua, 'most' terbanyak, 'least' sedikit
  likeOptions = LIKE_ORDER_OPTIONS;
  // Pindah tab = mulai dari awal: pencarian, status, dan urutan dikosongkan (isian di layar maupun yang dipakai daftar)
  switchTab(key: TaskMode): void {
    this.mode.set(key);
    this.dq.set(''); this.dst.set(''); this.dlk.set('');
    this.apply();
  }
  apply(): void { this.q.set(this.dq()); this.st.set(this.dst()); this.lk.set(this.dlk()); }

  list = computed(() => {
    const m = this.cur();
    const src = m === 'available' ? this.tech.available() : m === 'mine' ? this.tech.mine() : this.tech.all();
    const q = this.q().toLowerCase();
    const out = src.filter((r) => (!q || [r.id, r.title, r.room].some((x) => x.toLowerCase().includes(q))) && (!this.st() || r.status === this.st()));
    // Bawaan: terbaru dulu. Pilihan suka mengurutkan menurut jumlah suka.
    const newest = [...out].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return byLikeOrder(newest, this.lk());
  });
}
