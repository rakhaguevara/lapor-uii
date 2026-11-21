# **User Stories dan Acceptance Criteria**

**Aplikasi Pelaporan Fasilitas Rusak Kampus UII** \| Disusun oleh: System Analyst \| 18 November 2026

Dokumen ini menjabarkan kebutuhan fungsional menjadi user stories yang siap dipakai UI/UX, Frontend, Backend, dan QA. 

Setiap story memuat kode, prioritas (MoSCoW), kebutuhan dan aturan yang menjadi sumbernya, serta acceptance criteria dengan format Given (kondisi), When (aksi), Then (hasil).

## **1\. Cara Membaca**

**Peran:** Pelapor (dosen, staf, mahasiswa), Teknisi, Kaur atau Admin Unit, Admin Universitas, dan Pimpinan.

**Alur status laporan (acuan semua story):** Dikirim, Ditugaskan (bila kaur menugaskan teknisi), Dicek, Diproses, Selesai. Cabang: Menunggu Suku Cadang/Vendor, Menunggu Anggaran, Tidak Bisa Diperbaiki, dan Dibuka Kembali.

**Lingkup gedung:** teknisi dan kaur atau admin unit hanya melihat dan mengerjakan laporan pada gedung yang ditetapkan sebagai lingkupnya.

## **2\. Akun dan Akses**

**US-01 · Masuk atau mendaftar sekali** (Must · FR-02)

Sebagai pelapor, saya ingin mendaftar atau masuk sekali dan data diri saya tersimpan, agar saya tidak mengisi ulang data setiap kali melapor.

Acceptance criteria:

* Given saya belum memiliki akun, When saya mendaftar dengan nama, alamat email, dan peran, Then akun dibuat dan saya dapat masuk.  
* Given saya sudah masuk, When saya membuat laporan, Then nama dan email saya terisi otomatis dan tidak perlu diketik ulang.  
* Given data pendaftaran tidak lengkap atau email tidak valid, When saya mengirim pendaftaran, Then sistem menampilkan pesan kesalahan pada kolom terkait.

**US-02 · Menu dan data sesuai peran** (Must · FR-18, BR-09, NFR-05, NFR-08)

Sebagai pengguna, saya ingin hanya melihat menu dan data yang sesuai peran dan lingkup saya, agar data aman dan tampilan tidak membingungkan.

Acceptance criteria:

* Given saya masuk sebagai pelapor, When saya membuka aplikasi, Then saya hanya melihat menu pelaporan dan laporan saya.  
* Given saya masuk sebagai teknisi atau kaur, When saya membuka daftar laporan, Then hanya laporan pada gedung dalam lingkup saya yang tampil.  
* Given saya membuka alamat halaman di luar hak akses saya, When halaman dimuat, Then akses ditolak dan saya diarahkan ke halaman awal.  
* Given nama pelapor, When laporan tampil di daftar publik, Then nama disamarkan, dan nama lengkap hanya terlihat oleh teknisi dan kaur.

## **3\. Pelapor**

**US-03 · Membuat laporan kerusakan** (Must · FR-01, FR-03 · BR-01)

Sebagai pelapor, saya ingin mengirim laporan dengan memilih gedung, mengisi ruangan, dan mengunggah foto, agar teknisi mengetahui lokasi dan kondisi kerusakan dengan jelas.

Acceptance criteria:

* Given form laporan terbuka, When saya mengetik nama gedung di kolom pencarian, Then daftar gedung tersaring sesuai ketikan.  
* Given form terbuka, When saya memilih gedung, mengisi ruangan, memilih kategori, mengunggah foto, dan menulis deskripsi singkat, Then tombol kirim aktif.  
* Given kolom gedung, ruangan, kategori, atau foto belum terisi, When saya menekan kirim, Then laporan tidak terkirim dan setiap kolom yang kurang diberi pesan.  
* Given saya mengunggah foto JPG atau PNG maksimal 5 MB, When unggah selesai, Then pratinjau foto tampil. Jika format atau ukuran tidak sesuai, Then muncul pesan penolakan.  
* Given kolom ruangan, When form dibuka, Then terdapat contoh format pengisian (misalnya Ruang 3.4) dan lantai tersedia sebagai pilihan opsional.  
* Given saya membuka form, When saya mengisinya, Then pengiriman laporan dapat diselesaikan dalam maksimal 3 langkah.

**US-04 · Menerima nomor tiket** (Must · FR-04)

Sebagai pelapor, saya ingin mendapat nomor tiket setelah laporan terkirim, agar saya punya bukti dan acuan untuk menanyakan laporan saya.

Acceptance criteria:

* Given laporan berhasil dikirim, When proses selesai, Then sistem menampilkan nomor tiket yang unik (misalnya RPT-2026-0142) dan status awal Dikirim.  
* Given laporan sudah terkirim, When saya membuka Laporan Saya, Then laporan tersebut muncul beserta nomor tiketnya.  
* Given sistem gagal menyimpan laporan, When saya menekan kirim, Then saya melihat pesan gagal dan isi form tidak hilang.

**US-05 · Memantau status laporan** (Must · FR-07, FR-09)

Sebagai pelapor, saya ingin melihat timeline status laporan saya, agar saya tahu laporan saya ditanggapi dan sampai di mana perbaikannya.

Acceptance criteria:

* Given saya membuka detail laporan, When halaman tampil, Then timeline menampilkan setiap perubahan status berurutan lengkap dengan waktu, catatan teknisi, dan foto bukti bila ada.  
* Given status laporan berubah, When saya membuka detail laporan, Then status terbaru tampil tanpa perlu mengirim ulang laporan.  
* Given saya membuka Laporan Saya, When daftar tampil, Then saya hanya melihat laporan milik saya dan dapat memfilter berdasarkan status.

**US-06 · Menerima notifikasi perubahan status** (Must · FR-05, FR-09, NFR-04)

Sebagai pelapor, saya ingin menerima notifikasi setiap status laporan berubah, agar saya tidak perlu membuka aplikasi berulang kali.

Acceptance criteria:

* Given status laporan saya berubah, When perubahan disimpan, Then saya menerima notifikasi lewat email dan tampil sebagai notifikasi di dalam aplikasi.  
* Given isi notifikasi, When saya membacanya, Then memuat nomor tiket, status baru, dan tautan ke detail laporan.  
* Given laporan baru masuk pada gedung dalam lingkup teknisi atau kaur, When laporan tersimpan, Then teknisi dan kaur tersebut menerima notifikasi.  
* Given pengiriman email gagal, When hal itu terjadi, Then notifikasi di dalam aplikasi tetap tampil dan kegagalan tercatat.

**US-07 · Melihat dan memberi like pada laporan publik** (Must · FR-11 · BR-03, BR-05, BR-10)

Sebagai pelapor, saya ingin melihat laporan lain dan menyetujuinya dengan like, agar saya tidak melapor ganda dan kerusakan yang banyak dialami mendapat perhatian.

Acceptance criteria:

* Given saya membuka daftar laporan publik, When saya memilih gedung, Then daftar tersaring per gedung dan nama pelapor disamarkan.  
* Given saya melihat laporan yang aktif, When saya menekan like, Then jumlah like bertambah satu dan tombol berubah menjadi tanda sudah di-like.  
* Given saya sudah memberi like, When saya menekan lagi, Then like dibatalkan. Satu pengguna hanya dapat memberi satu like per laporan.  
* Given laporan berstatus Selesai atau Tidak Bisa Diperbaiki, When saya melihat daftar, Then tombol like tidak aktif.

**US-08 · Mengedit atau menghapus laporan** (Must · FR-21)

Sebagai pelapor, saya ingin mengedit atau menghapus laporan saya, agar saya dapat memperbaiki data yang salah atau membatalkan laporan yang tidak diperlukan.

Acceptance criteria:

* Given laporan milik saya berstatus Dikirim (belum ditugaskan atau diambil teknisi), When saya membuka detail laporan, Then tombol Edit dan Hapus tersedia.  
* Given saya mengedit laporan, When saya mengubah gedung, ruangan, kategori, foto, atau deskripsi lalu menyimpan, Then perubahan tersimpan, nomor tiket tetap sama, dan riwayat mencatat bahwa laporan diubah beserta waktunya.  
* Given saya mengedit laporan, When kolom wajib kosong atau foto tidak sesuai format, Then aturan validasi yang sama dengan pembuatan laporan berlaku.  
* Given saya menekan Hapus, When saya mengonfirmasi pada dialog konfirmasi, Then laporan hilang dari daftar aktif, tidak lagi tampil bagi teknisi dan kaur, dan penghapusan tercatat.  
* Given laporan sudah ditugaskan, diambil, atau dikerjakan, When saya membuka detail laporan, Then tombol Edit dan Hapus tidak tersedia.  
* Given laporan milik pelapor lain, When saya melihatnya, Then saya tidak dapat mengedit atau menghapusnya.

Catatan: batas hanya selama status Dikirim adalah asumsi SA dan perlu dikonfirmasi.

## **4\. Teknisi**

**US-09 · Melihat daftar tugas** (Must · FR-06 · BR-02, BR-03, BR-11)

Sebagai teknisi, saya ingin melihat daftar laporan di gedung dalam lingkup saya dengan urutan prioritas, agar saya tahu apa yang harus dikerjakan lebih dulu.

Acceptance criteria:

* Given saya masuk sebagai teknisi, When saya membuka daftar tugas, Then hanya laporan pada gedung dalam lingkup saya yang tampil.  
* Given daftar tugas tampil, When saya melihatnya, Then urutan: laporan Urgen lebih dulu, lalu jumlah like terbanyak, lalu waktu masuk paling awal.  
* Given daftar tugas, When saya memilih sebuah laporan, Then detail memuat gedung, ruangan, kategori, deskripsi, foto, dan prioritas.  
* Given saya ingin menyaring, When saya memilih status atau gedung, Then daftar tersaring sesuai pilihan.

**US-10 · Mengambil tugas** (Must · FR-06 · BR-04)

Sebagai teknisi, saya ingin mengambil tugas yang belum dikerjakan, agar pembagian kerja jelas tanpa harus menunggu penugasan.

Acceptance criteria:

* Given laporan berstatus Dikirim, When saya menekan Ambil Tugas, Then status menjadi Dicek dan nama saya tercatat sebagai penanggung jawab.  
* Given laporan sudah diambil teknisi lain, When saya membuka laporan itu, Then tombol Ambil Tugas tidak tersedia.  
* Given dua teknisi menekan Ambil Tugas bersamaan, When keduanya terkirim, Then hanya satu yang berhasil dan yang lain mendapat pesan bahwa tugas sudah diambil.

**US-11 · Menerima atau menolak tugas yang ditugaskan** (Should · FR-23)

Sebagai teknisi, saya ingin memilih mengerjakan atau menolak tugas yang ditugaskan kepada saya dengan memberi alasan, agar kaur tahu jika tugas tidak dapat saya kerjakan dan dapat menugaskan ulang.

Acceptance criteria:

* Given tugas berstatus Ditugaskan atas nama saya, When saya membuka detailnya, Then tersedia pilihan Kerjakan dan Tolak.  
* Given saya memilih Kerjakan, When saya menyimpan, Then status menjadi Dicek dan saya tercatat sebagai penanggung jawab.  
* Given saya memilih Tolak, When saya menyimpan tanpa mengisi alasan, Then sistem menolak penyimpanan dan meminta alasan.  
* Given saya menolak dengan alasan, When saya menyimpan, Then status kembali Dikirim, penugasan atas nama saya dilepas, dan alasan tercatat di riwayat.  
* Given tugas ditolak, When penolakan tersimpan, Then kaur menerima notifikasi berisi nomor tiket dan alasan, dan laporan dapat ditugaskan ulang atau diambil teknisi lain.  
* Given tugas ditugaskan kepada teknisi lain, When saya membuka laporan itu, Then saya tidak dapat menerima atau menolaknya.  
* Given pelapor membuka timeline, When tugas ditolak, Then alasan penolakan hanya terlihat oleh teknisi dan kaur.

**US-12 · Memperbarui status** (Must · FR-07 · BR-08, BR-09, NFR-07)

Sebagai teknisi, saya ingin memperbarui status laporan dengan cepat, agar pelapor dan kaur melihat progres tanpa saya menulis laporan terpisah.

Acceptance criteria:

* Given saya penanggung jawab laporan, When saya membuka detailnya, Then saya dapat memilih status berikutnya yang sesuai alur: Diproses, Selesai, Menunggu Suku Cadang/Vendor, Menunggu Anggaran, atau Tidak Bisa Diperbaiki.  
* Given saya mengubah status, When saya menyimpan, Then perubahan dapat dilakukan dalam satu langkah, catatan bersifat opsional, dan waktu serta pelaku tercatat di timeline.  
* Given saya memilih Tidak Bisa Diperbaiki, When saya menyimpan, Then alasan wajib diisi dan laporan tidak dihapus.  
* Given saya bukan teknisi atau kaur dalam lingkup gedung laporan, When saya mencoba mengubah status, Then sistem menolak perubahan.

**US-13 · Mengunggah foto bukti perbaikan** (Must · FR-08 · BR-06)

Sebagai teknisi, saya ingin mengunggah foto hasil perbaikan, agar ada bukti bahwa kerusakan sudah ditangani.

Acceptance criteria:

* Given saya mengubah status menjadi Selesai, When saya menyimpan, Then sistem mewajibkan minimal satu foto bukti.  
* Given foto bukti terunggah, When pelapor membuka timeline, Then foto bukti tampil pada entri status Selesai.  
* Given saya mengunggah foto, When file lebih dari 5 MB atau bukan JPG atau PNG, Then foto ditolak dengan pesan yang jelas.

## **5\. Kaur atau Admin Unit**

**US-14 · Menugaskan laporan ke teknisi** (Should · FR-22 · BR-04)

Sebagai kaur, saya ingin menugaskan laporan ke teknisi tertentu, agar tugas penting atau yang belum diambil tetap terbagi dengan jelas.

Acceptance criteria:

* Given laporan berstatus Dikirim pada gedung dalam lingkup saya, When saya memilih teknisi dari daftar dan menugaskan, Then status menjadi Ditugaskan dan nama teknisi tercatat sebagai penerima tugas.  
* Given daftar teknisi, When saya membukanya, Then hanya teknisi yang lingkup gedungnya mencakup gedung laporan yang dapat dipilih.  
* Given laporan ditugaskan, When penugasan disimpan, Then teknisi yang dituju menerima notifikasi (email dan di dalam aplikasi) dan laporan tampil di daftar tugasnya dengan penanda perlu respons.  
* Given laporan berstatus Ditugaskan dan belum direspons teknisi, When saya memilih teknisi lain, Then penugasan berpindah ke teknisi baru dan riwayat mencatat perubahan.  
* Given laporan berstatus Ditugaskan, When teknisi lain membuka laporan itu, Then tombol Ambil Tugas tidak tersedia.  
* Given saya bukan kaur dalam lingkup gedung laporan, When saya membuka laporan, Then saya tidak dapat menugaskan teknisi.

**US-15 · Menetapkan prioritas Urgen** (Should · FR-10 · BR-02)

Sebagai kaur, saya ingin menandai laporan sebagai Urgen jika fasilitas dipakai untuk kegiatan formal atau kunjungan pihak luar, agar laporan tersebut dikerjakan lebih dulu.

Acceptance criteria:

* Given laporan pada gedung dalam lingkup saya, When saya mengubah prioritas menjadi Urgen, Then laporan naik ke urutan teratas di daftar tugas teknisi.  
* Given saya pelapor atau teknisi, When saya membuka laporan, Then saya tidak dapat mengubah prioritas.  
* Given prioritas diubah, When perubahan disimpan, Then tercatat di riwayat laporan beserta pelaku dan waktunya.

**US-16 · Menandai kerusakan besar** (Should · FR-13 · BR-07)

Sebagai kaur, saya ingin menandai laporan sebagai kerusakan besar yang perlu surat dan anggaran, agar jelas laporan mana yang menunggu proses ke Badan Wakaf.

Acceptance criteria:

* Given laporan pada gedung dalam lingkup saya, When saya menandainya Perlu Surat/Anggaran dan menulis catatan, Then penanda dan catatan tampil di detail laporan.  
* Given penanda aktif, When teknisi atau kaur mengubah status, Then status Menunggu Anggaran tersedia sebagai pilihan.  
* Given laporan menunggu anggaran, When pelapor membuka timeline, Then status Menunggu Anggaran dan catatan tampil.

**US-17 · Memindahkan laporan ke gedung lain** (Should · FR-19 · BR-12)

Sebagai kaur, saya ingin memindahkan laporan yang salah gedung ke gedung yang benar, agar laporan sampai ke teknisi yang tepat.

Acceptance criteria:

* Given laporan pada lingkup saya, When saya memilih gedung tujuan dan memindahkan, Then laporan hilang dari daftar gedung asal dan muncul di gedung tujuan.  
* Given laporan dipindahkan, When saya membuka riwayat, Then tercatat gedung asal, gedung tujuan, pelaku, dan waktu.  
* Given laporan dipindahkan, When pindah selesai, Then teknisi dan kaur gedung tujuan menerima notifikasi dan pelapor tetap dapat melihat laporannya.

**US-18 · Melihat dashboard laporan** (Should · FR-12)

Sebagai kaur, saya ingin melihat jumlah laporan yang diterima, sedang ditangani, dan selesai per periode, agar saya dapat memantau kinerja penanganan dan membuat laporan ke atasan.

Acceptance criteria:

* Given saya membuka dashboard, When halaman tampil, Then terlihat jumlah laporan diterima, sedang ditangani (Dicek, Diproses, Menunggu), dan selesai.  
* Given saya memilih periode (bulan atau rentang tanggal), When filter diterapkan, Then angka dan grafik menyesuaikan periode tersebut.  
* Given dashboard tampil, When saya melihat rinciannya, Then data dapat dipecah sampai tingkat gedung dan hanya mencakup gedung dalam lingkup saya.

**US-19 · Mengekspor data laporan** (Should · FR-14)

Sebagai kaur, saya ingin mengekspor data laporan, agar dapat dimasukkan ke Pronect sebagai catatan final.

Acceptance criteria:

* Given saya memilih periode dan gedung, When saya menekan Ekspor, Then sistem menghasilkan berkas (CSV atau Excel) yang dapat diunduh.  
* Given berkas diekspor, When saya membukanya, Then memuat nomor tiket, tanggal, gedung, ruangan, kategori, prioritas, status, teknisi, dan tanggal selesai.  
* Given ekspor, When berkas dibuat, Then hanya memuat data pada gedung dalam lingkup saya.

## **6\. Admin Universitas**

**US-20 · Mengelola daftar fakultas, gedung, dan lingkup** (Must · FR-18 · BR-11, NFR-08)

Sebagai admin universitas, saya ingin mengelola daftar fakultas atau unit dan gedung serta menetapkan lingkup teknisi dan kaur, agar laporan masuk ke pihak yang bertanggung jawab.

Acceptance criteria:

* Given saya masuk sebagai admin universitas, When saya membuka pengelolaan lokasi, Then saya dapat menambah, mengubah, dan menonaktifkan fakultas atau unit serta gedung.  
* Given sebuah gedung, When saya menetapkannya ke teknisi atau kaur, Then pengguna tersebut mulai melihat laporan gedung itu tanpa perlu masuk ulang.  
* Given gedung memiliki laporan aktif, When saya mencoba menghapusnya, Then sistem hanya mengizinkan penonaktifan dan menampilkan peringatan.  
* Given gedung baru ditambahkan, When pelapor membuka form, Then gedung tersebut muncul di dropdown pencarian.

**US-21 · Mengelola akun dan peran per unit** (Should · FR-20 · NFR-08)

Sebagai admin universitas, saya ingin menambah dan menonaktifkan akun kaur atau admin unit dan teknisi per unit, agar tiap unit dapat langsung memakai aplikasi.

Acceptance criteria:

* Given saya membuka pengelolaan akun, When saya menambah akun dengan peran (teknisi, kaur atau admin unit), unit, dan gedung, Then akun dibuat dan pengguna dapat masuk.  
* Given akun tidak lagi dipakai, When saya menonaktifkannya, Then pengguna tidak dapat masuk dan riwayat laporan yang ia tangani tetap tersimpan.  
* Given akun teknisi atau kaur, When saya mengubah unit atau gedungnya, Then lingkup data pengguna berubah sesuai.

## **7\. Pimpinan**

**US-22 · Melihat dashboard seluruh gedung** (Should · FR-12)

Sebagai pimpinan, saya ingin melihat dashboard laporan semua fakultas dan gedung tanpa dapat mengubah status, agar saya memperoleh gambaran kondisi fasilitas.

Acceptance criteria:

* Given saya masuk sebagai pimpinan, When saya membuka dashboard, Then data seluruh fakultas dan gedung tampil.  
* Given saya membuka detail laporan, When halaman tampil, Then tidak ada tombol untuk mengubah status atau prioritas.

## **8\. Pengembangan Berikutnya (Could)**

**US-23 · Memilih aset lewat nomor aset atau QR** (Could · FR-15)

Sebagai pelapor, saya ingin memilih aset dengan nomor aset atau scan QR, agar laporan langsung tertaut ke barang yang rusak.

* Given saya memindai QR atau memasukkan nomor aset, When aset ditemukan, Then gedung, ruangan, dan jenis aset terisi otomatis di form.  
* Given nomor aset tidak ditemukan, When saya mengirim, Then saya diminta mengisi lokasi secara manual.

**US-24 · Konfirmasi selesai dan rating** (Could · FR-16)

Sebagai pelapor, saya ingin mengonfirmasi bahwa perbaikan selesai atau membuka kembali laporan, agar kualitas perbaikan terpantau.

* Given laporan berstatus Selesai, When saya menekan Konfirmasi, Then status menjadi dikonfirmasi dan saya dapat memberi rating dan komentar (opsional).  
* Given perbaikan belum beres, When saya menekan Buka Kembali, Then status menjadi Dibuka Kembali dan teknisi serta kaur menerima notifikasi.

**US-25 · Riwayat perbaikan per aset** (Could · FR-17)

Sebagai kaur, saya ingin melihat riwayat perbaikan per aset, agar saya tahu aset yang paling sering rusak.

* Given aset terdaftar, When saya membuka detail aset, Then semua laporan terkait aset tersebut tampil berurutan waktu.

## **9\. Kriteria Penerimaan Umum (Non-Fungsional)**

Berlaku untuk semua story di atas:

* Aplikasi web dapat dibuka dengan nyaman di HP maupun komputer tanpa instalasi (NFR-01).  
* Form laporan dapat diselesaikan dalam maksimal 3 langkah (NFR-02).  
* Foto diunggah dengan kompresi agar tetap ringan pada koneksi lemah (NFR-03).  
* Hak akses dibatasi per peran dan lingkup gedung, dan nama pelapor disamarkan di tampilan publik (NFR-05, NFR-08).  
* Update status oleh teknisi dapat dilakukan dalam satu langkah (NFR-07).

## **10\. Ringkasan dan Keterlacakan**

| Story | Judul | Peran | Prioritas | Sumber |
| :---- | :---- | :---- | :---- | :---- |
| US-01 | Masuk atau mendaftar sekali | Pelapor | Must | FR-02 |
| US-02 | Menu dan data sesuai peran | Semua | Must | FR-18, BR-09, NFR-05, NFR-08 |
| US-03 | Membuat laporan kerusakan | Pelapor | Must | FR-01, FR-03, BR-01 |
| US-04 | Menerima nomor tiket | Pelapor | Must | FR-04 |
| US-05 | Memantau status laporan | Pelapor | Must | FR-07, FR-09 |
| US-06 | Menerima notifikasi perubahan status | Pelapor, teknisi, kaur | Must | FR-05, FR-09, NFR-04 |
| US-07 | Melihat dan memberi like pada laporan publik | Pelapor | Should | FR-11, BR-03, BR-05, BR-10 |
| US-08 | Mengedit atau menghapus laporan | Pelapor | Should | FR-21 |
| US-09 | Melihat daftar tugas | Teknisi | Must | FR-06, BR-02, BR-03, BR-11 |
| US-10 | Mengambil tugas | Teknisi | Must | FR-06, BR-04 |
| US-11 | Menerima atau menolak tugas yang ditugaskan | Teknisi | Should | FR-23 |
| US-12 | Memperbarui status | Teknisi | Must | FR-07, BR-08, BR-09, NFR-07 |
| US-13 | Mengunggah foto bukti perbaikan | Teknisi | Must | FR-08, BR-06 |
| US-14 | Menugaskan laporan ke teknisi | Kaur | Should | FR-22, BR-04 |
| US-15 | Menetapkan prioritas Urgen | Kaur | Should | FR-10, BR-02 |
| US-16 | Menandai kerusakan besar | Kaur | Should | FR-13, BR-07 |
| US-17 | Memindahkan laporan ke gedung lain | Kaur | Should | FR-19, BR-12 |
| US-18 | Melihat dashboard laporan | Kaur | Should | FR-12 |
| US-19 | Mengekspor data laporan | Kaur | Should | FR-14 |
| US-20 | Mengelola daftar fakultas, gedung, dan lingkup | Admin universitas | Must | FR-18, BR-11, NFR-08 |
| US-21 | Mengelola akun dan peran per unit | Admin universitas | Should | FR-20, NFR-08 |
| US-22 | Melihat dashboard seluruh gedung | Pimpinan | Should | FR-12 |
| US-23 | Memilih aset lewat nomor aset atau QR | Pelapor | Could | FR-15 |
| US-24 | Konfirmasi selesai dan rating | Pelapor | Could | FR-16 |
| US-25 | Riwayat perbaikan per aset | Kaur | Could | FR-17 |

