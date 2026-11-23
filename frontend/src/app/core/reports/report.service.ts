import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { CATEGORY_KEYWORDS, DEFAULT_CATEGORY, NewReport, Report, StatusCode } from './report.model';

// Isi form yang disimpan sementara, supaya tidak hilang saat pelapor membuka preview foto lalu kembali.
// `photo` = file asli (dikirim ke backend), `photoUrl` = alamat sementara untuk pratinjau.
export interface ReportDraft {
  title: string; building: string; floor: string; room: string; description: string;
  photo: File | null; photoUrl: string;
}

// Bentuk data dari backend (lihat backend/server.js, fungsi dataLaporan)
interface ApiReport {
  uuid: string; ticket_no: string; title: string; floor: string; room_name: string; description: string;
  photo_url: string; status: string; created_at: string; like_count: number; is_liked: boolean;
  building: { uuid: string; name: string }; category: { uuid: string; name: string };
}
interface Item { uuid: string; name: string }

// Status backend (banyak) -> status frontend (3 saja, lihat report.model.ts)
function toStatus(status: string): StatusCode {
  if (status === 'DITERIMA') return 'dikirim';
  if (status === 'SELESAI' || status === 'TIDAK_DAPAT_DIPERBAIKI') return 'selesai';
  return 'diproses';
}

function toReport(r: ApiReport): Report {
  return {
    uuid: r.uuid, id: r.ticket_no, title: r.title, building: r.building?.name ?? '', floor: r.floor, room: r.room_name,
    category: r.category?.name ?? '', description: r.description, photoUrl: r.photo_url,
    status: toStatus(r.status), createdAt: r.created_at, likes: r.like_count, liked: r.is_liked,
  };
}

/*
  SERVICE LAPORAN
  Semua data laporan lewat sini; komponen tidak menyimpan data sendiri.
  Data diambil dari backend lewat HttpClient. Panggil loadAll() sekali setelah login.
  "signal" = wadah data yang memberi tahu tampilan otomatis saat isinya berubah.
*/
@Injectable({ providedIn: 'root' })
export class ReportService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  // Pengguna yang sedang masuk (dari proses login)
  get user() {
    return this.auth.user();
  }

  private _buildings = signal<Item[]>([]);
  private _categories = signal<Item[]>([]);
  readonly buildings = computed(() => this._buildings().map((b) => b.name));
  readonly categories = computed(() => this._categories().map((c) => c.name));
  readonly floors = ['Lantai 1', 'Lantai 2', 'Lantai 3', 'Lantai 4'];

  private _reports = signal<Report[]>([]);       // laporan milik saya
  private _publicReports = signal<Report[]>([]); // semua laporan
  readonly reports = this._reports.asReadonly();
  readonly publicReports = this._publicReports.asReadonly();

  // Urutan laporan pada daftar yang sedang dibuka (sesuai filter dan cakupan). Dipakai tombol
  // sebelumnya/berikutnya di halaman detail agar mengikuti daftar asal.
  readonly nav = signal<{ source: 'publik' | 'saya'; ids: string[] }>({ source: 'saya', ids: [] });

  // Hitungan untuk kartu di Beranda. "computed" dihitung ulang otomatis.
  readonly stats = computed(() => {
    const list = this._reports();
    return {
      total: list.length,
      dikirim: list.filter((r) => r.status === 'dikirim').length,
      diproses: list.filter((r) => r.status === 'diproses').length,
      selesai: list.filter((r) => r.status === 'selesai').length,
    };
  });

  // false selama pemuatan pertama dari backend; halaman memakainya untuk menampilkan kerangka pemuatan.
  // Pemuatan ulang di latar (setelah like, buat laporan, atau polling) tidak mengubahnya.
  readonly loaded = signal(false);

  // Draft form laporan. null = tidak ada draft.
  readonly draft = signal<ReportDraft | null>(null);

  // Form tidak punya kolom kategori (sesuai desain), tetapi backend mewajibkannya.
  // Kategori ditebak dari kata kunci pada nama kerusakan, lalu dicocokkan ke daftar dari backend.
  private categoryUuidFor(title: string): string {
    const words = title.toLowerCase().split(/[^a-z0-9]+/);
    const wanted = CATEGORY_KEYWORDS.find(([key]) => words.includes(key))?.[1] ?? DEFAULT_CATEGORY;
    const list = this._categories();
    return (list.find((c) => c.name === wanted) ?? list.find((c) => c.name === DEFAULT_CATEGORY) ?? list[0])?.uuid ?? '';
  }

  // Ambil semua data dari backend
  async loadAll(silent = false): Promise<void> {
    if (!silent) this.loaded.set(false);
    try {
      await this.fetchAll();
    } finally {
      this.loaded.set(true);
    }
  }

  private async fetchAll(): Promise<void> {
    const get = <T>(url: string) => firstValueFrom(this.http.get<{ data: T }>(url)).then((r) => r.data);
    const [buildings, categories, mine, all] = await Promise.all([
      get<Item[]>('/api/locations'),
      get<Item[]>('/api/damage-categories'),
      get<ApiReport[]>('/api/reports/my-reports'),
      get<ApiReport[]>('/api/reports/public'),
    ]);
    this._buildings.set(buildings);
    this._categories.set(categories);
    this._reports.set(mine.map(toReport));
    this._publicReports.set(all.map(toReport));
  }

  // Ambil satu laporan dari nomor tiket. Tidak ketemu -> undefined.
  async find(id: string): Promise<Report | undefined> {
    try {
      const res = await firstValueFrom(this.http.get<{ data: ApiReport }>('/api/reports/detail', { params: { ticket_no: id } }));
      return toReport(res.data);
    } catch {
      return undefined;
    }
  }

  // Membuat laporan baru (kirim sebagai form karena ada file foto)
  async add(data: NewReport, photo: File): Promise<Report> {
    const form = new FormData();
    form.append('title', data.title);
    form.append('building_uuid', this._buildings().find((b) => b.name === data.building)?.uuid ?? '');
    form.append('category_uuid', this.categoryUuidFor(data.title));
    form.append('floor', data.floor);
    form.append('room_name', data.room);
    form.append('description', data.description);
    form.append('photo', photo);
    const res = await firstValueFrom(this.http.post<{ data: ApiReport }>('/api/reports', form));
    await this.loadAll(true);
    return toReport(res.data);
  }

  // Like / batal like. Satu pengguna maksimal satu like per laporan.
  // Laporan Selesai tidak bisa di-like (ditolak backend).
  async toggleLike(id: string): Promise<void> {
    const target = this._publicReports().find((r) => r.id === id);
    if (!target) return;
    await firstValueFrom(this.http.post('/api/reports/like', {}, { params: { uuid: target.uuid } }));
    await this.loadAll(true);
  }
}
