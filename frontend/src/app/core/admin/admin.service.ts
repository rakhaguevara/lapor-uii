import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Report, isTestBuilding } from '../reports/report.model';
import { allPages } from '../http/all-pages';
import { reportPhoto } from '../reports/photo-url';
import { likeCount } from '../reports/report.service';

/*
  SERVICE PETUGAS (Admin Unit dan Admin Universitas)
  Memanggil endpoint kontrak API referensi (backend-sira, /api/documentation):
    GET/POST/PUT/DELETE /locations           gedung
    GET/POST/PUT /admin/users, POST /admin/users/toggle-status     akun staf
    GET /reports, GET /reports/technicians, POST /reports/assign, POST /reports/priority
  Bentuk jawaban TIDAK dijelaskan di dokumentasi, jadi pemetaan di bawah sengaja longgar
  (menerima beberapa nama kolom). Periksa lagi bila backend asli sudah tersedia.
*/

export type AdminStatus = 'dikirim' | 'ditugaskan' | 'diproses' | 'menunggu' | 'selesai' | 'gagal';
// Urutan tampil di "Status penanganan" dan filter status
export const ADMIN_STATUSES: AdminStatus[] = ['dikirim', 'ditugaskan', 'diproses', 'menunggu', 'selesai', 'gagal'];

export type AdminReport = Omit<Report, 'status'> & {
  status: AdminStatus; priority: string; technician: string; technicianUuid: string; assignedAt: string; buildingUuid: string; updatedAt: string;
};
export interface Technician { uuid: string; name: string; active: number; buildings: string[] }
export interface Building { id: string; name: string; code: string; faculty: string; floors: number; active: boolean }
export interface Account { id: string; name: string; email: string; role: string; buildingIds: string[]; buildings: string; active: boolean }

export const PRIORITY_LABEL: Record<string, string> = { URGEN: 'Urgen', TINGGI: 'Tinggi', NORMAL: 'Normal', RENDAH: 'Rendah' };
// Peran yang boleh dibuat lewat POST /admin/users (kode backend -> nama tampil)
export const STAFF_ROLES: Record<string, string> = { TEKNISI: 'Teknisi', ADMIN_UNIT: 'Admin Unit', ADMIN_UNIV: 'Admin Universitas' };

// Bentuk mentah dari backend (semua kolom dibuat opsional karena jawabannya tidak terdokumentasi)
/* eslint-disable @typescript-eslint/no-explicit-any */
type Raw = Record<string, any>;

// Jawaban bisa berupa larik, atau objek berhalaman { data: [...] }
export function rows(res: unknown): Raw[] {
  const d = (res as Raw)?.['data'];
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.data)) return d.data;
  return [];
}

// Tanggal lokal "2026-11-18" dari waktu ISO. Memotong teks mentah salah bulan/hari bila server memakai UTC
// (laporan jam 02.00 WIB di server tercatat tanggal sebelumnya).
export function localDay(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('sv-SE');
}

function toAdminStatus(status: string, hasTech: boolean): AdminStatus {
  switch (status) {
    case 'DITUGASKAN': return 'ditugaskan';
    case 'DIPROSES': return 'diproses';
    case 'MENUNGGU': return 'menunggu';
    case 'SELESAI': return 'selesai';
    case 'TIDAK_DAPAT_DIPERBAIKI': return 'gagal';
    default: return hasTech ? 'ditugaskan' : 'dikirim';
  }
}

// Satu laporan dari backend -> bentuk yang dipakai tampilan
export function toAdminReport(r: Raw): AdminReport {
  const t = r['technician'] ?? r['assigned_technician'] ?? r['assignment']?.technician ?? null;
  const name: string = t?.full_name ?? t?.name ?? r['technician_name'] ?? '';
  return {
    uuid: r['uuid'], id: r['ticket_no'], title: r['title'] || r['category']?.name || 'Laporan kerusakan', building: r['building']?.name ?? '', buildingUuid: r['building']?.uuid ?? '',
    floor: r['floor'] ?? '', room: r['room_name'] ?? '', category: r['category']?.name ?? '', description: r['description'] ?? '',
    photoUrl: reportPhoto(r), status: toAdminStatus(r['status'], !!name), createdAt: r['created_at'],
    likes: likeCount(r), liked: !!r['is_liked'], priority: r['priority'] ?? 'NORMAL',
    technician: name, technicianUuid: t?.uuid ?? r['technician_uuid'] ?? '', assignedAt: r['assigned_at'] ?? r['assignment']?.assigned_at ?? '',
    updatedAt: r['completed_at'] ?? r['updated_at'] ?? '',
  };
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private http = inject(HttpClient);

  private get = (url: string, params: Record<string, string> = {}) => firstValueFrom(this.http.get<unknown>(url, { params }));

  readonly reports = signal<AdminReport[]>([]);
  readonly buildings = signal<Building[]>([]);
  readonly accounts = signal<Account[]>([]);

  // Filter status dipakai bersama halaman Gedung dan Akun pengguna, supaya keduanya selalu menampilkan keadaan yang sama
  readonly statusDraft = signal(''); // isian di layar
  readonly statusFilter = signal(''); // yang dipakai daftar (berlaku setelah Cari)

  // false selama pemuatan pertama tiap bagian; dipakai halaman untuk kerangka pemuatan
  readonly reportsLoaded = signal(false);
  readonly buildingsLoaded = signal(false);
  readonly accountsLoaded = signal(false);

  // Bulan yang dipilih di dashboard/statistik ("2026-11"). Kosong = SEMUA bulan, jadi total sama dengan jumlah laporan sebenarnya.
  readonly monthPick = signal('');
  readonly months = computed(() => [...new Set(this.reports().map((r) => localDay(r.createdAt).slice(0, 7)).filter(Boolean))].sort().reverse());
  readonly month = computed(() => (this.months().includes(this.monthPick()) ? this.monthPick() : ''));
  readonly inMonth = computed(() => (this.month() ? this.reports().filter((r) => localDay(r.createdAt).slice(0, 7) === this.month()) : this.reports()));

  // ---------- Muat data ----------
  async loadReports(): Promise<void> {
    try {
      this.reports.set((await allPages(this.http, '/api/reports', { per_page: '100' })).map(toAdminReport));
    } finally {
      this.reportsLoaded.set(true);
    }
  }

  async loadBuildings(): Promise<void> {
    try {
      this.buildings.set(rows(await this.get('/api/locations')).filter((l) => !isTestBuilding(l['name'])).map((l) => ({
        id: l['uuid'], name: l['name'], code: l['code'] ?? '', faculty: l['faculty'] ?? '', floors: l['floor_count'] ?? 0, active: l['is_active'] !== false,
      })));
    } finally {
      this.buildingsLoaded.set(true);
    }
  }

  async loadAccounts(): Promise<void> {
    try {
      this.accounts.set((await allPages(this.http, '/api/admin/users')).map((u) => {
        const bs: Raw[] = u['buildings'] ?? u['building_scopes'] ?? u['scopes'] ?? [];
        return {
          id: u['uuid'], name: u['full_name'], email: u['email'], role: u['role'], active: u['is_active'] !== false,
          buildingIds: bs.map((b) => b['uuid'] ?? b['building_uuid']), buildings: bs.map((b) => b['name'] ?? b['building']?.name ?? '').filter(Boolean).join(', '),
        };
      }));
    } finally {
      this.accountsLoaded.set(true);
    }
  }

  // Data awal setelah login (tiap peran butuh hal berbeda)
  async load(role: string): Promise<void> {
    if (role === 'ADMIN_UNIT') { this.reportsLoaded.set(false); this.buildingsLoaded.set(false); }
    if (role === 'ADMIN_UNIV') { this.buildingsLoaded.set(false); this.accountsLoaded.set(false); }
    if (role === 'ADMIN_UNIT') await Promise.all([this.loadReports(), this.loadBuildings()]);
    if (role === 'ADMIN_UNIV') await Promise.all([this.loadBuildings(), this.loadAccounts()]);
  }

  find(id: string): AdminReport | undefined {
    return this.reports().find((r) => r.id === id);
  }

  // ---------- Laporan ----------
  async technicians(buildingUuid: string): Promise<Technician[]> {
    const res = await this.get('/api/reports/technicians', buildingUuid ? { building_uuid: buildingUuid } : {});
    return rows(res).map((t) => ({
      uuid: t['uuid'], name: t['full_name'] ?? t['name'] ?? '', active: t['active_tasks_count'] ?? t['active_tasks'] ?? t['active_task_count'] ?? 0,
      buildings: (t['buildings'] ?? []).map((b: Raw) => b['name']),
    }));
  }

  // Mengembalikan kode HTTP dan pesan dari backend, untuk ditampilkan di kartu hasil
  async assign(reportUuid: string, technicianUuid: string): Promise<{ status: number; message: string }> {
    const res = await firstValueFrom(this.http.post<{ msg?: string }>('/api/reports/assign', { technician_uuid: technicianUuid }, { params: { uuid: reportUuid }, observe: 'response' }));
    await this.loadReports().catch(() => {}); // penugasan sudah tersimpan; gagal memuat ulang tidak boleh dilaporkan sebagai gagal menugaskan
    return { status: res.status, message: res.body?.msg ?? '' };
  }

  async setPriority(reportUuid: string, priority: string): Promise<void> {
    await firstValueFrom(this.http.post('/api/reports/priority', { priority }, { params: { uuid: reportUuid } }));
    await this.loadReports().catch(() => {});
  }

  // ---------- Gedung ----------
  async saveBuilding(b: { id?: string; name: string; code: string; faculty: string; floors: number }): Promise<void> {
    const body = { name: b.name, code: b.code, faculty: b.faculty, floor_count: b.floors };
    await firstValueFrom(b.id ? this.http.put('/api/locations', body, { params: { uuid: b.id } }) : this.http.post('/api/locations', { ...body, type: 'BUILDING' }));
    await this.loadBuildings();
  }

  // Aktif/nonaktif hanya mengubah status lewat PUT is_active (bukan DELETE, supaya data gedung tidak hilang dari daftar)
  async setBuildingActive(b: Building, active: boolean): Promise<void> {
    await firstValueFrom(this.http.put('/api/locations', { name: b.name, code: b.code, faculty: b.faculty, floor_count: b.floors, is_active: active }, { params: { uuid: b.id } }));
    await this.loadBuildings();
    // Jaga-jaga bila backend menyembunyikan gedung nonaktif dari daftar: tetap tampilkan dengan status yang baru
    const cur = this.buildings();
    this.buildings.set(cur.some((x) => x.id === b.id) ? cur.map((x) => (x.id === b.id ? { ...x, active } : x)) : [...cur, { ...b, active }]);
    await this.loadAccounts().catch(() => {}); // cakupan gedung di daftar akun ikut diperbarui
  }

  // ---------- Akun ----------
  async saveAccount(a: { id?: string; name: string; email: string; role: string; password: string; buildingIds: string[] }): Promise<void> {
    const body: Raw = { full_name: a.name, email: a.email, role: a.role, building_uuids: a.buildingIds };
    if (a.password) body['password'] = a.password;
    await firstValueFrom(a.id ? this.http.put('/api/admin/users', body, { params: { uuid: a.id } }) : this.http.post('/api/admin/users', body));
    await this.loadAccounts();
  }

  async toggleAccount(id: string): Promise<void> {
    await firstValueFrom(this.http.post('/api/admin/users/toggle-status', {}, { params: { uuid: id } }));
    await this.loadAccounts();
  }
}

// "2026-11" -> "November 2026"
export const monthLabel = (m: string) =>
  m ? new Date(m + '-01T00:00:00').toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }) : '';
