/*
  MODEL DATA
  Di sini kita mendefinisikan "bentuk" data laporan dan semua konstanta.
  Status laporan sengaja dipusatkan di sini (PTD bagian 3.3), karena model
  status (3 atau 9 status) masih keputusan terbuka. Kalau berubah, cukup edit file ini.
*/

// Kode status yang dipakai di seluruh aplikasi
export type StatusCode = 'dikirim' | 'diproses' | 'selesai';

// Label yang tampil ke pengguna untuk tiap kode status
export const STATUS_LABEL: Record<StatusCode, string> = {
  dikirim: 'Dikirim',
  diproses: 'Diproses',
  selesai: 'Selesai',
};

// Daftar status untuk dropdown filter
export const STATUS_OPTIONS = Object.keys(STATUS_LABEL) as StatusCode[];

// Bentuk satu laporan
export interface Report {
  uuid: string;        // id internal dari backend (dipakai untuk aksi seperti like)
  id: string;          // nomor tiket, contoh LP-0146
  title: string;       // nama kerusakan
  building: string;
  floor: string;       // kosong jika tidak diisi (opsional)
  room: string;
  category: string;
  description: string;
  photoUrl: string;    // alamat foto; kosong jika tidak ada
  status: StatusCode;
  createdAt: string;   // tanggal ISO, contoh 2026-11-18T09:41:00
  likes: number;
  liked: boolean;      // apakah pengguna ini sudah memberi like
}

// Data yang diisi pengguna di form (id, status, dll dibuat oleh service)
export type NewReport = Pick<
  Report,
  'title' | 'building' | 'floor' | 'room' | 'description' | 'photoUrl'
>;

// Aturan foto. Ini hanya validasi kenyamanan; validasi sebenarnya ada di Backend.
export const PHOTO_MAX_MB = 5;
export const PHOTO_TYPES = ['image/jpeg', 'image/png'];

// Langkah "Perjalanan laporan" di halaman detail (3 langkah, sesuai desain).
// Setiap langkah punya teks untuk dua kondisi: sudah tercapai (done) dan belum (pending).
export interface TimelineStep {
  title: string;
  doneLabel: string;     // baris kecil jika tercapai (langkah 1 diganti tanggal laporan)
  doneText: string;
  pendingLabel: string;  // baris kecil jika belum tercapai
  pendingText: string;
}

export const TIMELINE_STEPS: TimelineStep[] = [
  { title: 'Dikirim', doneLabel: '', doneText: 'Laporan berhasil diterima.', pendingLabel: '', pendingText: '' },
  { title: 'Diproses', doneLabel: 'Sedang ditangani', doneText: 'Petugas sedang menangani laporan Anda.', pendingLabel: 'Belum dimulai', pendingText: 'Perkembangan akan tampil di sini.' },
  { title: 'Selesai', doneLabel: 'Perbaikan selesai', doneText: 'Laporan sudah ditangani sampai tuntas.', pendingLabel: 'Belum selesai', pendingText: 'Bukti perbaikan akan dilampirkan.' },
];

// Status laporan -> nomor langkah terakhir yang sudah tercapai (mulai dari 0)
export const STEP_REACHED: Record<StatusCode, number> = {
  dikirim: 0,
  diproses: 1,
  selesai: 2,
};

// Kategori tidak diisi pelapor (form di desain tidak punya kolomnya).
// Untuk sementara ditebak dari kata kunci nama kerusakan; nanti ditetapkan Backend/Kaur.
export const DEFAULT_CATEGORY = 'Lainnya';
export const CATEGORY_KEYWORDS: [string, string][] = [
  ['ac', 'AC & Pendingin'],
  ['pendingin', 'AC & Pendingin'],
  ['proyektor', 'Proyektor'],
  ['kursi', 'Kursi & Meja'],
  ['meja', 'Kursi & Meja'],
  ['lampu', 'Lampu'],
  ['sound', 'Sound System'],
  ['mic', 'Sound System'],
  ['lift', 'Lift'],
];

// Contoh data untuk tombol "Isi contoh laporan" (mode prototipe)
export const SAMPLE_REPORT = {
  title: 'AC tidak dingin',
  floor: 'Lantai 3',
  room: 'Ruang 3.12',
  description: 'AC menyala tetapi tidak mengeluarkan udara dingin sejak pagi.
Kegiatan perkuliahan di ruang 3.12 terasa tidak nyaman.',
  photoUrl: '/samples/ac-ruang-312.jpg',
  photoName: 'ac-ruang-312.jpg',
  photoSize: '1,8 MB',
};
