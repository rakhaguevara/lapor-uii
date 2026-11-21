// Backend IM-Care. Mengikuti kontrak API referensi (https://backend-sira-production.up.railway.app/api/documentation):
// semua jawaban berbentuk { status, msg, data }, id lewat query (?uuid=...), login memakai Bearer token.
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const { randomUUID } = require('crypto');
const { db, simpan } = require('./db');

const PORT = process.env.PORT || 3000;
const SECRET = process.env.JWT_SECRET || 'rahasia-dev-ganti-di-produksi';
const ROLE_PETUGAS = ['TEKNISI', 'ADMIN_UNIT', 'ADMIN_UNIV'];

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Upload foto: hanya JPG/PNG, maksimal 5 MB
const upload = multer({
  dest: path.join(__dirname, 'uploads'),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, ['image/jpeg', 'image/png'].includes(file.mimetype)),
});

// ---------- Fungsi bantu ----------
const kirim = (res, status, msg, data) => res.status(status).json({ status, msg, data });

// Wajib login: baca token dari header "Authorization: Bearer <token>"
function wajibLogin(req, res, next) {
  try {
    const token = (req.headers.authorization || '').replace('Bearer ', '');
    const user = db.users.find((u) => u.uuid === jwt.verify(token, SECRET).uuid);
    if (!user || !user.is_active) throw new Error();
    req.user = user;
    next();
  } catch {
    kirim(res, 401, 'Tidak terotentikasi');
  }
}

// Wajib salah satu peran tertentu
const wajibRole = (...roles) => (req, res, next) =>
  roles.includes(req.user.role) ? next() : kirim(res, 403, 'Tidak punya akses');

const dataUser = (u) => ({ uuid: u.uuid, full_name: u.full_name, email: u.email, role: u.role, reporter_type: u.reporter_type });

// Ubah data laporan di database menjadi bentuk jawaban API
function dataLaporan(r, user) {
  const gedung = db.locations.find((l) => l.uuid === r.building_uuid);
  const kategori = db.categories.find((c) => c.uuid === r.category_uuid);
  return {
    uuid: r.uuid, ticket_no: r.ticket_no, title: r.title, floor: r.floor, room_name: r.room_name,
    description: r.description, photo_url: r.photo_url, status: r.status, priority: r.priority,
    building: gedung && { uuid: gedung.uuid, name: gedung.name },
    category: kategori && { uuid: kategori.uuid, name: kategori.name },
    like_count: r.likes.length, is_liked: r.likes.includes(user.uuid), created_at: r.created_at,
  };
}

// Filter ?status= ?building_uuid= ?search= lalu urutkan terbaru dulu
function cariLaporan(daftar, q) {
  const kata = (q.search || '').toLowerCase();
  return daftar
    .filter((r) => !q.status || r.status === q.status)
    .filter((r) => !q.building_uuid || r.building_uuid === q.building_uuid)
    .filter((r) => !kata || r.title.toLowerCase().includes(kata) || r.ticket_no.toLowerCase().includes(kata))
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

// Cari laporan dari ?uuid= atau ?ticket_no=
const ambilLaporan = (q) => db.reports.find((r) => r.uuid === q.uuid || (q.ticket_no && r.ticket_no === q.ticket_no));

// ---------- Auth ----------
app.post('/api/auth/register', (req, res) => {
  const { full_name, email, password, reporter_type } = req.body;
  if (!full_name || !email || !password || !['MAHASISWA', 'DOSEN', 'STAF'].includes(reporter_type)) return kirim(res, 422, 'Data tidak lengkap');
  if (db.users.some((u) => u.email === email)) return kirim(res, 422, 'Email sudah terdaftar');
  const user = { uuid: randomUUID(), full_name, email, password: bcrypt.hashSync(password, 10), role: 'PELAPOR', reporter_type, is_active: true };
  db.users.push(user);
  simpan();
  kirim(res, 201, 'Registrasi berhasil', dataUser(user));
});

app.post('/api/auth/login', (req, res) => {
  const user = db.users.find((u) => u.email === req.body.email);
  if (!user || !bcrypt.compareSync(req.body.password || '', user.password)) return kirim(res, 401, 'Email atau password salah');
  if (!user.is_active) return kirim(res, 403, 'Akun dinonaktifkan');
  const token = jwt.sign({ uuid: user.uuid }, SECRET, { expiresIn: '1d' });
  kirim(res, 200, 'Login berhasil', { token, user: dataUser(user) });
});

app.get('/api/auth/me', wajibLogin, (req, res) => kirim(res, 200, 'OK', dataUser(req.user)));

// Token tidak disimpan di server, jadi logout cukup menghapus token di sisi frontend
app.post('/api/auth/logout', wajibLogin, (req, res) => kirim(res, 200, 'Logout berhasil'));

app.post('/api/auth/change-password', wajibLogin, (req, res) => {
  const { current_password, new_password } = req.body;
  if (!bcrypt.compareSync(current_password || '', req.user.password)) return kirim(res, 400, 'Password lama salah');
  if (!new_password || new_password.length < 6) return kirim(res, 422, 'Password baru minimal 6 karakter');
  req.user.password = bcrypt.hashSync(new_password, 10);
  simpan();
  kirim(res, 200, 'Password diubah');
});

// ---------- Gedung & kategori ----------
app.get('/api/locations', wajibLogin, (req, res) => {
  const kata = (req.query.search || '').toLowerCase();
  kirim(res, 200, 'OK', db.locations.filter((l) => l.is_active && l.name.toLowerCase().includes(kata)));
});

app.get('/api/locations/detail', wajibLogin, (req, res) => {
  const gedung = db.locations.find((l) => l.uuid === req.query.uuid);
  gedung ? kirim(res, 200, 'OK', gedung) : kirim(res, 404, 'Lokasi tidak ditemukan');
});

app.get('/api/damage-categories', wajibLogin, (req, res) => kirim(res, 200, 'OK', db.categories));

// ---------- Laporan ----------
app.post('/api/reports', wajibLogin, upload.single('photo'), (req, res) => {
  const { building_uuid, room_name, category_uuid, description, title, floor } = req.body;
  if (!building_uuid || !room_name || !category_uuid || !description || !req.file) return kirim(res, 422, 'Data atau foto (JPG/PNG, maks 5 MB) tidak valid');
  const nomorTerakhir = Math.max(0, ...db.reports.map((r) => Number(r.ticket_no.slice(3))));
  const laporan = {
    uuid: randomUUID(), ticket_no: 'LP-' + String(nomorTerakhir + 1).padStart(4, '0'),
    title: title || description.slice(0, 40), building_uuid, floor: floor || '', room_name, category_uuid, description,
    photo_url: '/uploads/' + req.file.filename, status: 'DITERIMA', priority: 'NORMAL',
    reporter_uuid: req.user.uuid, likes: [], created_at: new Date().toISOString(),
  };
  db.reports.push(laporan);
  simpan();
  kirim(res, 201, 'Laporan terkirim', dataLaporan(laporan, req.user));
});

// Semua laporan (hanya petugas)
app.get('/api/reports', wajibLogin, wajibRole(...ROLE_PETUGAS), (req, res) =>
  kirim(res, 200, 'OK', cariLaporan(db.reports, req.query).map((r) => dataLaporan(r, req.user))));

// Laporan milik sendiri
app.get('/api/reports/my-reports', wajibLogin, (req, res) =>
  kirim(res, 200, 'OK', cariLaporan(db.reports.filter((r) => r.reporter_uuid === req.user.uuid), req.query).map((r) => dataLaporan(r, req.user))));

// Laporan publik: tanpa nama pelapor
app.get('/api/reports/public', wajibLogin, (req, res) =>
  kirim(res, 200, 'OK', cariLaporan(db.reports, req.query).map((r) => dataLaporan(r, req.user))));

app.get('/api/reports/detail', wajibLogin, (req, res) => {
  const laporan = ambilLaporan(req.query);
  laporan ? kirim(res, 200, 'OK', dataLaporan(laporan, req.user)) : kirim(res, 404, 'Laporan tidak ditemukan');
});

// Like / batal like. Laporan selesai tidak bisa di-like.
app.post('/api/reports/like', wajibLogin, (req, res) => {
  const laporan = ambilLaporan(req.query);
  if (!laporan) return kirim(res, 404, 'Laporan tidak ditemukan');
  if (laporan.status === 'SELESAI') return kirim(res, 400, 'Laporan selesai tidak bisa di-like');
  const i = laporan.likes.indexOf(req.user.uuid);
  i >= 0 ? laporan.likes.splice(i, 1) : laporan.likes.push(req.user.uuid);
  simpan();
  kirim(res, 200, 'OK', dataLaporan(laporan, req.user));
});

// Ubah status (petugas)
app.post('/api/reports/status', wajibLogin, wajibRole(...ROLE_PETUGAS), upload.single('proof_photo'), (req, res) => {
  const laporan = ambilLaporan(req.query);
  if (!laporan) return kirim(res, 404, 'Laporan tidak ditemukan');
  if (!['DIPROSES', 'MENUNGGU', 'TIDAK_DAPAT_DIPERBAIKI', 'SELESAI'].includes(req.body.status)) return kirim(res, 422, 'Status tidak valid');
  laporan.status = req.body.status;
  simpan();
  kirim(res, 200, 'Status diubah', dataLaporan(laporan, req.user));
});

app.listen(PORT, () => console.log('Backend jalan di http://localhost:' + PORT));
