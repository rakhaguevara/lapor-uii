// Backend IM-Care (Express + Supabase). Mengikuti kontrak API referensi
// (https://backend-sira-production.up.railway.app/api/documentation):
// semua jawaban berbentuk { status, msg, data }, id lewat query (?uuid=...), login memakai Bearer token.
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

const PORT = process.env.PORT || 3000;
const SECRET = process.env.JWT_SECRET || 'rahasia-dev-ganti-di-produksi';
const ROLE_PETUGAS = ['TEKNISI', 'ADMIN_UNIT', 'ADMIN_UNIV'];

// Kunci service hanya dipakai di server ini, jangan pernah dikirim ke frontend
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const app = express();
app.use(cors());
app.use(express.json());

// Upload foto: hanya JPG/PNG, maksimal 5 MB, ditahan di memori lalu dikirim ke Supabase Storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, ['image/jpeg', 'image/png'].includes(file.mimetype)),
});

// ---------- Fungsi bantu ----------
const kirim = (res, status, msg, data) => res.status(status).json({ status, msg, data });

// Bungkus handler supaya error tak terduga menjadi jawaban 500, bukan server mati
const aman = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch((e) => kirim(res, 500, e.message));

// Wajib login: baca token dari header "Authorization: Bearer <token>"
const wajibLogin = aman(async (req, res, next) => {
  let uuid;
  try {
    uuid = jwt.verify((req.headers.authorization || '').replace('Bearer ', ''), SECRET).uuid;
  } catch {
    return kirim(res, 401, 'Tidak terotentikasi');
  }
  const { data: user } = await supabase.from('users').select('*').eq('uuid', uuid).maybeSingle();
  if (!user || !user.is_active) return kirim(res, 401, 'Tidak terotentikasi');
  req.user = user;
  next();
});

// Wajib salah satu peran tertentu
const wajibRole = (...roles) => (req, res, next) =>
  roles.includes(req.user.role) ? next() : kirim(res, 403, 'Tidak punya akses');

const dataUser = (u) => ({ uuid: u.uuid, full_name: u.full_name, email: u.email, role: u.role, reporter_type: u.reporter_type });

// Ambil laporan beserta gedung, kategori, dan daftar like-nya
const PILIH_LAPORAN = '*, building:locations(uuid,name), category:damage_categories(uuid,name), likes:report_likes(user_uuid)';

// Ubah satu baris laporan menjadi bentuk jawaban API
const dataLaporan = (r, user) => ({
  uuid: r.uuid, ticket_no: r.ticket_no, title: r.title, floor: r.floor, room_name: r.room_name,
  description: r.description, photo_url: r.photo_url, status: r.status, priority: r.priority,
  building: r.building, category: r.category,
  like_count: r.likes.length, is_liked: r.likes.some((l) => l.user_uuid === user.uuid), created_at: r.created_at,
});

// Daftar laporan dengan filter ?status= ?building_uuid= ?search=, terbaru dulu. `milik` = uuid pelapor (opsional).
async function cariLaporan(q, user, milik) {
  let query = supabase.from('reports').select(PILIH_LAPORAN).order('created_at', { ascending: false });
  if (milik) query = query.eq('reporter_uuid', milik);
  if (q.status) query = query.eq('status', q.status);
  if (q.building_uuid) query = query.eq('building_uuid', q.building_uuid);
  if (q.search) {
    const kata = q.search.replace(/[%,()]/g, '');
    query = query.or(`title.ilike.%${kata}%,ticket_no.ilike.%${kata}%`);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data.map((r) => dataLaporan(r, user));
}

// Cari satu laporan dari ?uuid= atau ?ticket_no=
async function ambilLaporan(q) {
  if (!q.uuid && !q.ticket_no) return null;
  const query = supabase.from('reports').select(PILIH_LAPORAN);
  const { data } = await (q.uuid ? query.eq('uuid', q.uuid) : query.eq('ticket_no', q.ticket_no)).maybeSingle();
  return data;
}

// ---------- Auth ----------
app.post('/api/auth/register', aman(async (req, res) => {
  const { full_name, email, password, reporter_type } = req.body;
  if (!full_name || !email || !password || !['MAHASISWA', 'DOSEN', 'STAF'].includes(reporter_type)) return kirim(res, 422, 'Data tidak lengkap');
  const { data, error } = await supabase.from('users')
    .insert({ full_name, email, password: bcrypt.hashSync(password, 10), role: 'PELAPOR', reporter_type })
    .select().single();
  if (error?.code === '23505') return kirim(res, 422, 'Email sudah terdaftar');
  if (error) throw error;
  kirim(res, 201, 'Registrasi berhasil', dataUser(data));
}));

app.post('/api/auth/login', aman(async (req, res) => {
  const { data: user } = await supabase.from('users').select('*').eq('email', req.body.email || '').maybeSingle();
  if (!user || !bcrypt.compareSync(req.body.password || '', user.password)) return kirim(res, 401, 'Email atau password salah');
  if (!user.is_active) return kirim(res, 403, 'Akun dinonaktifkan');
  const token = jwt.sign({ uuid: user.uuid }, SECRET, { expiresIn: '1d' });
  kirim(res, 200, 'Login berhasil', { token, user: dataUser(user) });
}));

app.get('/api/auth/me', wajibLogin, (req, res) => kirim(res, 200, 'OK', dataUser(req.user)));

// Token tidak disimpan di server, jadi logout cukup menghapus token di sisi frontend
app.post('/api/auth/logout', wajibLogin, (req, res) => kirim(res, 200, 'Logout berhasil'));

app.post('/api/auth/change-password', wajibLogin, aman(async (req, res) => {
  const { current_password, new_password } = req.body;
  if (!bcrypt.compareSync(current_password || '', req.user.password)) return kirim(res, 400, 'Password lama salah');
  if (!new_password || new_password.length < 6) return kirim(res, 422, 'Password baru minimal 6 karakter');
  await supabase.from('users').update({ password: bcrypt.hashSync(new_password, 10) }).eq('uuid', req.user.uuid);
  kirim(res, 200, 'Password diubah');
}));

// ---------- Gedung & kategori ----------
app.get('/api/locations', wajibLogin, aman(async (req, res) => {
  const { data } = await supabase.from('locations').select('uuid,name,type').eq('is_active', true).ilike('name', `%${req.query.search || ''}%`).order('name');
  kirim(res, 200, 'OK', data);
}));

app.get('/api/locations/detail', wajibLogin, aman(async (req, res) => {
  const { data } = await supabase.from('locations').select('uuid,name,type,is_active').eq('uuid', req.query.uuid || '').maybeSingle();
  data ? kirim(res, 200, 'OK', data) : kirim(res, 404, 'Lokasi tidak ditemukan');
}));

app.get('/api/damage-categories', wajibLogin, aman(async (req, res) => {
  const { data } = await supabase.from('damage_categories').select('uuid,name').order('name');
  kirim(res, 200, 'OK', data);
}));

// ---------- Laporan ----------
app.post('/api/reports', wajibLogin, upload.single('photo'), aman(async (req, res) => {
  const { building_uuid, room_name, category_uuid, description, title, floor } = req.body;
  if (!building_uuid || !room_name || !category_uuid || !description || !req.file) return kirim(res, 422, 'Data atau foto (JPG/PNG, maks 5 MB) tidak valid');

  // Simpan foto di Supabase Storage, lalu ambil alamat publiknya
  const namaFile = Date.now() + '-' + Math.random().toString(36).slice(2) + (req.file.mimetype === 'image/png' ? '.png' : '.jpg');
  const { error: errFoto } = await supabase.storage.from('reports').upload(namaFile, req.file.buffer, { contentType: req.file.mimetype });
  if (errFoto) throw errFoto;
  const photo_url = supabase.storage.from('reports').getPublicUrl(namaFile).data.publicUrl;

  const { data, error } = await supabase.from('reports')
    .insert({ title: title || description.slice(0, 40), building_uuid, floor: floor || '', room_name, category_uuid, description, photo_url, reporter_uuid: req.user.uuid })
    .select(PILIH_LAPORAN).single();
  if (error?.code === '23503') return kirim(res, 422, 'Gedung atau kategori tidak ditemukan');
  if (error) throw error;
  kirim(res, 201, 'Laporan terkirim', dataLaporan(data, req.user));
}));

// Semua laporan (hanya petugas)
app.get('/api/reports', wajibLogin, wajibRole(...ROLE_PETUGAS), aman(async (req, res) =>
  kirim(res, 200, 'OK', await cariLaporan(req.query, req.user))));

// Laporan milik sendiri
app.get('/api/reports/my-reports', wajibLogin, aman(async (req, res) =>
  kirim(res, 200, 'OK', await cariLaporan(req.query, req.user, req.user.uuid))));

// Laporan publik: tanpa nama pelapor
app.get('/api/reports/public', wajibLogin, aman(async (req, res) =>
  kirim(res, 200, 'OK', await cariLaporan(req.query, req.user))));

app.get('/api/reports/detail', wajibLogin, aman(async (req, res) => {
  const laporan = await ambilLaporan(req.query);
  laporan ? kirim(res, 200, 'OK', dataLaporan(laporan, req.user)) : kirim(res, 404, 'Laporan tidak ditemukan');
}));

// Like / batal like. Laporan selesai tidak bisa di-like.
app.post('/api/reports/like', wajibLogin, aman(async (req, res) => {
  const laporan = await ambilLaporan(req.query);
  if (!laporan) return kirim(res, 404, 'Laporan tidak ditemukan');
  if (laporan.status === 'SELESAI') return kirim(res, 400, 'Laporan selesai tidak bisa di-like');
  const kunci = { report_uuid: laporan.uuid, user_uuid: req.user.uuid };
  const sudahLike = laporan.likes.some((l) => l.user_uuid === req.user.uuid);
  await (sudahLike ? supabase.from('report_likes').delete().match(kunci) : supabase.from('report_likes').insert(kunci));
  kirim(res, 200, 'OK', dataLaporan(await ambilLaporan({ uuid: laporan.uuid }), req.user));
}));

// Ubah status (petugas)
app.post('/api/reports/status', wajibLogin, wajibRole(...ROLE_PETUGAS), upload.single('proof_photo'), aman(async (req, res) => {
  const laporan = await ambilLaporan(req.query);
  if (!laporan) return kirim(res, 404, 'Laporan tidak ditemukan');
  if (!['DIPROSES', 'MENUNGGU', 'TIDAK_DAPAT_DIPERBAIKI', 'SELESAI'].includes(req.body.status)) return kirim(res, 422, 'Status tidak valid');
  await supabase.from('reports').update({ status: req.body.status }).eq('uuid', laporan.uuid);
  kirim(res, 200, 'Status diubah', dataLaporan(await ambilLaporan({ uuid: laporan.uuid }), req.user));
}));

app.listen(PORT, () => console.log('Backend jalan di http://localhost:' + PORT));
