-- ==========================================================
-- UMC UPDATE - SUPABASE DATABASE & SECURITY SETUP
-- Jalankan seluruh isi file ini di Supabase > SQL Editor.
-- ==========================================================

create extension if not exists pgcrypto;

-- Profil akun: mahasiswa dibuat otomatis saat mendaftar.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nama text not null default '',
  nim text unique,
  role text not null default 'mahasiswa' check (role in ('mahasiswa', 'admin')),
  created_at timestamptz not null default now()
);

-- Konten pengumuman. Kolom lama dipertahankan agar data lama tetap ada.
create table if not exists public.pengumuman (
  id text primary key default gen_random_uuid()::text,
  judul text not null,
  isi text not null,
  kategori text not null default 'Akademik',
  tanggal_pengumuman date,
  gambar_url text,
  created_at timestamptz not null default now()
);
alter table public.pengumuman add column if not exists gambar_url text;
alter table public.pengumuman add column if not exists created_at timestamptz not null default now();
alter table public.pengumuman add column if not exists tanggal_pengumuman date;

-- Berita kampus.
create table if not exists public.berita (
  id text primary key default gen_random_uuid()::text,
  judul text not null,
  isi text not null,
  kategori text not null default 'Kampus',
  tanggal_pengumuman date,
  gambar_url text,
  created_at timestamptz not null default now()
);

-- Agenda akademik (KRS, UTS, UAS, dan agenda lain).
create table if not exists public.agenda_akademik (
  id text primary key default gen_random_uuid()::text,
  judul text not null,
  isi text not null,
  kategori text not null default 'Akademik',
  tanggal_pengumuman date,
  gambar_url text,
  created_at timestamptz not null default now()
);

-- Buat profil otomatis dari metadata pendaftaran Supabase Auth.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nama, nim, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nama', ''),
    nullif(new.raw_user_meta_data->>'nim', ''),
    'mahasiswa'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Fungsi pemeriksaan admin untuk kebijakan RLS.
create or replace function public.is_umc_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Aktifkan RLS.
alter table public.profiles enable row level security;
alter table public.pengumuman enable row level security;
alter table public.berita enable row level security;
alter table public.agenda_akademik enable row level security;

-- Profil: user hanya dapat membaca profilnya sendiri. Role tidak bisa diubah dari browser.
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin" on public.profiles
for select to authenticated
using (id = auth.uid() or public.is_umc_admin());

drop policy if exists "profiles_update_own_name" on public.profiles;
create policy "profiles_update_own_name" on public.profiles
for update to authenticated
using (id = auth.uid())
with check (id = auth.uid() and role = 'mahasiswa');

-- Semua orang boleh membaca konten; hanya admin yang boleh mengelola.
do $$
declare t text;
begin
  foreach t in array array['pengumuman', 'berita', 'agenda_akademik'] loop
    execute format('drop policy if exists %I on public.%I', t || '_public_read', t);
    execute format('create policy %I on public.%I for select to anon, authenticated using (true)', t || '_public_read', t);
    execute format('drop policy if exists %I on public.%I', t || '_admin_insert', t);
    execute format('create policy %I on public.%I for insert to authenticated with check (public.is_umc_admin())', t || '_admin_insert', t);
    execute format('drop policy if exists %I on public.%I', t || '_admin_update', t);
    execute format('create policy %I on public.%I for update to authenticated using (public.is_umc_admin()) with check (public.is_umc_admin())', t || '_admin_update', t);
    execute format('drop policy if exists %I on public.%I', t || '_admin_delete', t);
    execute format('create policy %I on public.%I for delete to authenticated using (public.is_umc_admin())', t || '_admin_delete', t);
  end loop;
end $$;

-- Bucket gambar publik. File hanya dapat diunggah/diubah/dihapus oleh admin.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('gambar-kampus', 'gambar-kampus', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true, file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg','image/png','image/webp'];

drop policy if exists "gambar_kampus_public_read" on storage.objects;
create policy "gambar_kampus_public_read" on storage.objects
for select to anon, authenticated
using (bucket_id = 'gambar-kampus');

drop policy if exists "gambar_kampus_admin_upload" on storage.objects;
create policy "gambar_kampus_admin_upload" on storage.objects
for insert to authenticated
with check (bucket_id = 'gambar-kampus' and public.is_umc_admin());

drop policy if exists "gambar_kampus_admin_update" on storage.objects;
create policy "gambar_kampus_admin_update" on storage.objects
for update to authenticated
using (bucket_id = 'gambar-kampus' and public.is_umc_admin())
with check (bucket_id = 'gambar-kampus' and public.is_umc_admin());

drop policy if exists "gambar_kampus_admin_delete" on storage.objects;
create policy "gambar_kampus_admin_delete" on storage.objects
for delete to authenticated
using (bucket_id = 'gambar-kampus' and public.is_umc_admin());

-- ==========================================================
-- SETELAH SQL BERHASIL:
-- 1. Daftarkan akun mahasiswa dari halaman website.
-- 2. Untuk membuat admin: daftar akun terlebih dahulu melalui website,
--    lalu jalankan query di bawah dengan email akun yang dimaksud.
-- ==========================================================
-- update public.profiles p
-- set role = 'admin'
-- from auth.users u
-- where p.id = u.id and u.email = 'EMAIL_ADMIN_KAMU';
