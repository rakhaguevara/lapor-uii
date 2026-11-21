# PTD: Product Technology Development
## Aplikasi Pelaporan Fasilitas Rusak Kampus UII (I'M Care UII)

| | |
|---|---|
| Versi | 0.1 (draf) |
| Tanggal | 19 November 2026 |
| Pemilik dokumen | Frontend BSI UII |
| Dokumen pasangan | PRD_IM-Care-UII.md |
| Fokus | Sisi frontend. Bagian Backend hanya memuat kebutuhan frontend terhadap API |

**Cara membaca status keputusan**
- **Tetap**: bersumber dari dokumen proyek atau keterangan BSI.
- **Usulan**: rekomendasi frontend, bisa diubah setelah dikonfirmasi tim.
- **Perlu konfirmasi**: bergantung pada jawaban SA, Backend, atau BSI.

---

## 1. Tujuan Dokumen

Menetapkan pendekatan teknis frontend agar tim dapat membangun antarmuka web yang sesuai PRD, terhubung ke API Backend, aman per peran dan lingkup gedung, dan dapat dirawat setelah MVP.

## 2. Ringkasan Keputusan Teknologi

| Area | Keputusan | Status |
|---|---|---|
| Framework | Angular (versi mengikuti standar BSI) | Tetap, karena BSI sudah memakai Angular. Versi: perlu konfirmasi |
| Bahasa | TypeScript | Tetap (bawaan Angular) |
| Jenis aplikasi | SPA, tanpa SSR | Usulan |
| Komponen UI | Angular Material atau PrimeNG, mengikuti pustaka yang dipakai BSI | Perlu konfirmasi |
| Gaya | Tema biru UII, aksen emas, latar putih, mobile first | Usulan |
| Form | Reactive Forms | Usulan |
| Data dari API | HttpClient + RxJS, tipe dari spesifikasi OpenAPI | Usulan |
| State | Service dengan Signals atau RxJS, tanpa pustaka state global pada tahap MVP | Usulan |
| Grafik | Chart.js (ng2-charts) atau ngx-charts | Usulan |
| Kompresi foto | browser-image-compression | Usulan |
| Unit test | Jest atau Karma+Jasmine mengikuti standar BSI | Perlu konfirmasi |
| E2E test | Playwright | Usulan |
| Autentikasi | Email dan password (workflow diagram). SSO UII sebagai alternatif | Perlu konfirmasi (lihat bagian 6) |

## 3. Arsitektur Frontend

### 3.1 Pola umum

- SPA dengan routing sisi klien. Semua halaman berada di balik login, kecuali Login dan Daftar.
- Fitur dipecah per domain dan dimuat lazy supaya bundel awal kecil di koneksi lemah.
- Logika akses (peran dan lingkup gedung) dikumpulkan di satu tempat (guard dan service), tidak tersebar di komponen.

### 3.2 Struktur folder (usulan)

```
src/app/
  core/                 # singleton: auth, interceptor, guard, konfigurasi API, notifikasi
    auth/
    http/
    guards/
  shared/               # dipakai banyak fitur
    ui/                 # status-badge, timeline, photo-uploader, building-select, empty-state
    pipes/
    models/             # tipe dari OpenAPI + tipe turunan
  features/
    auth/               # login, daftar, ganti-password
    reports/            # form laporan, laporan saya, detail laporan, laporan publik
    tasks/              # daftar tugas teknisi, detail tugas
    unit-admin/         # daftar laporan unit, kelola laporan
    dashboard/          # dashboard + ekspor
    admin/              # gedung, lingkup, akun
    notifications/
  layout/               # shell, navigasi per peran, header, bottom-nav mobile
```

### 3.3 Prinsip

1. Satu komponen Detail Laporan dan satu komponen Dashboard dipakai lintas peran. Aksi yang tampil ditentukan oleh peran dan status, bukan dengan menyalin halaman.
2. Validasi di frontend hanya untuk kenyamanan pengguna. Keputusan akses dan aturan bisnis tetap dipaksakan Backend.
3. Status laporan dipetakan lewat satu tabel konfigurasi (kode status, label, warna, aksi yang diizinkan), sehingga perubahan model status (lihat bagian 12) tidak menyentuh banyak komponen.

## 4. Peran, Route, dan Hak Akses

### 4.1 Peta halaman (17 halaman unik, 16 jika lingkup digabung ke Akun)

| # | Halaman | Route (usulan) | Peran |
|---|---|---|---|
| 1 | Login | `/login` | Publik |
| 2 | Daftar | `/daftar` | Publik (pelapor) |
| 3 | Ganti password | `/ganti-password` | Semua (login pertama akun buatan admin) |
| 4 | Notifikasi | `/notifikasi` | Semua |
| 5 | Laporan publik per gedung | `/laporan-publik` | Pelapor |
| 6 | Form laporan (buat dan edit) | `/laporan/baru`, `/laporan/:id/edit` | Pelapor |
| 7 | Nomor tiket setelah kirim | `/laporan/:id/terkirim` | Pelapor |
| 8 | Laporan Saya | `/laporan-saya` | Pelapor |
| 9 | Detail laporan | `/laporan/:id` | Pelapor, teknisi, admin unit, pimpinan (aksi berbeda per peran) |
| 10 | Daftar tugas | `/tugas` | Teknisi |
| 11 | Detail tugas | `/tugas/:id` | Teknisi (memakai komponen Detail laporan) |
| 12 | Daftar laporan unit | `/unit/laporan` | Admin unit |
| 13 | Kelola laporan | `/unit/laporan/:id` | Admin unit (memakai komponen Detail laporan) |
| 14 | Dashboard | `/dashboard` | Admin unit, pimpinan |
| 15 | Pengelolaan gedung | `/admin/gedung` | Admin universitas |
| 16 | Penetapan lingkup | `/admin/lingkup` | Admin universitas |
| 17 | Pengelolaan akun | `/admin/akun` | Admin universitas |

Halaman Could: riwayat perbaikan per aset (`/unit/aset/:id`). Konfirmasi dan rating serta buka kembali berupa tambahan di Detail laporan.

Dengan reuse (Detail laporan dan Dashboard), komponen halaman yang benar-benar dibangun lebih sedikit dari 17.

### 4.2 Matriks akses

| Fitur | Pelapor | Teknisi | Admin Unit | Admin Univ | Pimpinan |
|---|:-:|:-:|:-:|:-:|:-:|
| Buat, edit, hapus laporan sendiri | ✓ | | | | |
| Laporan publik dan like | ✓ | | | | |
| Lihat nama lengkap pelapor | | ✓ | ✓ | | |
| Daftar tugas dan ambil tugas | | ✓ | | | |
| Kerjakan atau Tolak tugas | | ✓ | | | |
| Ubah status, estimasi, foto bukti | | ✓ | ✓ | | |
| Tugaskan, Urgen, pindah gedung, kerusakan besar | | | ✓ | | |
| Dashboard | | | ✓ | | ✓ |
| Ekspor data | | | ✓ | | |
| Kelola gedung, lingkup, akun | | | | ✓ | |
| Lihat seluruh gedung | | | | | ✓ |

Teknisi dan admin unit dibatasi gedung lingkupnya. Pimpinan hanya lihat.

### 4.3 Menu per peran

- **Pelapor**: Buat Laporan, Laporan Saya, Laporan Publik, Notifikasi.
- **Teknisi**: Daftar Tugas, Notifikasi.
- **Admin Unit**: Laporan Unit, Dashboard, Notifikasi.
- **Admin Universitas**: Gedung, Lingkup, Akun.
- **Pimpinan**: Dashboard.

Navigasi mobile memakai bottom navigation dengan maksimal 4-5 item.

## 5. Komponen Bersama

| Komponen | Fungsi | Catatan |
|---|---|---|
| `status-badge` | Label status berwarna | Membaca tabel konfigurasi status |
| `report-timeline` | Riwayat status: waktu, pelaku, catatan, estimasi, foto bukti | Entri Tidak Bisa Diperbaiki perlu penanda berbeda dari Selesai |
| `report-detail` | Detail laporan dengan aksi sesuai peran dan status | Dipakai 4 peran. Aksi disembunyikan, bukan dibuat halaman baru |
| `photo-uploader` | Pilih foto, validasi JPG/PNG maksimal 5 MB, kompresi, pratinjau | Pesan penolakan jelas |
| `building-select` | Dropdown gedung dengan pencarian, hanya gedung aktif | Sumber dari API gedung |
| `dashboard-view` | Kartu jumlah, grafik, filter periode dan gedung | Lingkup data mengikuti peran |
| `notification-bell` | Ikon notifikasi dan daftar | Penyegaran berkala |
| `confirm-dialog` | Konfirmasi hapus, penugasan, nonaktifkan | |
| `empty-state`, `error-state`, `skeleton` | Kondisi kosong, gagal, memuat | |

## 6. Autentikasi dan Otorisasi

### 6.1 Dua skenario (perlu konfirmasi)

| | Skenario A: email dan password (workflow diagram) | Skenario B: SSO UII (UIIGateway) |
|---|---|---|
| Halaman | Login, Daftar, Ganti password | Tombol "Masuk dengan akun UII" dan halaman callback |
| Akun pelapor | Mendaftar sendiri | Dari akun UII yang sudah ada |
| Akun staf (teknisi, admin) | Dibuat Admin Universitas dengan password awal | Peran ditetapkan di aplikasi untuk akun UII |
| Dampak ke PRD | US-01 dan US-21 berlaku seperti tertulis | US-01 dan US-21 berubah |
| Pekerjaan frontend | Form dan validasi | Redirect, callback, penanganan sesi habis |

Keputusan ini perlu dijawab SA dan BSI sebelum halaman autentikasi dibangun. Bagian lain tidak terpengaruh.

### 6.2 Aturan yang berlaku pada kedua skenario

- Sesi disimpan dalam cookie HttpOnly dari Backend. Hindari menyimpan token di localStorage.
- Interceptor menangani 401 (arahkan ke login) dan 403 (halaman akses ditolak).
- `AuthGuard` memeriksa sudah masuk. `RoleGuard` memeriksa peran. Lingkup gedung dipaksakan Backend, frontend hanya menampilkan data yang dikembalikan.
- Alamat halaman di luar hak akses mengarah ke halaman awal sesuai peran (US-02).
- Pada skenario A, akun yang wajib ganti password diarahkan ke `/ganti-password` sebelum halaman lain.

## 7. Integrasi API

### 7.1 Prinsip

- Frontend meminta spesifikasi **OpenAPI** dari Backend, lalu membuat tipe TypeScript dan klien API darinya.
- Seluruh panggilan lewat satu lapisan layanan, tidak langsung dari komponen.
- Selama API belum siap, frontend memakai data tiruan (mock) dengan antarmuka layanan yang sama.

### 7.2 Kebutuhan endpoint (usulan untuk dibahas dengan Backend, bukan kontrak final)

| Domain | Kebutuhan |
|---|---|
| Auth | Daftar, masuk, keluar, ganti password, profil dan peran |
| Gedung | Daftar gedung aktif (dengan pencarian), CRUD dan nonaktifkan (admin) |
| Laporan | Buat (dengan unggah foto), daftar milik saya, daftar publik per gedung, detail, edit, hapus |
| Like | Beri dan batalkan |
| Tugas | Daftar per lingkup (urutan dari server), ambil tugas (konflik ditangani 409), respons Kerjakan atau Tolak |
| Status | Ubah status dengan catatan, estimasi, foto bukti, alasan |
| Admin unit | Tugaskan, ubah prioritas Urgen, pindahkan gedung, tandai kerusakan besar |
| Timeline | Riwayat perubahan per laporan |
| Notifikasi | Daftar, tandai dibaca, jumlah belum dibaca |
| Dashboard | Agregat per periode dan gedung |
| Ekspor | Berkas CSV atau Excel per periode dan gedung |
| Akun dan lingkup | CRUD akun, tetapkan gedung, nonaktifkan |

### 7.3 Penanganan respons

| Kode | Perlakuan di frontend |
|---|---|
| 400 / 422 | Tampilkan pesan pada kolom terkait |
| 401 | Arahkan ke login |
| 403 | Halaman akses ditolak |
| 404 | Halaman tidak ditemukan |
| 409 | Pesan jelas. Untuk Ambil Tugas: "tugas sudah diambil" lalu segarkan daftar |
| 5xx / jaringan | Pesan gagal, isi form tidak hilang (US-04), tombol coba lagi |

### 7.4 Notifikasi di aplikasi

Tahap MVP memakai polling berkala (misalnya tiap 30-60 detik) untuk jumlah notifikasi belum dibaca. SSE atau WebSocket menyusul jika Backend menyediakan. Email dikirim Backend.

## 8. Form dan Validasi

### 8.1 Form laporan (maksimal 3 langkah)

| Field | Aturan |
|---|---|
| Gedung | Wajib, dropdown dengan pencarian |
| Ruangan | Wajib, teks. Contoh format "Ruang 3.4". Lantai opsional |
| Kategori | Wajib |
| Foto | Wajib, JPG atau PNG, maksimal 5 MB, kompresi, pratinjau |
| Deskripsi | Singkat. Wajib atau opsional perlu konfirmasi |

Tombol kirim aktif setelah semua kolom wajib terisi. Jika kolom kurang saat ditekan, kirim dibatalkan dan setiap kolom yang kurang diberi pesan. Form edit memakai aturan yang sama.

### 8.2 Form lain

| Form | Aturan utama |
|---|---|
| Daftar | Nama, email valid, password, jenis pelapor |
| Ubah status teknisi | Status berikutnya sesuai alur, catatan opsional, estimasi (tanggal dan jam) saat Diproses, foto bukti wajib untuk Selesai, alasan wajib untuk Tidak Bisa Diperbaiki |
| Tolak tugas | Alasan wajib |
| Kerusakan besar | Catatan |
| Pindah gedung | Pilih gedung tujuan |
| Akun | Peran, unit, gedung, password awal |

## 9. Unggah Foto dan Performa

- Validasi tipe dan ukuran sebelum dikirim, kompresi di browser, lalu unggah.
- Lazy loading per fitur, gambar pratinjau memakai ukuran kecil.
- Daftar panjang memakai paginasi dari server.
- Target: form laporan tetap dapat dipakai di koneksi lemah, dengan indikator kemajuan dan pesan gagal yang jelas.

## 10. Antarmuka dan Identitas

- **Warna (usulan, bersumber dari makna logo UII)**: biru dominan untuk aksi utama dan header, kuning emas sebagai aksen, putih untuk latar. Kode warna resmi belum diperoleh, perlu dari brand guide UII.
- **Responsif**: mobile first. Pelapor kebanyakan memakai HP, sedangkan dashboard dan admin dipakai di komputer.
- **Nama dan slogan**: I'M Care UII hanya usulan. Slogan UII "I'M UII" adalah akronim Islami, Mondial, Unggul, Intelektual, Indonesiawi. Penggunaannya perlu dikonfirmasi ke pihak UII.
- **Bahasa antarmuka**: Indonesia, ringkas dan jelas untuk pengguna awam.
- **Aksesibilitas**: kontras warna memadai, label pada kolom form, navigasi keyboard pada dialog dan dropdown, teks alternatif pada foto bukti.
- Token desain (warna, radius, font) disimpan sebagai variabel tema agar perubahan nama atau warna cukup di satu tempat.

## 11. Pengujian

| Jenis | Cakupan |
|---|---|
| Unit | Validator form (foto, kolom wajib), pemetaan status, guard peran, pemformat tanggal |
| Komponen | `photo-uploader`, `report-detail` (aksi per peran dan status), `status-badge` |
| E2E (Playwright) | Alur utama: daftar atau masuk, buat laporan, nomor tiket, teknisi ambil tugas, ubah status, Selesai dengan foto bukti, pelapor melihat timeline |
| Akses | Halaman di luar hak akses ditolak, data di luar lingkup gedung tidak tampil |
| Kasus khusus | Ambil Tugas bersamaan (409), unggah foto tidak valid, kegagalan simpan tidak menghapus isi form |
| Sumber skenario | Acceptance criteria pada user stories, dikoordinasikan dengan QA |

## 12. Keputusan Terbuka yang Memengaruhi Frontend

| # | Keputusan | Dampak frontend | Ditanyakan ke |
|---|---|---|---|
| 1 | Autentikasi: email dan password atau SSO | Halaman auth, sesi | SA, BSI |
| 2 | Model status: tiga atau sembilan | Tabel konfigurasi status, filter, dashboard | SA |
| 3 | Estimasi waktu selesai wajib atau tidak | Form teknisi, timeline | SA |
| 4 | Hapus laporan: permanen atau disembunyikan | Teks konfirmasi, perilaku daftar | SA |
| 5 | Jenis pelapor memengaruhi tampilan atau tidak | Model data | SA |
| 6 | Teknisi melihat laporan publik atau tidak | Menu teknisi | SA |
| 7 | Versi Angular, pustaka UI, aturan kode, starter kit | Setup proyek | BSI |
| 8 | Format spesifikasi API dan jadwal rilisnya | Pembuatan tipe, mock | Backend |
| 9 | Kode warna dan aturan logo resmi UII | Tema | BSI, UII |
| 10 | Nama produk dan penggunaan slogan I'M UII | Branding | BSI, klien |
| 11 | Lingkungan deploy dan pipeline | Build | BSI |

## 13. Rencana Kerja Frontend (Hari 2-5)

| Hari | Pekerjaan | Hasil |
|---|---|---|
| 2 (hari ini) | Pahami dokumen, tetapkan stack, ajukan pertanyaan terbuka | PRD dan PTD draf, daftar pertanyaan ke SA, BSI, dan Backend |
| 3 | Setup proyek, tema, layout dan navigasi per peran, guard, lapisan API dengan mock, form laporan | Kerangka berjalan, form laporan lengkap dengan validasi dan unggah foto |
| 4 | Laporan Saya dan Detail laporan dengan timeline, Daftar tugas dan Ambil Tugas, ubah status dan foto bukti, notifikasi, hubungkan ke API nyata, bantu QA | Fitur Must berjalan dari laporan sampai selesai |
| 5 | Perbaikan bug, laporan publik dan like, edit dan hapus, dashboard dan ekspor (jika waktu cukup), presentasi | Build stabil untuk presentasi |

Urutan prioritas jika waktu mepet: Must lebih dulu, lalu Should. Fitur Could tidak dikerjakan pada MVP.

## 14. Risiko Teknis

| Risiko | Mitigasi |
|---|---|
| API Backend belum siap saat frontend mulai | Mock dengan antarmuka layanan sama, spesifikasi OpenAPI sebagai kontrak |
| Model status atau autentikasi berubah di tengah jalan | Tabel konfigurasi status, lapisan auth terpisah di `core/auth` |
| Waktu 5 hari terlalu ketat untuk seluruh Should | Prioritas Must dulu, komponen dipakai ulang lintas peran |
| Koneksi lemah di lapangan | Kompresi foto, indikator kemajuan, pesan gagal yang menjaga isi form |
| Perbedaan standar kode dengan tim BSI | Ikuti starter kit dan aturan kode BSI sejak awal |
| Hak akses bocor lewat tampilan | Backend memaksakan aturan, frontend hanya menyembunyikan aksi |

## 15. Definition of Done

Sebuah fitur dianggap selesai jika:
1. Sesuai acceptance criteria pada user story terkait.
2. Tampil benar di HP dan komputer.
3. Hak akses per peran dan lingkup gedung diuji.
4. Kondisi kosong, memuat, dan gagal ditangani.
5. Lolos pemeriksaan kode dan pengujian yang relevan.
6. Dapat dijalankan oleh QA di lingkungan uji.

## 16. Referensi

- PRD_IM-Care-UII.md
- Project Brief, User Stories dan Acceptance Criteria, BPMN To-Be, Workflow Diagram Role-Based
