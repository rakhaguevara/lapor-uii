/* eslint-disable @typescript-eslint/no-explicit-any */
import { HttpErrorResponse, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { delay, of, throwError } from 'rxjs';

/*
  MODE DEMO: backend palsu di dalam browser, supaya seluruh alur aplikasi bisa dilihat tanpa server.
  Aktif bila DEMO = true. Semua permintaan ke /api dijawab dari data di memori (hilang saat refresh).
  Matikan dengan DEMO = false; frontend lalu memakai backend asli lewat proxy.

  Akun demo (kata sandi di kolom kedua):
    aisyah@uii.ac.id     password123  Pelapor
    budi@uii.ac.id       teknisi123   Teknisi
    admin@uii.ac.id      admin123     Admin Unit
    adminuniv@uii.ac.id  univ12345    Admin Universitas
*/
export const DEMO = true;

const ok = (data: unknown, status = 200) => ({ status, msg: 'OK', data });
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-');

// ---------- Data awal ----------
const buildings: any[] = [
  ['Gedung KH Mas Mansur', 'KMM', 'Fakultas Teknologi Industri', 4], ['Gedung KH Wahid Hasyim', 'KWH', 'Fakultas Teknologi Industri', 4],
  ['Gedung Moh. Hatta (Perpustakaan Pusat)', 'MH', 'Universitas', 5], ['Gedung Kuliah Umum Prof. Sardjito', 'GKU', 'Universitas', 3],
].map(([name, code, faculty, floor_count]) => ({ uuid: 'b-' + slug(name as string), name, code, faculty, floor_count, type: 'BUILDING', is_active: true }));

const categories = ['AC & Pendingin', 'Proyektor', 'Kursi & Meja', 'Lampu', 'Sound System', 'Lift', 'Lainnya'].map((name) => ({ uuid: 'c-' + slug(name), name }));

const bm = (i: number) => buildings[i].uuid;
const users: any[] = [
  { uuid: 'u-aisyah', full_name: 'Aisyah Rahmawati', email: 'aisyah@uii.ac.id', password: 'password123', role: 'PELAPOR', reporter_type: 'MAHASISWA', is_active: true, building_uuids: [] },
  { uuid: 'u-dina', full_name: 'Dina Putri', email: 'dina@students.uii.ac.id', password: 'password123', role: 'PELAPOR', reporter_type: 'MAHASISWA', is_active: true, building_uuids: [] },
  { uuid: 'u-budi', full_name: 'Budi Santoso', email: 'budi@uii.ac.id', password: 'teknisi123', role: 'TEKNISI', reporter_type: null, is_active: true, building_uuids: [bm(0)] },
  { uuid: 'u-dimas', full_name: 'Dimas Pratama', email: 'dimas@uii.ac.id', password: 'teknisi123', role: 'TEKNISI', reporter_type: null, is_active: true, building_uuids: [bm(0), bm(1)] },
  { uuid: 'u-rina', full_name: 'Rina Handayani', email: 'rina@uii.ac.id', password: 'teknisi123', role: 'TEKNISI', reporter_type: null, is_active: true, building_uuids: [bm(1)] },
  { uuid: 'u-fauzi', full_name: 'Ahmad Fauzi', email: 'admin@uii.ac.id', password: 'admin123', role: 'ADMIN_UNIT', reporter_type: null, is_active: true, building_uuids: [bm(0), bm(1)] },
  { uuid: 'u-univ', full_name: 'Admin UII', email: 'adminuniv@uii.ac.id', password: 'univ12345', role: 'ADMIN_UNIV', reporter_type: null, is_active: true, building_uuids: [] },
];

// [judul, lantai, ruang, kategori, gedung, status, tanggal, suka, teknisi, pelapor, deskripsi]
const seed: any[][] = [
  ['AC tidak dingin', 'Lantai 3', 'Ruang 3.12', 'AC & Pendingin', 0, 'DITERIMA', '2026-11-18T09:41', 10, null, 'u-aisyah', 'AC menyala tetapi tidak mengeluarkan udara dingin sejak pagi. Perkuliahan di ruang 3.12 terasa tidak nyaman.'],
  ['Proyektor buram', 'Lantai 2', 'Ruang 2.05', 'Proyektor', 1, 'DITERIMA', '2026-11-18T07:55', 4, null, 'u-dina', 'Gambar proyektor buram dan sulit dibaca dari barisan belakang.'],
  ['Kursi patah', 'Lantai 1', 'Ruang 1.02', 'Kursi & Meja', 0, 'DITERIMA', '2026-11-17T13:20', 2, null, 'u-aisyah', 'Dua kursi di barisan depan patah dan berbahaya diduduki.'],
  ['Mic aula mati', 'Lantai 1', 'Aula', 'Sound System', 3, 'DITERIMA', '2026-11-17T10:05', 6, null, 'u-dina', 'Mikrofon utama aula tidak mengeluarkan suara.'],
  ['Lift macet', 'Lantai 1', 'Lobi', 'Lift', 2, 'DITERIMA', '2026-11-16T16:40', 9, null, 'u-aisyah', 'Lift berhenti di antara lantai 2 dan 3.'],
  ['Lampu koridor mati', 'Lantai 1', 'Koridor', 'Lampu', 0, 'DITUGASKAN', '2026-11-16T08:15', 5, 'u-budi', 'u-aisyah', 'Lampu di koridor lantai 1 mati sehingga area gelap.'],
  ['Stopkontak longgar', 'Lantai 1', 'Koridor', 'Lainnya', 0, 'DIPROSES', '2026-11-12T11:10', 15, 'u-budi', 'u-aisyah', 'Stopkontak di koridor longgar dan sering memercik.'],
  ['Keran wastafel bocor', 'Lantai 2', 'Toilet', 'Lainnya', 0, 'SELESAI', '2026-11-14T10:30', 3, 'u-budi', 'u-aisyah', 'Keran wastafel bocor terus menerus.'],
  ['AC berisik', 'Lantai 2', 'Ruang 2.10', 'AC & Pendingin', 1, 'MENUNGGU', '2026-11-13T09:00', 7, 'u-rina', 'u-dina', 'AC mengeluarkan bunyi keras saat dinyalakan.'],
  ['Papan tulis lepas', 'Lantai 3', 'Ruang 3.01', 'Lainnya', 0, 'TIDAK_DAPAT_DIPERBAIKI', '2026-11-12T08:30', 1, 'u-dimas', 'u-dina', 'Papan tulis lepas dari dinding.'],
  ['Lampu ruang dosen kedip', 'Lantai 2', 'Ruang dosen', 'Lampu', 1, 'DIPROSES', '2026-11-15T14:00', 2, 'u-dimas', 'u-aisyah', 'Lampu berkedip terus.'],
  ['Proyektor tidak menyala', 'Lantai 3', 'Ruang 3.08', 'Proyektor', 0, 'SELESAI', '2026-11-15T09:30', 4, 'u-budi', 'u-dina', 'Proyektor tidak mau menyala sama sekali.'],
];

const reports: any[] = seed.map((s, i) => ({
  uuid: 'r-' + (140 + i), ticket_no: 'LP-0' + (146 - i), title: s[0], floor: s[1], room_name: s[2], category_uuid: 'c-' + slug(s[3]),
  building_uuid: bm(s[4]), status: s[5], created_at: s[6] + ':00+07:00', likes: Array.from({ length: s[7] }, (_, k) => 'x' + k), technician_uuid: s[8],
  reporter_uuid: s[10 - 1], description: s[10], priority: 'NORMAL', photo_url: '/samples/ac-ruang-312.jpg', assigned_at: s[8] ? s[6] + ':00+07:00' : '',
}));
let nextTicket = 147;

// ---------- Bentuk jawaban ----------
const person = (uuid: string | null) => { const u = users.find((x) => x.uuid === uuid); return u ? { uuid: u.uuid, full_name: u.full_name } : null; };
const shape = (r: any, me: any) => ({
  uuid: r.uuid, ticket_no: r.ticket_no, title: r.title, floor: r.floor, room_name: r.room_name, description: r.description,
  photo_url: r.photo_url, status: r.status, priority: r.priority, created_at: r.created_at, like_count: r.likes.length, is_liked: r.likes.includes(me?.uuid),
  building: { uuid: r.building_uuid, name: buildings.find((b) => b.uuid === r.building_uuid)?.name },
  category: categories.find((c) => c.uuid === r.category_uuid), technician: person(r.technician_uuid), assigned_at: r.assigned_at,
});
const userShape = (u: any) => ({
  uuid: u.uuid, full_name: u.full_name, email: u.email, role: u.role, reporter_type: u.reporter_type, is_active: u.is_active,
  buildings: u.building_uuids.map((id: string) => ({ uuid: id, name: buildings.find((b) => b.uuid === id)?.name })),
});
const byDate = (a: any, b: any) => b.created_at.localeCompare(a.created_at);

// ---------- Penyambung ----------
export const mockInterceptor: HttpInterceptorFn = (req, next) => {
  if (!DEMO || !req.url.startsWith('/api/')) return next(req);

  const path = req.url.slice(4);
  const m = req.method;
  const q = (k: string) => req.params.get(k) ?? '';
  const body: any = req.body instanceof FormData ? Object.fromEntries((req.body as any).entries()) : (req.body ?? {});
  const me = users.find((u) => 'demo-' + u.uuid === (req.headers.get('Authorization') ?? '').replace('Bearer ', ''));
  const fail = (status: number, msg: string) => throwError(() => new HttpErrorResponse({ status, error: { status, msg } }));
  const reply = (data: unknown, status = 200) => of(new HttpResponse({ status, body: ok(data, status) })).pipe(delay(150));
  const report = () => reports.find((r) => r.uuid === q('uuid') || r.ticket_no === q('ticket_no'));
  const isPlain = (r: any) => (r.technician_uuid ? false : r.status === 'DITERIMA');

  if (path === '/auth/login' && m === 'POST') {
    const u = users.find((x) => x.email === body.email && x.password === body.password && x.is_active);
    return u ? reply({ token: 'demo-' + u.uuid, user: userShape(u) }) : fail(401, 'Email atau kata sandi salah');
  }
  if (!me) return fail(401, 'Tidak terotentikasi');
  if (path === '/auth/logout') return reply(null);
  if (path === '/auth/me') return reply(userShape(me));

  // Gedung dan kategori
  if (path === '/damage-categories') return reply(categories);
  if (path === '/locations' && m === 'GET') return reply(buildings);
  if (path === '/locations' && m === 'POST') { const b = { uuid: 'b-' + Date.now(), is_active: true, type: 'BUILDING', ...body }; buildings.push(b); return reply(b, 201); }
  if (path === '/locations' && m === 'PUT') { const b = buildings.find((x) => x.uuid === q('uuid')); Object.assign(b, body); return reply(b); }
  if (path === '/locations' && m === 'DELETE') { const b = buildings.find((x) => x.uuid === q('uuid')); if (b) b.is_active = false; return reply(b); }

  // Laporan (baca)
  if (path === '/reports' && m === 'GET') return reply(reports.slice().sort(byDate).map((r) => shape(r, me)));
  if (path === '/reports/my-reports') return reply(reports.filter((r) => r.reporter_uuid === me.uuid).sort(byDate).map((r) => shape(r, me)));
  if (path === '/reports/public') return reply(reports.slice().sort(byDate).map((r) => shape(r, me)));
  if (path === '/reports/detail') { const r = report(); return r ? reply(shape(r, me)) : fail(404, 'Laporan tidak ditemukan'); }

  // Pelapor
  if (path === '/reports' && m === 'POST') {
    const photo = body.photo instanceof File ? URL.createObjectURL(body.photo) : '/samples/ac-ruang-312.jpg';
    const r = { uuid: 'r-' + Date.now(), ticket_no: 'LP-0' + nextTicket++, title: body.title, floor: body.floor ?? '', room_name: body.room_name, category_uuid: body.category_uuid,
      building_uuid: body.building_uuid, status: 'DITERIMA', created_at: new Date().toISOString(), likes: [], technician_uuid: null, reporter_uuid: me.uuid,
      description: body.description, priority: 'NORMAL', photo_url: photo, assigned_at: '' };
    reports.unshift(r);
    return reply(shape(r, me), 201);
  }
  if (path === '/reports/like') {
    const r = report(); if (!r) return fail(404, 'Laporan tidak ditemukan');
    if (r.status === 'SELESAI') return fail(400, 'Laporan selesai tidak bisa di-like');
    r.likes = r.likes.includes(me.uuid) ? r.likes.filter((x: string) => x !== me.uuid) : [...r.likes, me.uuid];
    return reply(shape(r, me));
  }

  // Admin Unit
  if (path === '/reports/technicians') {
    const b = q('building_uuid');
    return reply(users.filter((u) => u.role === 'TEKNISI' && u.is_active && (!b || u.building_uuids.includes(b))).map((u) => ({
      uuid: u.uuid, full_name: u.full_name, active_tasks_count: reports.filter((r) => r.technician_uuid === u.uuid && !['SELESAI', 'TIDAK_DAPAT_DIPERBAIKI'].includes(r.status)).length,
      buildings: u.building_uuids.map((id: string) => ({ name: buildings.find((x) => x.uuid === id)?.name })),
    })));
  }
  if (path === '/reports/assign') { const r = report(); r.technician_uuid = body.technician_uuid; r.status = 'DITUGASKAN'; r.assigned_at = new Date().toISOString(); return reply(shape(r, me)); }
  if (path === '/reports/priority') { const r = report(); r.priority = body.priority; return reply(shape(r, me)); }

  // Teknisi
  if (path === '/reports/tasks') {
    const tab = q('tab');
    const own = reports.filter((r) => r.technician_uuid === me.uuid);
    const free = reports.filter((r) => isPlain(r) && me.building_uuids.includes(r.building_uuid));
    return reply((tab === 'mine' ? own : tab === 'available' ? free : [...free, ...own]).sort(byDate).map((r) => shape(r, me)));
  }
  if (path === '/reports/self-assign') {
    const r = report();
    if (!r || !isPlain(r)) return fail(409, 'Tugas sudah diambil teknisi lain');
    r.technician_uuid = me.uuid; r.status = 'DITUGASKAN'; r.assigned_at = new Date().toISOString();
    return reply(shape(r, me));
  }
  if (path === '/reports/respond-assignment') {
    const r = report();
    if (body.action === 'REJECT') { r.technician_uuid = null; r.status = 'DITERIMA'; r.assigned_at = ''; }
    return reply(shape(r, me));
  }
  if (path === '/reports/status') {
    const r = report();
    r.status = body.status;
    if (body.proof_photo instanceof File) r.proof_url = URL.createObjectURL(body.proof_photo);
    return reply(shape(r, me));
  }

  // Admin Universitas: akun staf
  if (path === '/admin/users' && m === 'GET') return reply(users.filter((u) => u.role !== 'PELAPOR').map(userShape));
  if (path === '/admin/users' && m === 'POST') {
    const u = { uuid: 'u-' + Date.now(), reporter_type: null, is_active: true, password: body.password, ...body, building_uuids: body.building_uuids ?? [] };
    users.push(u);
    return reply(userShape(u), 201);
  }
  if (path === '/admin/users' && m === 'PUT') { const u = users.find((x) => x.uuid === q('uuid')); Object.assign(u, body, body.password ? {} : { password: u.password }); return reply(userShape(u)); }
  if (path === '/admin/users/toggle-status') { const u = users.find((x) => x.uuid === q('uuid')); u.is_active = !u.is_active; return reply(userShape(u)); }

  return fail(404, 'Endpoint demo belum tersedia: ' + m + ' ' + path);
};
