import { Component, computed, inject, input, signal } from '@angular/core';
import { ADMIN_STATUSES } from '../../core/admin/admin.service';
import { ALL_STATUS_LABEL } from '../../core/reports/report.model';
import { TechService } from '../../core/tech/tech.service';
import { Icon } from '../icon/icon';
import { ReportTable } from '../report-table/report-table';

export type TaskMode = 'all' | 'available' | 'mine';

// DAFTAR TUGAS TEKNISI: tab (Semua / Tersedia / Tugas Saya), cari, filter status, urutan, tabel / kartu.
// Dipakai di Beranda teknisi dan halaman daftar tugas.
@Component({
  selector: 'app-task-list',
  imports: [Icon, ReportTable],
  template: `
    <section class="card">
      <div class="tabs" role="tablist" aria-label="Jenis tugas">
        @for (t of tabs; track t.key) {
          <button type="button" role="tab" class="btn" [class.btn-primary]="cur() === t.key" [attr.aria-selected]="cur() === t.key" (click)="mode.set(t.key)">{{ t.label }}</button>
        }
      </div>

      <div class="toolbar" style="padding: 20px 0">
        <div class="field search grow"><label class="sr-only" for="q">Cari</label><app-icon name="search" [size]="16" />
          <input id="q" type="search" placeholder="Cari tugas atau ruangan…" [value]="q()" (input)="q.set($any($event.target).value)"></div>
        <div class="field"><label class="sr-only" for="st">Status</label>
          <select id="st" (change)="st.set($any($event.target).value)"><option value="">Semua status</option>
            @for (s of statuses; track s) { <option [value]="s">{{ label(s) }}</option> }</select></div>
        <div class="field"><label class="sr-only" for="so">Urutan</label>
          <select id="so" (change)="sort.set($any($event.target).value)"><option value="new">Terbaru</option><option value="old">Terlama</option><option value="likes">Suka terbanyak</option></select></div>
      </div>

      <app-report-table [reports]="list()" base="/teknisi/tugas" [showLike]="true" [likeable]="false" [showDetail]="true" emptyText="Tidak ada tugas." />
    </section>

    <p class="note"><strong style="font-size: 15px; font-weight: 600">Hanya tugas di gedung tanggung jawab Anda yang ditampilkan.</strong><br>
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
  q = signal(''); st = signal(''); sort = signal('new');

  list = computed(() => {
    const m = this.cur();
    const src = m === 'available' ? this.tech.available() : m === 'mine' ? this.tech.mine() : this.tech.all();
    const q = this.q().toLowerCase();
    const out = src.filter((r) => (!q || [r.id, r.title, r.room].some((x) => x.toLowerCase().includes(q))) && (!this.st() || r.status === this.st()));
    const by = this.sort();
    return [...out].sort((a, b) => by === 'likes' ? b.likes - a.likes : by === 'old' ? a.createdAt.localeCompare(b.createdAt) : b.createdAt.localeCompare(a.createdAt));
  });
}
