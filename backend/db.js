// Database sederhana: semua data disimpan di file db.json.
// Kalau file belum ada, dibuat otomatis dengan data awal (seed).
const fs = require('fs');
const bcrypt = require('bcryptjs');
const { randomUUID } = require('crypto');

const FILE = __dirname + '/db.json';

const namaGedung = [
  'Gedung KH Mas Mansur',
  'Gedung KH Wahid Hasyim',
  'Gedung Moh. Hatta (Perpustakaan Pusat)',
  'Gedung Kuliah Umum Prof. Sardjito',
  'Auditorium KH Abdul Kahar Muzakir',
  'Masjid Ulil Albab',
  'Gedung Dr. Soekiman Wirjosandjojo (Fakultas Kedokteran)',
];
const namaKategori = ['AC & Pendingin', 'Proyektor', 'Kursi & Meja', 'Lampu', 'Sound System', 'Lift', 'Lainnya'];

function buatDataAwal() {
  const locations = namaGedung.map((name) => ({ uuid: randomUUID(), name, type: 'BUILDING', is_active: true }));
  const categories = namaKategori.map((name) => ({ uuid: randomUUID(), name }));
  const users = [
    { uuid: randomUUID(), full_name: 'Aisyah Rahmawati', email: 'aisyah@uii.ac.id', password: bcrypt.hashSync('password123', 10), role: 'PELAPOR', reporter_type: 'MAHASISWA', is_active: true },
    { uuid: randomUUID(), full_name: 'Admin Unit', email: 'admin@uii.ac.id', password: bcrypt.hashSync('admin123', 10), role: 'ADMIN_UNIT', is_active: true },
  ];
  const contoh = (no, title, lokasi, floor, room, kategori, description, status, tanggal) => ({
    uuid: randomUUID(), ticket_no: 'LP-' + no, title, building_uuid: locations[lokasi].uuid, floor, room_name: room,
    category_uuid: categories[kategori].uuid, description, photo_url: '', status, priority: 'NORMAL',
    reporter_uuid: users[0].uuid, likes: [], created_at: tanggal,
  });
  const reports = [
    contoh('0146', 'AC tidak dingin', 0, 'Lantai 3', 'Ruang 3.12', 0, 'AC menyala tetapi tidak mengeluarkan udara dingin sejak pagi.', 'DITERIMA', '2026-11-18T09:41:00'),
    contoh('0145', 'Lampu koridor mati', 0, 'Lantai 1', 'Koridor', 3, 'Lampu di koridor lantai 1 mati sehingga area gelap.', 'DIPROSES', '2026-11-16T08:15:00'),
    contoh('0138', 'Keran wastafel bocor', 0, 'Lantai 2', 'Toilet', 6, 'Keran wastafel bocor terus menerus.', 'SELESAI', '2026-11-12T10:30:00'),
  ];
  return { users, locations, categories, reports };
}

const db = fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, 'utf8')) : buatDataAwal();

function simpan() {
  fs.writeFileSync(FILE, JSON.stringify(db, null, 2));
}
simpan();

module.exports = { db, simpan };
