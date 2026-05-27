# 🌿 Terrarium.fi - Blueprint & Arsitektur Teknis (Personal Use Edition)

Halo! Wah, ide **Terrarium.fi** ini seger banget! Konsep *finance tracker* yang gabungin *Natural Language Processing* (NLP) lewat Gemini API dengan UI/UX bertema alam organik itu brilian. Bikin pencatatan keuangan yang biasanya kaku dan membosankan jadi interaktif, asyik, dan serasa lagi ngerawat tanaman maya. 🌱

Sebagai Full-Stack Web Developer & UI/UX Designer kamu, saya udah siapin *blueprint* teknis yang *actionable*, *playful*, tapi tetap *solid* di *backend*-nya. *Let's dive in!*

---

## 1. 🛠️ Tech Stack, Deployment & UI/UX Guidelines

Untuk mencapai *vibe* organik yang *playful*, animasi mulus, dan performa *real-time*, berikut racikan teknologinya:

### Tech Stack & Deployment
*   **Frontend Framework:** **Next.js** (Sangat disarankan karena integrasi API *route*-nya mempermudah *fetching* aman ke Gemini API tanpa mengekspos API Key ke *client*).
*   **Deployment:** **Vercel (Free Tier)**. Tinggal *connect* ke GitHub repo kamu untuk *auto-deploy* setiap ada perubahan kode. Web ini akan *live* 24/7 dan bisa diakses dari semua *device*.
*   **Authentication:** **Supabase Magic Link**. Karena web ini cuma buat kamu sendiri (*Personal Use*), kita nggak butuh sistem login yang ribet atau RLS (Row Level Security) yang kompleks. Cukup siapkan satu form simpel: "Kirim magic link ke [email saya]", lalu cek email dan otomatis *login*.
*   **Styling:** **Vanilla CSS dengan CSS Modules** atau Tailwind CSS dengan kustomisasi *arbitrary values*. Kita hindari *framework utility* kaku karena kita butuh *organic shapes* dengan kustomisasi tingkat tinggi. 
*   **Animasi:** **Framer Motion**. Ini kunci buat bikin animasi *spring* yang *bouncy*, transisi halaman yang *smooth*, dan elemen interaktif yang terasa "hidup".
*   **Analytics / Charting:** **Recharts**. Fleksibel, berbasis React, dan kita bisa dengan mudah mengganti warnanya menjadi gradasi hijau alam atau bahkan menambahkan kustomisasi SVG supaya diagramnya tidak kaku (misal bentuk diagram lingkaran yang sedikit *wobbly*).
*   **Backend & Database:** **Supabase**. *Database* PostgreSQL tangguh, super kencang.
*   **AI Engine:** **Google Gemini API** (`@google/generative-ai`). Sangat pintar untuk *reasoning* teks bahasa gaul/sehari-hari.

### UI/UX Guidelines (The "Terrarium" Vibe)
*   **Color Palette (Earthy & Fresh):**
    *   `#FBFBF2` (Off-white/Cream) - Warna *background* utama, ngasih kesan hangat.
    *   `#2D6A4F` (Forest Green) - Warna primer untuk teks utama, tombol, dan elemen aktif.
    *   `#D8F3DC` (Soft Mint) - Warna *secondary* / *background card*.
    *   `#52B788` (Spring Green) - *Highlight* untuk **Pemasukan** (+).
    *   `#E07A5F` (Terracotta/Earthy Red) - *Highlight* untuk **Pengeluaran** (-).
*   **Shapes & Cards:** *Say no to sharp edges!* Gunakan *border-radius* asimetris untuk bikin bentuk amoeba/daun.
    *   *Contoh CSS:* `border-radius: 50% 50% 34% 66% / 56% 68% 32% 44%;` (Bisa dianimasikan pelan-pelan supaya seolah bernapas!).

---

## 2. 🗄️ Database Schema (Supabase / PostgreSQL)

Karena aplikasi ini diatur **khusus untuk satu pengguna (Personal Use)**, struktur *database* kita bisa sangat disederhanakan. Tidak ada kolom `user_id`, tidak butuh relasi ke `auth.users`, dan tanpa *Row Level Security* (RLS). Semua data otomatis milikmu.

```sql
-- Mengaktifkan UUID extension (jika belum)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabel Dompet (Wallets/Accounts)
CREATE TABLE wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) NOT NULL, -- cth: Cash, BCA, Gopay
  initial_balance DECIMAL(15, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabel Budgeting (Tanaman Keuangan)
CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category VARCHAR(50) NOT NULL, -- cth: Makanan, Transport
  monthly_limit DECIMAL(12, 2) NOT NULL,
  month_year DATE NOT NULL, -- Untuk tracking bulan spesifik
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(category, month_year) -- Cegah budget ganda per bulan
);

-- 3. Tabel Transaksi
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id UUID REFERENCES wallets(id) NOT NULL, -- Sumber uang
  batch_id UUID NOT NULL, -- ID kelompok transaksi dari 1 input AI
  amount DECIMAL(12, 2) NOT NULL,
  type VARCHAR(10) CHECK (type IN ('income', 'expense')) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50),
  raw_input_text TEXT, -- Teks asli (opsional)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes untuk mempercepat query
CREATE INDEX idx_transactions_date ON transactions(created_at);
CREATE INDEX idx_budgets_date ON budgets(month_year);
```

---

## 3. 🧠 AI Integration Logic (Gemini API)

System Prompt Gemini harus tetap pintar mendeteksi dompet atau sumber dana sesuai nama-nama *wallet* yang kamu *setup*.

### System Prompt untuk Gemini (Dinamis):

> [!IMPORTANT]
> **Daftar wallet di system prompt Gemini bersifat dinamis**. Saat frontend menembak `/api/parse-tx`, backend harus melakukan *fetch* ke tabel `wallets` di Supabase, lalu menyuntikkan nama-nama dompet yang aktif ke dalam string *prompt* di bawah ini sebelum dikirim ke Gemini. Jangan di-hardcode!

```text
Kamu adalah asisten keuangan cerdas bernama Terrarium. Tugasmu mengekstrak data transaksi dari teks bahasa gaul. 
Pengguna mungkin memasukkan beberapa transaksi sekaligus. Pisahkan semuanya dengan tepat.
Daftar Wallet (Dompet) pengguna saat ini: [ {DYNAMIC_WALLET_LIST} ]. (Default: dompet pertama jika tidak disebutkan).

Output HARUS SELALU JSON Array of Objects, tanpa teks tambahan.
Skema JSON:
{
  "amount": number (nilai absolut tanpa simbol),
  "type": "income" | "expense",
  "description": string,
  "category": string (cth: "Makanan", "Transport", "Hadiah"),
  "wallet": string (cocokkan dengan Daftar Wallet terdekat, atau default "Cash")
}

Contoh Input: "beli nasgor 15rb pake gopay, dari uang yang di kasih teteh 50rb masuk bca"
Contoh Output:
[
  { "amount": 50000, "type": "income", "description": "Uang dari teteh", "category": "Hadiah", "wallet": "BCA" },
  { "amount": 15000, "type": "expense", "description": "Nasi goreng", "category": "Makanan", "wallet": "Gopay" }
]
```

### 🛡️ Error Handling AI (Graceful Fallback)
AI nggak selalu sempurna. Kalau *prompt* bikin bingung atau Gemini nge-*return* JSON yang invalid (atau *timeout*):
- **Jangan sampai aplikasi *crash*.**
- **Sistem akan me-*catch* error tersebut.**
- **Munculkan Toast/Notifikasi ramah:** *"Oops, Terrarium agak bingung bacanya nih 🌿. Boleh masukin manual aja?"*
- **Arahkan/Buka otomatis** *Bottom Sheet Manual Entry*.

---

## 4. 🧩 Fitur, Component Blueprint & UX Concepts

### A. Fitur Onboarding (Setup Awal)
Saat kamu pertama kali berhasil login (pakai Magic Link) dan belum ada dompet yang terdaftar:
*   Aplikasi akan mengarahkanmu ke halaman **Setup Tamanmu**.
*   Di sini kamu akan diminta memasukkan nama-nama dompet awalmu (misal: Dompet Tunai, BCA, OVO). 
*   Setelah disave, dompet ini akan jadi *context* buat si Gemini saat baca input *chat* kamu.

### B. Fitur Budgeting (Konsep "Tanaman Layu")
Saat pengguna memasukkan pengeluaran, persentase budget kategori tersebut akan terhitung.
Di Dashboard, tampilkan animasi tanaman:
*   **0-50% Pemakaian:** Tanaman hijau segar dan berbunga (animasi daun bergoyang lembut).
*   **51-80% Pemakaian:** Tanaman mulai menguning sedikit.
*   **>80% Pemakaian:** Daun tanaman menunduk layu (animasi melengkung ke bawah menggunakan framer-motion) + notifikasi warna `#E07A5F` (Terracotta).

### C. Halaman Export Data (CSV)
Buat halaman (atau modal sederhana di *Settings*) yang isinya cuma satu tombol besar bernuansa organik: **Unduh Panen Data (CSV) 📊**. Tombol ini akan nge-*fetch* semua isi tabel `transactions` dan langsung mengonversinya ke *file* `.csv` untuk *backup* atau *reporting* eksternal.

### D. Form Manual Input (Saat Malas Chat)
UI tidak boleh berupa modal form kaku. Kita bikin form yang muncul dari bawah (*bottom sheet*) dengan *slider* angka atau *pill buttons* yang besar.

```jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ManualEntrySheet({ isOpen, onClose, wallets }) {
  const [amount, setAmount] = useState('');
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-forest-900 z-40" onClick={onClose}
          />
          <motion.div 
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            className="fixed bottom-0 left-0 right-0 bg-cream rounded-t-[40px] p-6 z-50 h-[80vh] shadow-[0_-10px_40px_rgba(45,106,79,0.1)]"
          >
            <div className="w-16 h-2 bg-mint-200 rounded-full mx-auto mb-8" />
            
            <h2 className="text-2xl font-fredoka text-forest-900 mb-6">Tambah Cepat 🌿</h2>
            
            <div className="flex gap-4 mb-6">
               <button className="flex-1 bg-mint-100 text-forest-900 py-3 rounded-[20px] font-bold">+ Pemasukan</button>
               <button className="flex-1 bg-terracotta/20 text-terracotta py-3 rounded-[20px] font-bold">- Pengeluaran</button>
            </div>
            
            <input 
              type="number"
              placeholder="0"
              className="w-full text-center text-5xl font-quicksand font-bold text-forest-900 bg-transparent border-b-2 border-mint-200 focus:border-forest-900 outline-none pb-4 mb-6"
            />
            
            {/* Wallet Selection */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {wallets.map(w => (
                <span key={w.id} className="px-4 py-2 bg-white rounded-full border border-mint-200 text-sm whitespace-nowrap">
                  {w.name}
                </span>
              ))}
            </div>
            
            <button className="w-full bg-forest-900 text-white py-4 rounded-[25px] mt-8 font-bold text-lg hover:scale-[1.02] transition-transform">
              Tanam Transaksi 🌱
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
```

### E. Analytics (Recharts + Custom SVG)
Menggunakan `<ResponsiveContainer>` dari **Recharts**, kita bisa me-*render* `AreaChart` yang ujung sudutnya di-haluskan (`type="monotone"`) dan menggunakan elemen `<defs>` untuk memberikan gradien hijau-ke-transparan dari atas ke bawah, supaya senada dengan desain alamnya. Tidak kaku dan estetik!

---

## 🚀 Next Steps

Gimana, desain dan arsitekturnya udah jauh lebih lengkap dan siap pakai buat aplikasi *finance tracker* personal beneran kan? 😎
Kalau kamu **Approve** revisi ini, kita bisa langsung lompat ke eksekusi nulis kodenya! 🌿
