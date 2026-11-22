import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PageHead } from '../../../shared/page-head/page-head';
import { TaskList, TaskMode } from '../../../shared/task-list/task-list';

// Halaman daftar tugas teknisi. Tiga alamat (semua, tersedia, saya) memakai halaman ini;
// `data.mode` menentukan tab awal dan judul.
@Component({
  selector: 'app-teknisi-tasks',
  imports: [PageHead, TaskList],
  template: `
    <app-page-head [title]="title" subtitle="Kelola penanganan fasilitas di gedung tanggung jawab Anda."
      [crumbs]="[{ label: 'Portal Teknisi', link: '/teknisi' }, { label: title }]" />
    <app-task-list [initial]="mode" />
  `,
})
export class TeknisiTasks {
  mode = inject(ActivatedRoute).snapshot.data['mode'] as TaskMode;
  title = { all: 'Semua tugas', available: 'Tugas tersedia', mine: 'Tugas Saya' }[this.mode];
}
