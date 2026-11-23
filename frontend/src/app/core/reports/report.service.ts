import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { allPages } from '../http/all-pages';
import { reportPhoto } from './photo-url';
import { CATEGORY_KEYWORDS, DEFAULT_CATEGORY, NewReport, Report, StatusCode, isTestBuilding } from './report.model';

// Isi form yang disimpan sementara, supaya tidak hilang saat pelapor membuka preview foto lalu kembali.
// `photo` = file asli (dikirim ke backend), `photoUrl` = alamat sementara untuk pratinjau.
export interface ReportDraft {
  title: string; building: string; floor: string; room: string; description: string;
  photo: File | null; photoUrl: string;
}

// Bentuk data dari backend (lihat backend/server.js, fungsi dataLaporan)
interface ApiReport {
  uuid: string; ticket_no: string; title: string; floor: string; room_name: string; description: string;
  photo_url?: string; photos?: { photo_url?: string; file_path?: string; photo_type?: string }[]; status: string; created_at: string; like_count: number; is_liked: boolean;
  building: { uuid: string; name: string }; category: { uuid: string; name: string };
}
interface Item { uuid: string; name: string }

// Status backend (banyak) -> status frontend (3 saja, lihat report.model.ts)
function toStatus(status: string): StatusCode {
  if (status === 'DITERIMA') return 'dikirim';
  if (status === 'SELESAI' || status === 'TIDAK_DAPAT_DIPERBAIKI') return 'selesai';
  return 'diproses';
}

// Perkecil foto sebelum dikirim: sisi terpanjang maksimal 1600 px, JPEG, target di bawah ~1 MB.
// Server menolak file besar dengan 422 "The photo failed to upload." (batas upload PHP/Vercel).
async function shrinkPhoto(file: File): Promise<File> {
  const LIMIT = 1024 * 1024;
  if (file.size <= LIMIT && file.type === 'image/jpeg') return file;
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.fillStyle = '#fff'; // PNG transparan -> latar putih agar tidak jadi hitam di JPEG
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    bmp.close();
    let blob: Blob | null = null;
    for (const q of [0.85, 0.7, 0.55, 0.4]) {
      blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/jpeg', q));
      if (blob && blob.size <= LIMIT) break;
    }
    if (!blob) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' });
  } catch {
    return file; // gagal diperkecil: kirim aslinya
  }
}

// Jumlah like: nama kolomnya bisa berbeda antar versi backend (angka, teks, atau larik pengguna).
export function likeCount(r: object & { is_liked?: boolean }): number {
  const raw = r as unknown as Record<string, unknown>;
  const v = raw['like_count'] ?? raw['likes_count'] ?? raw['total_likes'] ?? raw['likes'];
  const n = Array.isArray(v) ? v.length : Number(v);
  const count = Number.isFinite(n) ? n : 0;
  // Kalau sudah di-like pengguna ini, jumlahnya minimal 1.
  return r.is_liked ? Math.max(count, 1) : count;
}

function toReport(r: ApiReport): Report {
  return {
    uuid: r.uuid, id: r.ticket_no, title: r.title || r.category?.name || 'Laporan kerusakan', building: r.building?.name ?? '', floor: r.floor, room: r.room_name,
    category: r.category?.name ?? '', description: r.description, photoUrl: reportPhoto(r),
    status: toStatus(r.status), createdAt: r.created_at, likes: likeCount(r), liked: !!r.is_liked,
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

  // Server bisa menjawab { data: [...] } atau berhalaman { data: { data: [...] } } (juga items/results).
  // Apa pun bentuknya, kembalikan larik; bentuk tak dikenal = larik kosong.
  private asList<T>(res: { data?: unknown }): T[] {
    const d = res?.data as unknown;
    if (Array.isArray(d)) return d as T[];
    const inner = d as Record<string, unknown> | null;
    for (const key of ['data', 'items', 'results', 'reports', 'rows']) {
      if (Array.isArray(inner?.[key])) return inner![key] as T[];
    }
    return [];
  }

  private async fetchAll(): Promise<void> {
    // Tiap permintaan berdiri sendiri: satu yang gagal tidak membatalkan login
    const get = <T>(url: string) => firstValueFrom(this.http.get<{ data?: unknown }>(url)).then((r) => this.asList<T>(r)).catch(() => [] as T[]);
    const [buildings, categories, mine, all] = await Promise.all([
      get<Item>('/api/locations'),
      get<Item>('/api/damage-categories'),
      allPages<ApiReport>(this.http, '/api/reports/my-reports').catch(() => [] as ApiReport[]),
      allPages<ApiReport>(this.http, '/api/reports/public').catch(() => [] as ApiReport[]),
    ]);
    this._buildings.set(buildings.filter((b) => !isTestBuilding(b.name)));
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
    // Daftar gedung/kategori bisa belum termuat; muat ulang dulu supaya uuid tidak kosong (penyebab 422).
    if (!this._buildings().length || !this._categories().length) await this.fetchAll();
    const buildingUuid = this._buildings().find((b) => b.name === data.building)?.uuid;
    const categoryUuid = this.categoryUuidFor(data.title);
    if (!buildingUuid) throw new Error('Gedung tidak dikenali. Muat ulang halaman lalu pilih gedung lagi.');
    if (!categoryUuid) throw new Error('Kategori kerusakan belum tersedia. Muat ulang halaman lalu coba lagi.');

    form.append('title', data.title.trim());
    form.append('building_uuid', buildingUuid);
    form.append('category_uuid', categoryUuid);
    // Lantai opsional: jangan kirim string kosong karena backend menolaknya dengan 422.
    // Spec backend: floor berupa angka dalam teks (contoh "3"), bukan "Lantai 3".
    const floorNo = data.floor.match(/\d+/)?.[0];
    if (floorNo) form.append('floor', floorNo);
    form.append('nama_kerusakan', data.title.trim());
    form.append('room_name', data.room.trim());
    form.append('description', data.description.trim());
    const small = await shrinkPhoto(photo);
    form.append('photo', small, small.name);
    const res = await firstValueFrom(this.http.post<{ data: ApiReport }>('/api/reports', form));
    await this.loadAll(true);
    return toReport(res.data);
  }

  // Menghapus laporan sendiri (DELETE /api/reports)
  async remove(r: Report): Promise<void> {
    await firstValueFrom(this.http.delete('/api/reports', { params: { uuid: r.uuid } }));
    await this.loadAll(true);
  }

  // Like / batal like. Satu pengguna maksimal satu like per laporan.
  // Laporan Selesai tidak bisa di-like (ditolak backend).
  async toggleLike(id: string): Promise<void> {
    const target = this._publicReports().find((r) => r.id === id);
    if (!target) return;
    // Tampilkan perubahan langsung, lalu samakan dengan data backend.
    const flip = (r: Report): Report => (r.id === id
      ? { ...r, liked: !r.liked, likes: Math.max(0, r.likes + (r.liked ? -1 : 1)) }
      : r);
    const before = { mine: this._reports(), all: this._publicReports() };
    this._reports.update((l) => l.map(flip));
    this._publicReports.update((l) => l.map(flip));
    try {
      await firstValueFrom(this.http.post('/api/reports/like', {}, { params: { uuid: target.uuid } }));
    } catch (err) {
      this._reports.set(before.mine);
      this._publicReports.set(before.all);
      throw err;
    }
    await this.loadAll(true);
  }
}
