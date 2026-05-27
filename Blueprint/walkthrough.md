# 🌿 Terrarium.fi - Deployment & Setup Walkthrough

Semua *codebase* untuk **Terrarium.fi** sudah selesai di-generate dan siap untuk dipakai! Aplikasi ini dirancang seringan mungkin, khusus untuk kamu sendiri (*Personal Use*), dengan AI yang pintar, dan UI yang organik.

Berikut adalah langkah-langkah mudah untuk menyalakan aplikasimu.

---

## 1. 🔑 Persiapan API Keys

Sebelum menjalankan aplikasi, kamu butuh 2 layanan gratis: Supabase dan Google Gemini.

### A. Setup Supabase
1. Buka [Supabase](https://supabase.com) dan buat *Project* baru.
2. Masuk ke menu **SQL Editor** di panel kiri.
3. *Copy* semua isi dari file `schema.sql` (bisa kamu temukan di dalam folder project ini) dan paste ke SQL Editor.
4. Klik **Run** untuk membuat semua tabel (`wallets`, `budgets`, `transactions`).
5. Buka menu **Project Settings > API**, lalu salin:
   - **Project URL**
   - **Project API Key (anon/public)**

### B. Setup Gemini API
1. Buka [Google AI Studio](https://aistudio.google.com/).
2. Buat **API Key** baru secara gratis.
3. Salin API Key tersebut.

---

## 2. 💻 Setup Local Environment

Buka file `.env.local.example` di dalam *project* kamu, ganti isinya dengan kunci yang sudah kamu dapatkan, lalu **ubah nama filenya** menjadi `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
GEMINI_API_KEY=AIzaSy...
```

Untuk mencoba aplikasinya di komputer kamu:
1. Buka terminal di folder `Terrarium.fi`.
2. Jalankan perintah: `npm run dev`
3. Buka browser di `http://localhost:3000`.

---

## 3. 🚀 Deploy ke Vercel (Gratis 24/7)

Karena ini aplikasi Next.js, Vercel adalah tempat terbaik untuk deploy (gratis untuk *Personal Use*).

> [!IMPORTANT]
> Pastikan kamu sudah meng-*commit* semua kode ini dan mem-push-nya ke repositori **GitHub** pribadimu (private repository agar aman).

1. Buat akun / Login ke [Vercel](https://vercel.com).
2. Klik **Add New... > Project**.
3. Import repositori GitHub `Terrarium.fi` milikmu.
4. Di bagian **Environment Variables**, masukkan 3 kunci rahasiamu:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `GEMINI_API_KEY`
5. Klik **Deploy**.
6. Dalam 1-2 menit, aplikasimu akan mendapatkan URL publik (misal: `https://terrarium-fi.vercel.app`) dan bisa kamu akses dari HP kapan pun kamu mau.

---

## 4. 🪴 Cara Menggunakan Aplikasi

> [!TIP]
> **Setup Pertama Kali:** Saat pertama buka aplikasinya, kamu harus login pakai email (Magic Link). Supabase otomatis mengirimkan *link* ke emailmu. Setelah itu, halaman **Onboarding** akan muncul untuk mendaftarkan dompet pertamamu.

- **AI Chat Input:** Di bagian bawah layar, kamu bisa mengetik gaya bebas. Contoh: *"beli nasgor 15rb pake gopay, dari sisa kembalian indomaret 50rb dapet cash"*. Gemini akan otomatis memisahkan transaksi ini dan memasukkannya ke dompet Gopay & Cash!
- **Manual Input:** Kalau malas ngetik, klik tombol **+ Tambah Cepat**. Formulir *Bottom Sheet* yang *bouncy* akan muncul untuk kamu geser-geser angka.
- **Export Data:** Di sudut kanan atas ada ikon `Download`. Klik itu kapan saja untuk mengunduh seluruh transaksi ke dalam format Excel/CSV.

Selamat berkebun di Terrarium keuanganmu! 🌱💸
