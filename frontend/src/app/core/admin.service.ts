import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';
import { Report } from './report.model';

/*
  SERVICE PETUGAS (Admin Unit dan Admin Universitas)
  Data laporan dan gedung diambil dari backend. Backend BELUM punya: penugasan teknisi,
  kode/fakultas gedung, tambah-ubah gedung, dan manajemen akun. Bagian itu disimpan di memori
  (hilang saat refresh) sebagai prototipe sampai endpoint-nya ada. Lihat DESIGN.md bagian 11.
*/

export type AdminStatus = 'dikirim' | 'ditugaskan' | 'diproses' | 'menunggu' | 'selesai' | 'gagal';
// Urutan tampil di "Status penanganan" dan filter status
export const ADMIN_STATUSES: AdminStatus[] = ['dikirim', 'ditugaskan', 'diproses', 'menunggu', 'selesai', 'gagal'];

export type AdminReport = Omit<Report, 'status'> & { status: AdminStatus; priority: string; backendStatus: string };
export interface Assignment { tech: string; note: string; at: string; by: string }
export interface Technician { name: string; skills: string[]; active: number }
export interface Building { id: string; name: string; code: string; scope: string; floors: number; active: boolean }
export interface Account { id: string; name: string; email: string; role: string; scope: string; active: boolean }

export const ACCOUNT_ROLES = ['Pelapor', 'Teknisi', 'Admin Unit', 'Admin Universitas'];
export const SCOPES = ['FTI UII', 'Universitas'];
export const PRIORITY_LABEL: Record<string, string> = { TINGGI: 'Tinggi', NORMAL: 'Normal', RENDAH: 'Rendah' };

interface ApiReport {
  uuid: string; ticket_no: string; title: string; floor: string; room_name: string; description: string;
  photo_url: string; status: string; priority: string; created_at: string; like_count: number; is_liked: boolean;
  building: { name: string }; category: { name: string };
}

function toAdminStatus(status: string, assigned: boolean): AdminStatus {
  if (status === 'DIPROSES') return 'diproses';
  if (status === 'MENUNGGU') return 'menunggu';
  if (status === 'SELESAI') return 'selesai';
  if (status === 'TIDAK_DAPAT_DIPERBAIKI') return 'gagal';
  return assigned ? 'ditugaskan' : 'dikirim';
}

// Kode gedung dari huruf awal kata, contoh "KH Mas Mansur" -> "KMM"
const codeOf = (name: string) =>
  name.replace(/\(.*\)/, '').split(/\s+/).filter((w) => w && !/^(gedung|dr\.?)$/i.test(w)).map((w) => w[0].toUpperCase()).join('').slice(0, 4);

@Injectable({ providedIn: 'root' })
export class AdminService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  private raw = signal<ApiReport[]>([]);
  readonly assignments = signal<Record<string, Assignment>>({});

  // Teknisi contoh (belum ada di backend)
  readonly technicians: Technician[] = [
    { name: 'Budi Santoso', skills: ['AC & Pendingin', 'Proyektor', 'Lift'], active: 2 },
    { name: 'Dimas Pratama', skills: ['Lampu', 'Sound System'], active: 3 },
    { name: 'Rina Handayani', skills: ['Kursi & Meja', 'Lainnya'], active: 1 },
  ];

  readonly buildings = signal<Building[]>([]);
  readonly accounts = signal<Account[]>([
    { id: 'a1', name: 'Aisyah Rahmawati', email: 'aisyah@students.uii.ac.id', role: 'Pelapor', scope: 'FTI UII', active: true },
    { id: 'a2', name: 'Budi Santoso', email: 'budi@uii.ac.id', role: 'Teknisi', scope: 'KH Mas Mansur', active: true },
    { id: 'a3', name: 'Ahmad Fauzi', email: 'ahmad@uii.ac.id', role: 'Admin Unit', scope: 'FTI UII', active: true },
  ]);

  // Laporan dengan status petugas. Berubah otomatis saat ada penugasan baru.
  readonly reports = computed<AdminReport[]>(() => {
    const asg = this.assignments();
    return this.raw().map((r) => ({
      uuid: r.uuid, id: r.ticket_no, title: r.title, building: r.building?.name ?? '', floor: r.floor, room: r.room_name,
      category: r.category?.name ?? '', description: r.description, photoUrl: r.photo_url,
      status: toAdminStatus(r.status, !!asg[r.ticket_no]), createdAt: r.created_at, likes: r.like_count, liked: r.is_liked,
      priority: r.priority, backendStatus: r.status,
    }));
  });

  // Bulan yang dipilih di dashboard/statistik ("2026-11"). Kosong = bulan terbaru yang punya laporan.
  readonly monthPick = signal('');
  readonly months = computed(() => [...new Set(this.raw().map((r) => r.created_at.slice(0, 7)))].sort().reverse());
  readonly month = computed(() => this.monthPick() || this.months()[0] || '');
  readonly inMonth = computed(() => this.reports().filter((r) => r.createdAt.slice(0, 7) === this.month()));

  async load(): Promise<void> {
    const get = <T>(url: string) => firstValueFrom(this.http.get<{ data: T }>(url)).then((r) => r.data);
    const [reports, locations] = await Promise.all([get<ApiReport[]>('/api/reports'), get<{ uuid: string; name: string }[]>('/api/locations')]);
    this.raw.set(reports);
    this.buildings.set(locations.map((l) => ({ id: l.uuid, name: l.name, code: codeOf(l.name), scope: 'FTI UII', floors: 4, active: true })));
  }

  find(id: string): AdminReport | undefined {
    return this.reports().find((r) => r.id === id);
  }

  // Teknisi yang cocok dengan kategori laporan (keahlian sama) boleh dipilih
  skillMatch(t: Technician, category: string): boolean {
    return t.skills.includes(category);
  }

  assign(id: string, tech: string, note: string): void {
    this.assignments.update((a) => ({ ...a, [id]: { tech, note, at: new Date().toISOString(), by: this.auth.user().name } }));
  }

  // Pembuatan dan pengubahan gedung / akun (memori saja)
  saveBuilding(b: Omit<Building, 'id' | 'active'> & { id?: string }): void {
    if (b.id) this.buildings.update((l) => l.map((x) => (x.id === b.id ? { ...x, ...b } : x)));
    else this.buildings.update((l) => [...l, { ...b, id: 'b' + Date.now(), active: true }]);
  }
  setBuildingActive(id: string, active: boolean): void {
    this.buildings.update((l) => l.map((x) => (x.id === id ? { ...x, active } : x)));
  }
  saveAccount(a: Omit<Account, 'id' | 'active'> & { id?: string }): void {
    if (a.id) this.accounts.update((l) => l.map((x) => (x.id === a.id ? { ...x, ...a } : x)));
    else this.accounts.update((l) => [...l, { ...a, id: 'a' + Date.now(), active: true }]);
  }
  setAccountActive(id: string, active: boolean): void {
    this.accounts.update((l) => l.map((x) => (x.id === id ? { ...x, active } : x)));
  }
}

// "2026-11" -> "November 2026"
export const monthLabel = (m: string) =>
  m ? new Date(m + '-01T00:00:00').toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }) : '';
