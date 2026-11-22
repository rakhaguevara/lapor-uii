# DESIGN.md · UII SIRA (Sistem Informasi Respons Area)

Panduan desain antarmuka untuk frontend. Sumber: folder `design-refrence/` (satu `Guideline.png`, 14 layar desktop berawalan `D •`, 14 layar mobile berawalan `M •`).
Kode yang menerapkannya: `frontend/src/styles.css` (token dan komponen dasar) dan komponen di `frontend/src/app/`.

Aturan kerja: warna, font, dan ukuran ditulis **sekali** sebagai variabel di `:root` pada `styles.css`. Jangan menulis kode warna langsung di komponen. Kalau desain berubah, ubah di sini dan di `:root`.

Catatan penamaan: nama produk di desain adalah **UII SIRA**. Dokumen PRD/PTD memakai nama usulan "I'M Care UII"; nama di antarmuka mengikuti desain.

---

## 1. Skala referensi

Gambar referensi berukuran **1,5x**: desktop 2160 px = **1440 px** CSS, mobile 585 px = **390 px** CSS. Semua ukuran di dokumen ini sudah dalam px CSS.

| | Desktop | Mobile |
|---|---|---|
| Lebar acuan | 1440 | 390 |
| Titik pindah | di atas 800 px | 800 px ke bawah |
| Header | 114 px | 68 px |
| Navigasi | sidebar 232 px | bottom nav 64 px |
| Padding konten | 32 px kiri/kanan | 16 px kiri/kanan |

Kelas bantu global: `.d-only` (hanya desktop) dan `.m-only` (hanya mobile). Dipakai bila isi HTML-nya memang berbeda, bukan sekadar ukuran.

## 2. Warna (Guideline.png)

| Token | Hex | Pemakaian |
|---|---|---|
| `--yellow` | `#F6D106` | Header |
| `--blue-900` | `#093697` | Tombol gelap ("Buka portal"), tautan breadcrumb beranda |
| `--blue-600` | `#0867D8` | Tombol utama, tautan, menu aktif, nomor tiket |
| `--blue-50` | `#EAF3FF` | Latar menu aktif, kotak info, banner ajakan |
| `--white` | `#FFFFFF` | Kartu, sidebar, input |
| `--bg` | `#F5F7FB` | Latar halaman, kepala tabel, kotak unggah |
| `--red` / `--red-bg` | `#C33B41` / `#FFF1F1` | Error, kotak peringatan |
| `--amber` / `--amber-bg` | `#9C6605` / `#FFF5DC` | Status Diproses, lingkaran langkah |
| `--green` / `--green-bg` | `#15805B` / `#E9F8F0` | Status Selesai, centang berhasil |

Catatan pada Guideline.png: swatch merah tertulis `#F5F7FB` (salah ketik); nilai yang dipakai `#C33B41` diambil dari daftar warna font di gambar yang sama.

Warna tambahan yang **terbaca dari piksel layar** (tidak ada di Guideline, jadi dicatat sebagai asumsi):

| Token | Hex | Pemakaian |
|---|---|---|
| `--ink` | `#14243E` | Judul dan teks utama (desain memakai biru-hitam, bukan `#000000`) |
| `--muted` | `#69788E` | Teks sekunder, label |
| `--placeholder` | `#7C899C` | Placeholder input |
| `--line` | `#E2E8F0` | Garis tepi kartu dan input |
| `--blue-hero` | `#073E86` | Kartu hero di landing dan portal, garis "How It Works" |

Warna teks pada Guideline (`Poppins` + warna): hitam `#000000` (nama merek di header), biru `#0867D8`, abu `#7F7F7F`, merah `#C33B41`, amber `#9C6605`, hijau `#15805B`. Abu `#7F7F7F` digantikan `--muted` karena desain di layar memakai `#69788E`.

## 3. Tipografi

Font: **Poppins** (400, 500, 600, 700) dimuat dari Google Fonts di `index.html`. Fallback `system-ui`.

Layar mobile pada referensi tampak memakai Inter, tetapi Guideline menetapkan Poppins. **Keputusan: Poppins dipakai di semua layar**, dan ukuran mobile diperkecil sekitar 8 persen dari tinggi huruf referensi karena Poppins lebih lebar (supaya patah baris tetap mirip).

| Peran | Desktop | Mobile |
|---|---|---|
| H1 halaman | 28 / 700 | 23 / 700 |
| Judul hero | 36 / 700, baris 52 | 25 / 700, baris 38 |
| Judul kartu besar ("Pelapor") | 22 / 700 | 20 / 700 |
| Judul bagian (kartu form, CTA) | 18–20 / 600 | 15–17 / 700 |
| Judul daftar ("Pembaruan terbaru") | 17 / 600 | 17 / 700 |
| Subjudul halaman | 14 / 400 | 12,5 / 400 |
| Teks isi, deskripsi kartu | 13–14 | 12–13 |
| Label form | 12 / 500 | 12 / 500 |
| Input | 13 | 13 |
| Tombol | 13 / 600 | 12–13 / 600 |
| Menu sidebar | 13 | (bottom nav 11) |
| Breadcrumb | 12 | disembunyikan |
| Kepala tabel, badge, nomor tiket | 11 | – |
| Judul kartu laporan (mobile) | – | 15 / 700 |
| Teks lokasi kartu (mobile) | – | 12 |
| Brand "UII SIRA" / subjudul | 15 / 12 | 12 / 9,5 |
| Nama dan peran di pil profil | 10 / 9 | 10,5 / 8,5 |

## 4. Bentuk, jarak, bayangan

| Token | Nilai |
|---|---|
| `--r-card` | 16 px (kartu, banner, kotak info) |
| `--r-ctl` | 10 px (tombol, input, select) |
| `--r-pill` | 999 px (badge, pil profil, tombol "Masuk") |
| Hero | 24 px (desktop), 16 px (mobile) |
| Kotak akses di sidebar | 12 px |
| `--shadow-pill` | `0 2px 8px rgb(20 36 62 / 16%)` (pil di header) |
| Garis kartu | 1 px `--line`, tanpa bayangan |
| Tinggi tombol dan input | 44 px |
| Jarak antar blok halaman | 24 px (antar kartu), 16–20 px (antar kolom/kartu kecil) |

## 5. Kerangka halaman

### Desktop (1440)
- **Header kuning** (`app-header`): tinggi 114 (landing/login 108), padding kiri 40 kanan 32. Kiri: logo 38×42 + "UII SIRA" (bold) + "Sistem Informasi Respons Area" (amber). Kanan: pil putih profil (avatar abu 27 px, nama, peran, chevron) berisi menu **Keluar**; di landing diganti pil "Masuk ›".
- **Sidebar** (232 px, putih): label "PORTAL PELAPOR" (10 px, huruf kapital, abu), 4 menu setinggi 44 px berjarak 8 px (Beranda, Buat laporan, Laporan Saya, Laporan publik). Menu aktif: latar `--blue-50`, teks dan ikon `--blue-600`, tebal 600. Di bawah: kotak "AKSES ANDA" (latar `--bg`), jaraknya 130 px dari dasar.
- **Konten**: latar `--bg`, padding 16 / 32 / 48. Susunan kepala halaman: breadcrumb → H1 → subjudul → tombol aksi di kanan (turun 35 px dari atas supaya sejajar judul).
- Menu aktif: halaman detail laporan menyorot "Laporan Saya"; halaman berhasil dikirim dan preview foto menyorot "Buat laporan"; halaman Portal tidak menyorot apa pun.

### Mobile (390)
- Header 68 px, padding kiri 22 kanan 17. Logo 26×29, teks merek kecil, pil profil memakai nama depan saja.
- **Bottom nav** 64 px, 4 item (Beranda, Buat laporan, Laporan Saya, Publik), ikon 24 + label 11. Item aktif biru dengan garis 40×3 px di tepi atas. Tidak tampil di halaman Portal.
- Konten: padding 16, jarak atas 40, bawah 96 (ruang bottom nav). Breadcrumb tidak tampil.

## 6. Komponen

| Komponen | Berkas | Catatan |
|---|---|---|
| Header | `layout/app-header.ts` | Menu profil: tutup dengan klik di luar atau Esc |
| Shell (sidebar + bottom nav) | `layout/shell.ts` | Satu daftar menu untuk keduanya |
| Kepala halaman | `shared/page-head.ts` | Input: `title`, `subtitle`, `mobileSubtitle`, `desktopOnly`, `crumbs`; tombol aksi lewat isi komponen |
| Ikon | `shared/icon.ts` | Ikon garis 24 px: grid, plus, list, ring, thumb, edit, trash, sort, search, chevron, upload, check, right, left |
| Badge status | `shared/status-badge.ts` | Desktop: pil 110×28 dengan titik. Mobile: titik + teks tanpa latar |
| Daftar laporan | `shared/report-table.ts` | Desktop tabel, mobile kartu; DOM sama |
| Sambutan | `shared/welcome.ts` | Hero, kartu akses, "See It...", "How It Works" |

**Tombol**: `.btn` putih bergaris (aksi sekunder), `.btn-primary` biru `--blue-600` (aksi utama), `.btn-dark` biru tua (hanya "Buka portal"). Lebar minimum tombol aksi kepala halaman 184 px, tombol "Kirim laporan" 196 px. Di mobile tombol aksi kepala halaman selebar layar.

**Input**: tinggi 44, garis `--line`, radius 10, padding 14, teks 13. Error: garis `--red` + pesan 11 px merah di bawahnya. Select memakai chevron kustom. Kotak unggah foto: latar `--bg`, garis solid `--line`, minimal tinggi 104.

**Badge status** (satu tempat: `STATUS_LABEL` di `core/report.model.ts` + kelas `badge-*` di `styles.css`):

| Status | Latar | Teks |
|---|---|---|
| Dikirim | `--blue-50` | `--blue-600` |
| Diproses | `--amber-bg` | `--amber` |
| Selesai | `--green-bg` | `--green` |

**Tabel** (desktop): kolom `2,1fr 1,33fr 1fr 0,8fr`; kepala tabel setinggi 40 px berlatar `--bg`, radius 8; baris minimal 78 px tanpa garis pemisah; tombol urut di kolom Status. **Kartu** (mobile): padding 16, radius 16, baris: `LP-xxxx · tanggal` → judul → lokasi (2 baris) → status → tautan "Lihat detail →".

**Suka** (jempol): abu bila belum, biru tua bila sudah. Laporan Selesai tidak bisa disukai. Di Laporan Saya jumlah suka hanya ditampilkan (desktop); mobile tidak menampilkannya.

## 7. Halaman

| Alamat | Halaman | Desktop | Mobile |
|---|---|---|---|
| `/` | Landing | Hero biru tua, 2 kartu (Akses Pelapor, See It...), How It Works, footer kecil | Judul "Selamat datang", hero biru muda, kartu bertumpuk |
| `/login` | Masuk | Header kuning tanpa tombol Masuk + kartu form 440 px | Kartu selebar layar |
| `/portal` | Selamat datang | Seperti landing dengan sidebar; tombol "Buka portal →" | + sapaan "Sedang masuk sebagai ...", kartu peran terkunci Teknisi dan Kaur & Pimpinan, tanpa bottom nav |
| `/beranda` | Dashboard | Banner ajakan, 4 kartu angka, tabel 3 laporan terbaru | Kartu angka 2×2 di atas, banner, daftar kartu |
| `/laporan/baru` | Buat laporan | Form (1fr) + kolom samping 367 px | Satu kolom, tombol "Isi contoh laporan" di atas |
| `/laporan/baru/foto` | Preview foto | Foto 720 px + info di kanan | Foto dalam kartu + tombol biru "Kembali ke form" |
| `/laporan/:id/terkirim` | Berhasil dikirim | Kartu tengah 815 px | Kartu rata kiri, tombol selebar layar |
| `/laporan/:id` | Detail laporan | Kartu isi (1fr) + kolom 383 px (Perjalanan laporan) | Tombol kembali di atas judul, kartu bertumpuk |
| `/laporan-saya` | Laporan Saya | Filter + tabel + ikon edit/hapus + catatan | Tanpa filter, daftar kartu |
| `/laporan-publik` | Laporan publik | Filter + tabel + catatan privasi | Kotak privasi, pencarian, 2 pilihan filter, kartu |

**Form Buat laporan** (urutan kolom dari desain): Nama kerusakan, Gedung + Lantai (opsional), Detail Lokasi, Foto kerusakan, Deskripsi. Kolom Kategori **tidak ada** di desain (kategori diisi otomatis, lihat bagian 9).
Judul halaman mengikuti kondisi: "Buat laporan" → "Validasi laporan" (Kirim ditekan padahal belum lengkap) → "Laporan siap dikirim" (semua wajib terisi). Pesan error: "Nama kerusakan wajib diisi.", "Pilih gedung terlebih dahulu.", "Detail lokasi wajib diisi.", "Deskripsi wajib diisi."; ringkasan "Lengkapi semua kolom wajib dan unggah minimal satu foto." (desktop: teks merah di bawah form; mobile: kotak merah di atas dengan judul "Periksa kembali laporan Anda").
Foto: JPG/PNG maks. 5 MB. Setelah dipilih tampil miniatur 116×82 (klik = preview foto), nama berkas, ukuran, dan tombol "Ganti foto".

**Pencarian dan filter**: saat kata kunci atau filter aktif, judul menjadi "Hasil pencarian" dan judul daftar "N laporan ditemukan". Di mobile muncul kotak ringkasan filter dengan tombol "Reset pencarian & filter".

**Perjalanan laporan** (3 langkah): Dikirim (dengan tanggal dan jam), Diproses, Selesai. Titik biru = tercapai, titik abu = belum, dengan teks "Belum dimulai / Perkembangan akan tampil di sini." dan "Belum selesai / Bukti perbaikan akan dilampirkan." Definisi langkah ada di `TIMELINE_STEPS` pada `core/report.model.ts`.

**How It Works**: 5 langkah (Temukan, Laporkan, Diterima, Ditangani, Selesai), lingkaran 50 px berisi angka. Lingkaran aktif berwarna `--yellow` dengan lingkaran lembut `--amber-bg` 170 px di belakangnya; berpindah mengikuti hover. Mobile: daftar vertikal dengan garis di kiri.

## 8. Aset

| Berkas | Sumber |
|---|---|
| `frontend/public/logo-uii.png` | Dipotong dari referensi (logo UII). **Ganti dengan berkas logo resmi** bila sudah ada, nama berkas dan ukuran 38×42 tetap |
| `frontend/public/samples/ac-ruang-312.jpg` | Dipotong dari layar Preview foto; hanya untuk tombol "Isi contoh laporan" (mode prototipe) |

## 9. Keputusan dan penyimpangan dari referensi

1. **Poppins di mobile** meski referensi tampak Inter (lihat bagian 3).
2. **Kolom filter** di desktop memakai teks rata kiri dan ikon kaca pembesar di dalam kolom pencarian. Di referensi teks placeholder dan pilihan tampak berada di tengah (kemungkinan artefak Figma).
3. **Ikon edit dan hapus** di Laporan Saya tampil sesuai desain tetapi **nonaktif**: backend belum punya aksinya, dan desain tidak menunjukkan baris mana yang dituju. PRD menyebut edit/hapus sebagai Must/Should yang masih perlu dikonfirmasi.
4. **Kategori kerusakan** tidak ada di form desain, padahal backend mewajibkannya. Frontend menebaknya dari kata kunci nama kerusakan (`CATEGORY_KEYWORDS` di `report.model.ts`; bawaan "Lainnya"). Perlu keputusan produk bila kategori seharusnya ditetapkan petugas.
5. **Model status 3** (Dikirim, Diproses, Selesai) mengikuti desain; backend punya lebih banyak status dan dipetakan di `report.service.ts` (`toStatus`).
6. **Tombol urut** (ikon panah naik-turun di kepala kolom Status) mengurutkan menurut status; belum ada petunjuk di desain tentang kolom yang dimaksud.
7. **Pil profil di header** memakai teks 10/9 px mengikuti desain (kecil). Itu di bawah kenyamanan baca; naikkan bila diperbolehkan.
8. **Layar kondisi** (error dan siap kirim) di desain adalah satu halaman form dalam tiga keadaan; dibangun sebagai satu komponen, bukan tiga halaman.
9. Login tidak ada di referensi; dibuat dengan bahasa visual yang sama (header kuning + kartu).

## 10. Aksesibilitas dan batas yang diketahui

Rasio kontras terhitung (WCAG AA: 4,5 untuk teks kecil):

| Pasangan | Rasio | Catatan |
|---|---|---|
| `--ink` di `--bg` | 14,5 | Baik |
| `--blue-600` di putih / `--blue-50` | 5,3 / 4,8 | Baik |
| `--green` di putih / `--green-bg` | 4,9 / 4,5 | Baik |
| `--red` di putih / `--red-bg` | 5,2 / 4,8 | Baik |
| `--muted` di putih | 4,49 | Hampir lolos |
| `--muted` di `--bg` / `--blue-50` | 4,2 / 4,0 | **Di bawah AA** untuk teks kecil (warna dari desain) |
| `--placeholder` di putih | 3,6 | Di bawah AA, lazim untuk placeholder |
| `--amber` di `--yellow` (subjudul header) | 3,25 | **Di bawah AA**, warna ditetapkan Guideline |
| `--amber` di `--amber-bg` | 4,5 | Batas |

Bila desain boleh disesuaikan: gelapkan `--muted` ke sekitar `#5B6B80` dan subjudul header ke sekitar `#6B4A00`.

Yang sudah diterapkan: label pada semua kolom, `aria-invalid` pada kolom salah, `role="alert"` pada pesan galat, `aria-current` pada menu dan breadcrumb, fokus terlihat (outline 3 px), area sentuh minimal 44 px, ikon dekoratif disembunyikan dari pembaca layar, teks alternatif pada foto, dan nama aksesibel pada tombol suka (menyebut tiket dan jumlah suka).

---

## 11. Portal petugas (Admin Unit dan Admin Universitas)

Sumber: `design-refrence/admit unit-univ/` (15 layar desktop, 14 mobile). Tema, header, sidebar, dan bottom nav **sama** dengan pelapor; `layout/shell.ts` memilih menu dari peran (`ROLES`). Kelas global baru ada di akhir `styles.css` (`.stat`, `.grid-4`, `.split`, `.bars`, `.hbar`, `.tbl`, `.opt`, `.tl`, `.detail`, `.ok-note`), jadi halaman petugas hampir tanpa CSS sendiri.

| Peran | Alamat | Halaman |
|---|---|---|
| Admin Unit | `/unit` | Dashboard (angka, tren, status, laporan prioritas) |
| | `/unit/laporan`, `/unit/laporan/:id` | Kelola laporan (filter), detail |
| | `/unit/laporan/:id/tugaskan` | Tugaskan teknisi; selesai → detail dengan judul "Penugasan tersimpan" |
| | `/unit/statistik` | Statistik fasilitas (+ kategori, kinerja layanan) |
| Admin Universitas | `/univ` | Dashboard (4 angka + pintu Gedung / Akun) |
| | `/univ/gedung`, `/univ/gedung/baru`, `/univ/gedung/:id` | Daftar, tambah, ubah gedung |
| | `/univ/akun`, `/univ/akun/baru`, `/univ/akun/:id` | Daftar, tambah, ubah akun |

Layar "berhasil disimpan" (gedung, akun) = daftar dengan kotak hijau (`?tersimpan=nama`), seperti desain.

**Data**: laporan dan gedung dari backend (`GET /api/reports`, `/api/locations`). **Belum ada di backend, disimpan di memori (hilang saat refresh)**: penugasan teknisi dan status "Ditugaskan", daftar teknisi, kode/cakupan/lantai gedung, tambah-ubah-nonaktifkan gedung, seluruh akun, dan waktu respons ("Kinerja layanan" tampil "–"). Semuanya di `core/admin.service.ts`. Statistik dihitung dari laporan bulan terpilih.

Penyimpangan: tombol tempat sampah = nonaktifkan (bukan hapus); nama pelapor tidak tampil di detail (API tidak mengirimnya); filter laporan tidak tampil di mobile (sesuai desain); kartu laporan mobile memakai tata letak kartu pelapor (status di bawah judul, bukan di pojok kanan atas); pilihan prioritas mengikuti nilai backend (Tinggi/Normal/Rendah).

## 12. Portal Teknisi

Sumber: `design-refrence/teknisi/`. Menu: Beranda `/teknisi`, Semua tugas `/teknisi/tugas`, Tersedia `/teknisi/tersedia`, Tugas Saya `/teknisi/saya`; detail `/teknisi/tugas/:id`. Daftar (`shared/task-list.ts`) dipakai di Beranda dan halaman daftar; tab Semua / Tersedia / Tugas Saya mengganti isi tanpa pindah halaman. Logika di `core/tech.service.ts`.

Alur detail: Ambil tugas → (judul "Tugas berhasil diambil") Mulai penanganan → Selesaikan tugas (foto bukti opsional) → "Tugas selesai". "Mulai" dan "Selesai" memakai `POST /api/reports/status` (nyata). **"Ambil tugas" disimpan di memori** (belum ada endpoint). Cakupan gedung teknisi dicari dari data akun contoh; bila tidak ketemu, semua gedung tampil. Foto bukti hanya ditampilkan di browser (backend belum menyimpannya). Jumlah "Perlu konfirmasi" = tugas milik teknisi yang berstatus Ditugaskan.
