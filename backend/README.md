# Backend IM-Care

Express + Supabase (Postgres untuk data, Storage untuk foto). Mengikuti kontrak API referensi
<https://backend-sira-production.up.railway.app/api/documentation>:
jawaban `{ status, msg, data }`, id lewat query (`?uuid=...`), login pakai Bearer token.

## Setup Supabase (sekali saja)

1. Buat project di <https://supabase.com>.
2. Buka **SQL Editor**, paste isi `schema.sql`, klik **Run**
   (membuat tabel, bucket foto `reports`, gedung, kategori, 2 akun contoh, 3 laporan contoh).
3. Salin `.env.example` menjadi `.env`, isi `SUPABASE_URL` dan `SUPABASE_SERVICE_KEY`
   (Project Settings > API > `service_role`). Kunci ini rahasia, hanya untuk server.

## Menjalankan

```
cd backend
npm install
npm start          # http://localhost:3000
```

Di terminal lain: `cd frontend && npm start`. Proxy di `frontend/proxy.conf.json`
meneruskan `/api` ke port 3000, jadi tidak ada masalah CORS.

## Akun contoh

| Email | Password | Peran |
|---|---|---|
| aisyah@uii.ac.id | password123 | PELAPOR |
| admin@uii.ac.id | admin123 | ADMIN_UNIT |

## Endpoint

| Method | Path | Keterangan |
|---|---|---|
| POST | /api/auth/register, /login, /logout, /change-password | |
| GET | /api/auth/me | |
| GET | /api/locations, /locations/detail | gedung |
| GET | /api/damage-categories | kategori |
| POST | /api/reports | multipart, foto JPG/PNG maks 5 MB |
| GET | /api/reports | khusus petugas |
| GET | /api/reports/my-reports, /public, /detail | detail pakai `?ticket_no=` atau `?uuid=` |
| POST | /api/reports/like?uuid= | like / batal like |
| POST | /api/reports/status?uuid= | khusus petugas |

Belum dibuat dari referensi: admin users, facilities, notifications, dashboard, export,
assign/priority/confirm/reopen, dan pagination (`per_page`).
