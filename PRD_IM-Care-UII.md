# PRD: Aplikasi Pelaporan Fasilitas Rusak Kampus UII

| | |
|---|---|
| Nama kerja produk | I'M Care UII (usulan nama, belum final) |
| Versi | 0.1 (draf) |
| Tanggal | 19 November 2026 |
| Disusun untuk | Tim proyek BSI UII (SA, UI/UX, Frontend, Backend, QA) |
| Sumber | Project Brief, User Stories dan Acceptance Criteria (18 Nov 2026), BPMN To-Be, Workflow Diagram Role-Based |

Catatan pembacaan: bagian bertanda **[Perlu konfirmasi]** adalah titik yang berbeda antar dokumen sumber. Daftar lengkapnya ada di bagian 13.

---

## 1. Ringkasan Produk

Aplikasi web responsif untuk melaporkan kerusakan fasilitas kampus (AC, proyektor, kursi, lampu, sound system, lift, dan lainnya) dan memantau penanganannya sampai selesai. Aplikasi menggantikan pelaporan lewat WhatsApp dan lisan, serta menggantikan pencatatan ganda di FTIlapor. Pronect tetap menjadi catatan final, datanya dipindahkan lewat ekspor.

## 2. Latar Belakang dan Masalah

Laporan kerusakan saat ini masuk lewat WhatsApp layanan atau disampaikan langsung, lalu diteruskan ke grup teknisi. Tiga masalah inti dari wawancara:

1. **Tidak ada sistem pelaporan terpusat.** Laporan tersebar di WA, lisan, satpam, dan staf jurusan. Mahasiswa tidak tahu cara melapor selain datang ke ruang teknisi.
2. **Laporan tidak terdokumentasi.** Data hanya tersisa di riwayat chat, tanpa foto, dan sering salah menyebut ruangan.
3. **Tidak ada pelacakan progres.** Pelapor tidak tahu laporannya ditanggapi.

Temuan penting: teknisi jarang lalai. Masalahnya ada pada kualitas laporan, tidak adanya pencatatan, dan progres yang tidak terlihat.

### Enam titik masalah pada proses as-is

| # | Titik masalah | Jawaban di aplikasi |
|---|---|---|
| 1 | Tidak ada jalur resmi, laporan tanpa foto dan sering salah ruangan | Satu aplikasi web, form dengan foto dan ruangan wajib |
| 2 | Tidak ada pencatatan, data hanya di riwayat chat | Pencatatan terstruktur dan nomor tiket |
| 3 | Tidak ada pembagian tugas dan prioritas, tertunda saat kelas dipakai | Penugasan, prioritas Urgen dan like |
| 4 | Kerusakan besar menunggu surat dan dana Badan Wakaf | Penanda kerusakan besar (Perlu Surat/Anggaran) |
| 5 | Pelapor tidak tahu progres | Timeline status dan notifikasi |
| 6 | Laporan dicatat berulang di FTIlapor dan Pronect | Ekspor data ke Pronect, tanpa input ganda |

## 3. Tujuan dan Kriteria Keberhasilan

Tujuan: membangun MVP aplikasi pelaporan kerusakan dengan pelacakan status yang terdokumentasi rinci.

| Kriteria keberhasilan MVP | Dirasakan oleh |
|---|---|
| Pelapor dapat mengirim laporan lengkap dengan lokasi dan foto dalam maksimal 3 langkah | Pelapor |
| Laporan langsung terlihat oleh teknisi dan admin unit di gedung terkait | Teknisi, admin unit |
| Teknisi dapat mengambil tugas, memperbarui status, dan mengunggah foto bukti | Teknisi |
| Pelapor dapat melihat timeline status dan menerima notifikasi | Pelapor |
| Admin unit dapat melihat jumlah laporan (diterima, sedang ditangani, selesai) per periode | Admin unit, pimpinan |

## 4. Peran Pengguna

Ada 5 peran. Dosen, staf, dan mahasiswa adalah jenis pelapor dalam satu peran.

| Peran | Deskripsi | Lingkup data |
|---|---|---|
| **Pelapor** | Mahasiswa, dosen, atau staf. Mendaftar sendiri. | Laporan miliknya, daftar laporan publik (nama disamarkan) |
| **Teknisi** | Staf teknis yang mengerjakan perbaikan. | Laporan pada gedung dalam lingkupnya |
| **Admin Unit** (sebelumnya Kaur) | Memantau, menugaskan, menetapkan prioritas. Contoh: Kaur Perbekalan FTI. | Laporan pada gedung dalam lingkupnya |
| **Admin Universitas** | Menyiapkan data gedung, lingkup, dan akun. | Pengelolaan data master |
| **Pimpinan** | Memantau kondisi fasilitas, hanya lihat. | Seluruh fakultas dan gedung |

Pihak di luar aplikasi: **Badan Wakaf** menerima surat dan menyetujui perbaikan kerusakan besar.

## 5. Ruang Lingkup (MoSCoW)

| Kategori | Fitur |
|---|---|
| **Must** | Daftar dan masuk, menu dan data sesuai peran, form laporan (gedung, ruangan, kategori, foto, deskripsi), nomor tiket, notifikasi, teknisi melihat daftar tugas dan mengambil tugas, teknisi memperbarui status, foto bukti perbaikan, timeline status untuk pelapor, pengelolaan gedung dan lingkup pengguna |
| **Should** | Prioritas Urgen oleh admin unit, like pada laporan publik (memengaruhi urutan), edit dan hapus laporan oleh pelapor, penugasan teknisi oleh admin unit dan respons Kerjakan/Tolak, dashboard, penanda kerusakan besar, ekspor data ke Pronect, pemindahan laporan antar gedung, pengelolaan akun dan peran, dashboard pimpinan |
| **Could** | Pilih aset lewat nomor aset atau QR, konfirmasi selesai dan rating oleh pelapor (termasuk buka kembali), riwayat perbaikan per aset |
| **Won't (fase berikutnya)** | SLA dan eskalasi otomatis, integrasi API langsung dengan Pronect, pencatatan biaya dan suku cadang, dropdown ruangan terstruktur |

**[Perlu konfirmasi]** Prioritas like dan edit/hapus laporan: di isi user stories tertulis Must, di tabel ringkasannya Should.

## 6. Alur Pengguna (Ringkas)

1. Pelapor membuka aplikasi, masuk atau mendaftar sekali. Data diri tersimpan.
2. Pelapor melihat daftar laporan publik per gedung. Jika sudah ada laporan serupa, ia memberi like. Jika belum, ia mengisi form singkat.
3. Setelah dikirim, laporan mendapat nomor tiket dan langsung muncul di daftar teknisi dan admin unit gedung terkait, disertai notifikasi.
4. Teknisi mengambil tugas sendiri, atau admin unit menugaskan lalu teknisi memilih Kerjakan atau Tolak.
5. Teknisi mengecek lokasi, mengubah status ke Diproses, mengisi estimasi selesai, lalu menandai Selesai dengan foto bukti, atau menandai Tidak Bisa Diperbaiki dengan alasan.
6. Setiap perubahan status mencatat timeline dan mengirim notifikasi ke pelapor.
7. Untuk kerusakan besar, admin unit menandai Perlu Surat/Anggaran, lalu mengajukan surat ke Badan Wakaf di luar aplikasi.
8. Admin unit memantau dashboard dan mengekspor data ke Pronect. Pimpinan memantau dashboard seluruh gedung.

## 7. Kebutuhan Fungsional per Peran

Kode UC mengikuti workflow diagram.

### 7.1 Pelapor

| Kode | Kebutuhan | Prioritas |
|---|---|---|
| UC-01a | Mendaftar akun: nama, email, password, jenis pelapor (Mahasiswa, Dosen, Staff) | Must |
| UC-01b | Masuk dengan email dan password | Must |
| UC-02 | Menu dan data sesuai peran | Must |
| UC-03 | Membuat laporan: gedung (dropdown dengan pencarian), ruangan (teks, contoh format Ruang 3.4, lantai opsional), kategori, foto JPG/PNG maksimal 5 MB, deskripsi | Must |
| UC-04 | Menerima nomor tiket unik (contoh RPT-2026-0142) dengan status awal | Must |
| UC-05 | Laporan Saya: daftar dengan filter status, detail dengan timeline (waktu, catatan, estimasi selesai, foto bukti) | Must |
| UC-06 | Notifikasi perubahan status lewat aplikasi dan email (nomor tiket, status baru, tautan detail) | Must |
| UC-07a | Melihat daftar laporan publik per gedung, nama pelapor disamarkan | Must/Should* |
| UC-07b | Memberi atau membatalkan like (satu pengguna satu like per laporan, tidak aktif jika laporan Selesai) | Must/Should* |
| UC-08a | Mengedit laporan selama masih berstatus awal dan belum ditugaskan atau diambil teknisi | Must/Should* |
| UC-08b | Menghapus laporan dengan dialog konfirmasi (syarat sama dengan edit) | Must/Should* |
| UC-23 | Memilih aset lewat nomor aset atau QR | Could |
| UC-24a | Mengonfirmasi selesai dan memberi rating dan komentar opsional | Could |
| UC-24b | Membuka kembali laporan, teknisi dan admin unit diberi notifikasi | Could |

*Lihat bagian 5.

### 7.2 Teknisi

| Kode | Kebutuhan | Prioritas |
|---|---|---|
| UC-01b | Masuk. Wajib ganti password jika akun dibuat admin | Must |
| UC-09 | Daftar tugas gedung lingkup, urut: Urgen, jumlah like terbanyak, waktu masuk paling awal. Filter status dan gedung. Detail memuat gedung, ruangan, kategori, deskripsi, foto, prioritas | Must |
| UC-06 | Notifikasi laporan baru di gedung lingkup dan tugas dari admin unit | Must |
| UC-10 | Ambil Tugas. Jika dua teknisi menekan bersamaan, hanya satu berhasil | Must |
| UC-11 | Merespons tugas yang ditugaskan: Kerjakan atau Tolak (alasan wajib) | Should |
| UC-12 | Memperbarui status dalam satu langkah, catatan opsional, mengisi estimasi selesai (tanggal dan jam) | Must |
| UC-12 | Mencatat kendala (suku cadang, vendor, anggaran) | Must |
| UC-13 | Mengunggah foto bukti (wajib untuk Selesai) | Must |
| UC-12/13 | Menandai Tidak Bisa Diperbaiki dengan alasan wajib dan foto bukti | Must |

### 7.3 Admin Unit

| Kode | Kebutuhan | Prioritas |
|---|---|---|
| UC-01b, UC-06 | Masuk, menerima notifikasi laporan baru | Must |
| UC-14 | Menugaskan laporan ke teknisi yang lingkup gedungnya sesuai, dapat mengganti teknisi selama belum direspons | Should |
| UC-15 | Menetapkan prioritas Urgen (kegiatan formal atau kunjungan pihak luar). Pelapor dan teknisi tidak dapat mengubah prioritas | Should |
| UC-17 | Memindahkan laporan ke gedung lain, tercatat gedung asal, tujuan, pelaku, waktu | Should |
| UC-16 | Menandai Perlu Surat/Anggaran dengan catatan | Should |
| UC-12/13 | Mengubah status, Selesai wajib foto bukti | Must |
| UC-18 | Dashboard: jumlah diterima, sedang ditangani, selesai, dengan filter periode dan rincian per gedung | Should |
| UC-19 | Ekspor CSV atau Excel: nomor tiket, tanggal, gedung, ruangan, kategori, prioritas, status, teknisi, tanggal selesai | Should |
| UC-25 | Riwayat perbaikan per aset | Could |

### 7.4 Admin Universitas

| Kode | Kebutuhan | Prioritas |
|---|---|---|
| UC-20 | Menambah, mengubah, menonaktifkan gedung (gedung dengan laporan aktif hanya boleh dinonaktifkan) | Must |
| UC-20 | Menetapkan lingkup gedung teknisi dan admin unit, berlaku tanpa masuk ulang | Must |
| UC-21 | Menambah akun (teknisi, admin unit, admin universitas, pimpinan) dengan peran, gedung, dan password awal | Should |
| UC-21 | Mengubah gedung akun, menonaktifkan akun (riwayat tetap tersimpan) | Should |

Akun Admin Universitas pertama dibuat lewat seed data oleh Backend saat instalasi.

### 7.5 Pimpinan

| Kode | Kebutuhan | Prioritas |
|---|---|---|
| UC-22 | Dashboard seluruh fakultas dan gedung, filter periode dan gedung | Should |
| UC-22 | Detail laporan hanya lihat, tanpa tombol ubah status atau prioritas | Should |

## 8. Status Laporan dan Aturan Transisi

**[Perlu konfirmasi]** Dokumen sumber memuat dua model status.

| Model | Status | Sumber |
|---|---|---|
| A (rinci) | Dikirim, Ditugaskan, Dicek, Diproses, Menunggu Suku Cadang/Vendor, Menunggu Anggaran, Tidak Bisa Diperbaiki, Selesai, Dibuka Kembali (dan Estimasi Perbaikan di brief) | Brief, user stories, BPMN |
| B (ringkas) | Diterima, Diproses, Selesai. Kendala dicatat sebagai catatan, Tidak Bisa Diperbaiki dicatat sebagai Selesai dengan alasan | Workflow diagram role-based |

Aturan yang berlaku pada kedua model:
- Foto bukti wajib untuk Selesai.
- Alasan wajib untuk Tidak Bisa Diperbaiki dan untuk penolakan tugas.
- Tugas yang sudah diambil atau ditugaskan tidak dapat diambil teknisi lain.
- Edit dan hapus oleh pelapor hanya selama laporan belum ditugaskan, diambil, atau dikerjakan.
- Setiap perubahan status tercatat di timeline dengan waktu dan pelaku, dan memicu notifikasi ke pelapor.

## 9. Aturan Bisnis

1. Form laporan wajib memuat gedung, ruangan, kategori, dan foto.
2. Prioritas Urgen hanya ditetapkan admin unit. Pelapor tidak menentukan prioritas.
3. Urutan daftar tugas: Urgen, lalu jumlah like terbanyak, lalu waktu masuk paling awal.
4. Satu pengguna hanya dapat memberi satu like per laporan. Like tidak aktif pada laporan Selesai atau Tidak Bisa Diperbaiki.
5. Teknisi dan admin unit hanya melihat dan mengerjakan laporan pada gedung dalam lingkupnya. Lingkup ditetapkan per gedung, bukan per ruangan.
6. Nama pelapor disamarkan di tampilan publik. Nama lengkap hanya terlihat oleh teknisi dan admin unit.
7. Menugaskan hanya dapat memilih teknisi yang lingkup gedungnya mencakup gedung laporan.
8. Gedung dengan laporan aktif tidak dapat dihapus, hanya dinonaktifkan.
9. Akun nonaktif tidak dapat masuk, riwayat laporan yang ditangani tetap tersimpan.
10. Pemindahan gedung dan perubahan prioritas tercatat di riwayat laporan.
11. Pimpinan tidak dapat mengubah status maupun prioritas.

## 10. Kebutuhan Non-Fungsional

| Kode | Kebutuhan |
|---|---|
| NFR-01 | Aplikasi web nyaman dibuka di HP dan komputer tanpa instalasi |
| NFR-02 | Form laporan selesai dalam maksimal 3 langkah |
| NFR-03 | Foto diunggah dengan kompresi agar ringan pada koneksi lemah |
| NFR-04 | Notifikasi tetap tampil di aplikasi meski email gagal, kegagalan tercatat |
| NFR-05 | Hak akses dibatasi per peran, halaman di luar hak akses ditolak |
| NFR-07 | Teknisi memperbarui status dalam satu langkah |
| NFR-08 | Data dibatasi per lingkup gedung |

## 11. Asumsi dan Batasan

- Aplikasi web terhubung ke notifikasi email dan di dalam aplikasi. Brief menyebut WhatsApp juga, namun user stories dan workflow diagram hanya menyebut email dan aplikasi.
- Ruangan diisi manual (teks). Dropdown ruangan terstruktur ada di fase berikutnya.
- Pengajuan surat ke Badan Wakaf terjadi di luar aplikasi. Aplikasi hanya mencatat penanda dan catatan.
- Integrasi dengan Pronect berupa ekspor berkas, bukan API.
- Batas edit dan hapus hanya selama status awal adalah asumsi SA.

## 12. Risiko dan Mitigasi

| Risiko | Mitigasi |
|---|---|
| Pengguna tetap memakai WA karena terbiasa | Form singkat (maksimal 3 langkah), sosialisasi, notifikasi tetap lewat email dan aplikasi |
| Teknisi tidak memperbarui status | Update status satu langkah, foto bukti sebagai kebiasaan |
| Data ganda dengan Pronect | Fitur ekspor, aturan pencatatan final tetap di Pronect |
| Salah ruangan karena input manual | Contoh format, foto wajib, admin unit dapat memindahkan laporan |
| Data gedung belum tersedia | Admin mengelola daftar gedung sendiri di aplikasi |
| Dokumen sumber belum sinkron (lihat bagian 13) | Dikonfirmasi ke SA sebelum fitur terkait dibangun |

## 13. Pertanyaan Terbuka dan Inkonsistensi Dokumen

| # | Topik | Perbedaan | Dampak | Ditanyakan ke |
|---|---|---|---|---|
| 1 | Autentikasi | Workflow diagram: email dan password, daftar mandiri, ganti password awal. BSI diketahui memiliki SSO UII (UIIGateway), belum jelas dipakai atau tidak | Halaman daftar, login, ganti password. US-01 dan US-21 | SA, BSI |
| 2 | Model status | Sembilan status (model A) atau tiga (model B) | Badge, filter, timeline, dashboard | SA |
| 3 | Estimasi waktu selesai | Ada di workflow diagram dan brief, tidak ada di user stories | Field input teknisi dan tampilan timeline | SA |
| 4 | Notifikasi WhatsApp | Brief menyebut WA, dokumen lain tidak | Cakupan Backend | SA, Backend |
| 5 | Prioritas like dan edit/hapus | Must di isi, Should di tabel | Urutan pengerjaan | SA |
| 6 | Hapus laporan | Permanen atau hanya disembunyikan | Perilaku UI dan data | SA |
| 7 | Jenis pelapor | Dicatat saja atau memengaruhi tampilan | Penyimpanan dan tampilan | SA |
| 8 | Cakupan fakultas | Brief berfokus FTI, user stories dan diagram per fakultas atau unit se-UII | Struktur data gedung dan unit | SA |
| 9 | Tidak Bisa Diperbaiki | Status tersendiri (model A) atau Selesai dengan alasan (model B) | Penanda di timeline | SA |
| 10 | Menunggu Anggaran | Event "Anggaran tersedia" pada BPMN tidak jelas siapa pemicunya | Alur kerusakan besar | SA |
| 11 | Teknisi dan laporan publik | Belum jelas apakah teknisi dapat melihat daftar publik dan memberi like | Menu teknisi | SA |
| 12 | Nama produk | I'M Care UII hanya usulan, belum dikonfirmasi klien | Branding | BSI, klien |

## 14. Jadwal 5 Hari (18 sampai 23 November 2026)

| Hari | Fokus | Hasil yang diharapkan |
|---|---|---|
| 1 | Kickoff dan pemahaman masalah | Brief dipahami tim, hasil wawancara dibagikan |
| 2 | Kebutuhan dan desain awal | User stories, alur, wireframe awal. Kebutuhan dibekukan di akhir hari |
| 3 | Kontrak teknis dan mulai build | ERD, daftar API, desain layar final. Frontend dan Backend mulai membangun |
| 4 | Build dan pengujian | Fitur Must berjalan dari laporan sampai selesai, QA menguji |
| 5 | Perbaikan dan presentasi | Perbaikan bug, dokumen final, presentasi |

## 15. Referensi

- Project Brief: Aplikasi Pelaporan Fasilitas Rusak di Kampus
- User Stories dan Acceptance Criteria (25 story, 18 November 2026)
- BPMN To-Be (proses utama dan subproses penugasan)
- Workflow Diagram Role-Based (5 peran)
