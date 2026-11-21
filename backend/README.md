# Backend (belum dibuat)

Folder ini sengaja kosong dari kode. Backend dikerjakan tim Backend BSI UII.
Frontend (folder `frontend/`) hanya menunggu kontrak API.

## Cara frontend dan backend bertemu

```
frontend (Angular)  ──  HTTP + JSON  ──►  backend (API)  ──►  database
```

Selama API belum ada, frontend memakai data mock di
`frontend/src/app/core/report.service.ts` dan `auth.service.ts`.
Saat API siap, hanya isi dua service itu yang diganti dengan `HttpClient`.

## Yang dibutuhkan frontend dari backend

Ini **usulan** dari PTD bagian 7.2, bukan kontrak final. Bentuk resminya
menunggu spesifikasi OpenAPI dari Backend.

| Domain | Kebutuhan | Dipakai di halaman |
|---|---|---|
| Auth | Masuk, keluar, profil dan peran | Login, header |
| Gedung | Daftar gedung aktif (dengan pencarian) | Form Buat laporan, filter |
| Laporan | Buat (dengan unggah foto), daftar milik saya, daftar publik, detail | Beranda, Buat laporan, Laporan Saya, Laporan publik, Detail |
| Like | Beri dan batalkan | Laporan publik |

Domain lain (tugas teknisi, ubah status, notifikasi, dashboard, ekspor, kelola akun)
ada di PTD bagian 7.2 dan baru relevan saat portal Teknisi, Kaur, dan Admin dibangun.

## Hal yang harus dijaga backend (bukan frontend)

- Hak akses per peran dan lingkup gedung. Frontend hanya menyembunyikan tampilan.
- Validasi foto (tipe dan ukuran maksimal 5 MB) dan semua isian form.
- Nama pelapor disamarkan pada daftar publik.
- Sesi lewat cookie HttpOnly, serta CORS untuk alamat frontend.
- Nomor tiket (contoh `LP-0146`) dan status awal `Dikirim`.

## Keputusan terbuka yang memengaruhi API

Lihat PRD bagian 13 dan PTD bagian 12: model status (3 atau 9), autentikasi
(email dan password atau SSO UIIGateway), format spesifikasi API, dan jadwal rilisnya.
