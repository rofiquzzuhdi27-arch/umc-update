# UMC UPDATE - Panduan Update

## Teknologi
- React + Vite
- Supabase Auth untuk login dan pendaftaran mahasiswa
- Supabase Database (PostgreSQL) untuk pengumuman, berita, agenda akademik, dan profil
- Supabase Storage untuk gambar

## 1. Pasang source code
Ekstrak folder proyek, buka folder `UMC-UPDATE` di VS Code, lalu jalankan:

```bash
npm install
npm run dev
```

Buka alamat lokal yang muncul di terminal (biasanya `http://localhost:5173`).

## 2. Atur Supabase
File `.env` berisi `VITE_SUPABASE_URL` dan `VITE_SUPABASE_PUBLISHABLE_KEY`. Keduanya adalah konfigurasi frontend/publishable key, bukan service-role secret. Jangan pernah menaruh `service_role` key di file frontend.

Di Supabase, buka **SQL Editor > New query**, salin seluruh isi file `supabase_setup.sql`, lalu tekan **Run**. Script ini menyiapkan tabel `profiles`, `pengumuman`, `berita`, `agenda_akademik`, kebijakan RLS, trigger pembuatan profil, dan bucket Storage `gambar-kampus`.

> Jika tabel `pengumuman` sudah berisi data lama, script menggunakan `create table if not exists` dan menambahkan kolom `gambar_url` tanpa menghapus isi tabel. Pastikan struktur kolom lamanya memakai nama `id`, `judul`, `isi`, `kategori`, dan `tanggal_pengumuman`.

## 3. Pendaftaran dan login mahasiswa
1. Buka menu **Masuk / Daftar**.
2. Pilih **Mahasiswa**.
3. Klik **Belum punya akun? Daftar mahasiswa**.
4. Isi nama, NIM, email, dan password minimal 8 karakter.
5. Jika konfirmasi email aktif di Supabase, buka email dan verifikasi terlebih dahulu.
6. Masuk menggunakan email dan password yang didaftarkan.

Pendaftaran mandiri hanya untuk mahasiswa. Role mahasiswa dibuat otomatis dan tidak dapat dipilih sendiri menjadi admin.

## 4. Membuat akun administrator
1. Daftarkan akun admin melalui form pendaftaran mahasiswa seperti langkah di atas.
2. Di Supabase buka **SQL Editor** dan jalankan query berikut, ganti email dengan email akun yang didaftarkan:

```sql
update public.profiles p
set role = 'admin'
from auth.users u
where p.id = u.id
  and u.email = 'email-admin-kamu@contoh.com';
```

3. Keluar dari website, lalu masuk lagi dengan memilih **Administrator**.

Jangan membuat pilihan pendaftaran admin terbuka untuk publik. Role admin harus diberikan dari dashboard Supabase oleh pemilik proyek.

## 5. Mengelola informasi dan gambar
1. Masuk sebagai administrator.
2. Buka **Dashboard Admin**.
3. Pilih tab Pengumuman, Berita Kampus, atau Agenda Akademik.
4. Isi judul, kategori, tanggal, dan isi informasi.
5. Pilih gambar JPG/PNG/WEBP maksimal 5 MB bila diperlukan.
6. Klik **Tambahkan Informasi**.
7. Data akan tampil di halaman publik dan gambar tersimpan di Storage Supabase.
8. Tombol Edit dan Hapus tersedia pada daftar konten di dashboard.

KRS, UTS, dan UAS merupakan kategori agenda yang perlu diisi oleh admin dengan tanggal dan ketentuan yang sudah diverifikasi dari pengumuman resmi kampus. Website tidak mengarang tanggal akademik.

## 6. Fitur yang diperbaiki
- Navigasi berita kampus dan agenda akademik dapat dibuka.
- Kartu berita dan agenda dapat diklik untuk membaca detail.
- Konten berita dan agenda tersimpan di Supabase, bukan hanya ditulis di kode.
- Login memakai Supabase Auth, bukan username/password demo di source code.
- Mahasiswa dapat mendaftar dengan email, nama, NIM, dan password.
- Admin dapat tambah, edit, hapus pengumuman, berita, dan agenda.
- Admin dapat mengunggah gambar ke Supabase Storage.
- Kebijakan RLS membatasi operasi pengelolaan konten dan upload gambar untuk admin.

## Catatan keamanan
Jangan bagikan password, `service_role` key, atau kredensial admin. Publishable key boleh berada di frontend karena akses data dilindungi oleh RLS. Untuk akun admin, aktifkan verifikasi email dan gunakan password kuat.
