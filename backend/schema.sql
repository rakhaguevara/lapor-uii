-- Jalankan sekali di Supabase: SQL Editor > New query > paste > Run.
create extension if not exists pgcrypto;

create table users (
  uuid          uuid primary key default gen_random_uuid(),
  full_name     text not null,
  email         text not null unique,
  password      text not null,
  role          text not null default 'PELAPOR',
  reporter_type text,
  is_active     boolean not null default true
);

create table locations (
  uuid      uuid primary key default gen_random_uuid(),
  name      text not null,
  type      text not null default 'BUILDING',
  is_active boolean not null default true
);

create table damage_categories (
  uuid uuid primary key default gen_random_uuid(),
  name text not null
);

create table reports (
  uuid          uuid primary key default gen_random_uuid(),
  ticket_seq    bigint generated always as identity,
  ticket_no     text generated always as ('LP-' || lpad(ticket_seq::text, 4, '0')) stored,
  title         text not null,
  building_uuid uuid not null references locations(uuid),
  floor         text not null default '',
  room_name     text not null,
  category_uuid uuid not null references damage_categories(uuid),
  description   text not null,
  photo_url     text not null default '',
  status        text not null default 'DITERIMA',
  priority      text not null default 'NORMAL',
  reporter_uuid uuid not null references users(uuid),
  created_at    timestamptz not null default now()
);

create table report_likes (
  report_uuid uuid references reports(uuid) on delete cascade,
  user_uuid   uuid references users(uuid) on delete cascade,
  primary key (report_uuid, user_uuid)
);

-- Server memakai service key (melewati RLS). RLS dinyalakan tanpa policy
-- supaya tabel tidak bisa dibuka lewat anon key dari browser.
alter table users enable row level security;
alter table locations enable row level security;
alter table damage_categories enable row level security;
alter table reports enable row level security;
alter table report_likes enable row level security;

-- Foto laporan (bucket publik)
insert into storage.buckets (id, name, public) values ('reports', 'reports', true) on conflict do nothing;

-- Data awal
insert into locations (name) values
  ('Gedung KH Mas Mansur'), ('Gedung KH Wahid Hasyim'), ('Gedung Moh. Hatta (Perpustakaan Pusat)'),
  ('Gedung Kuliah Umum Prof. Sardjito'), ('Auditorium KH Abdul Kahar Muzakir'), ('Masjid Ulil Albab'),
  ('Gedung Dr. Soekiman Wirjosandjojo (Fakultas Kedokteran)');

insert into damage_categories (name) values
  ('AC & Pendingin'), ('Proyektor'), ('Kursi & Meja'), ('Lampu'), ('Sound System'), ('Lift'), ('Lainnya');

-- Akun contoh (hash bcrypt dari pgcrypto, cocok dengan bcryptjs di server)
insert into users (full_name, email, password, role, reporter_type) values
  ('Aisyah Rahmawati', 'aisyah@uii.ac.id', crypt('password123', gen_salt('bf')), 'PELAPOR', 'MAHASISWA'),
  ('Admin Unit', 'admin@uii.ac.id', crypt('admin123', gen_salt('bf')), 'ADMIN_UNIT', null);

-- Laporan contoh
insert into reports (title, building_uuid, floor, room_name, category_uuid, description, status, reporter_uuid, created_at)
select v.title, (select uuid from locations where name = 'Gedung KH Mas Mansur'), v.floor, v.room,
       (select uuid from damage_categories where name = v.kategori), v.descr, v.status,
       (select uuid from users where email = 'aisyah@uii.ac.id'), v.tgl::timestamptz
from (values
  ('AC tidak dingin', 'Lantai 3', 'Ruang 3.12', 'AC & Pendingin', 'AC menyala tetapi tidak mengeluarkan udara dingin sejak pagi.', 'DITERIMA', '2026-11-18 09:41+07'),
  ('Lampu koridor mati', 'Lantai 1', 'Koridor', 'Lampu', 'Lampu di koridor lantai 1 mati sehingga area gelap.', 'DIPROSES', '2026-11-16 08:15+07'),
  ('Keran wastafel bocor', 'Lantai 2', 'Toilet', 'Lainnya', 'Keran wastafel bocor terus menerus.', 'SELESAI', '2026-11-12 10:30+07')
) as v(title, floor, room, kategori, descr, status, tgl);
