# 🌿 Terrarium.fi - Execution Tasks

- [x] **1. Navigation & Layout Responsive Setup**
  - [x] Buat komponen `Navigation.jsx` (Sidebar di desktop >= 768px, Bottom Nav di mobile < 768px)
  - [x] Integrasikan `Navigation` di `src/app/page.js` dan setup state `activeTab`
  - [x] Sesuaikan padding layout utama agar konten tidak bertabrakan dengan Sidebar (desktop) or Bottom Nav (mobile)

- [x] **2. UI Component Enhancements**
  - [x] Edit `src/components/dashboard/BudgetPlant.jsx` untuk menambahkan teks peringatan jika limit > 80%
  - [x] Pastikan warna progress bar budget: 0-50% `bg-spring`, 51-80% `bg-yellow-500`, >80% `bg-terracotta`

- [x] **3. Tab 1: Beranda (Dashboard)**
  - [x] Tampilkan **Summary Cards** (Pemasukan vs Pengeluaran bulan ini)
  - [x] Tampilkan **Wallet Cards Row** (Horizontal scroll dengan kalkulasi saldo dinamis)
  - [x] Tampilkan **Chart Pengeluaran** (Recharts AreaChart 7 hari terakhir dengan gradien hijau)
  - [x] Tampilkan **Riwayat Terkini** (List transaksi terbaru dari database + category emojis)

- [x] **4. Tab 2: Analitik (Analytics Detail)**
  - [x] Tampilkan summary box untuk rasio tabungan (saving rate)
  - [x] Tampilkan **Income vs Expense Trend Chart**
  - [x] Tampilkan **Breakdown Kategori** (Horizontal BarChart dari kategori teratas)

- [x] **5. Tab 3: Budget (Taman Pengeluaran)**
  - [x] Tampilkan semua Budget Plants
  - [x] Buat form "Tanam Budget Baru" di tab Budget

- [x] **6. Tab 4: Pengaturan (Settings)**
  - [x] Buat fitur "Kelola Dompet" (List dompet, Tambah Dompet, Hapus Dompet beserta transaksinya)
  - [x] Integrasikan tombol Unduh CSV dan Tombol Logout

- [x] **7. Tab 5: Manajemen Hutang & Piutang**
  - [x] Desain skema tabel `debts`, `debt_payments`, dan `push_subscriptions`
  - [x] Tambahkan tab ke-5 "Hutang" pada Bottom Nav dan Sidebar (`Navigation.jsx`)
  - [x] Implementasikan komponen visual kartu hutang `DebtCard.jsx` dengan indikator jatuh tempo dan cicilan
  - [x] Buat bottom sheet `AddDebtSheet.jsx` untuk mendaftarkan hutang/piutang baru
  - [x] Buat bottom sheet `DebtPaymentSheet.jsx` untuk mencatat pembayaran/penerimaan dana cicilan
  - [x] Hubungkan semua aksi transaksi pembayaran hutang untuk memotong/menambah saldo wallet terkait

- [x] **8. Integrasi Gemini NLP Parser & Push Notifications**
  - [x] Update system prompt Gemini di `/api/parse-tx` untuk mendukung input terstruktur `debt_event`
  - [x] Setup service worker `sw.js` untuk mendengarkan push event
  - [x] Buat route API `/api/push/subscribe` dan `/api/push/send` untuk registrasi VAPID dan pengiriman notifikasi
  - [x] Implementasikan scheduler harian di `/api/cron/debt-reminder` untuk memindai jatuh tempo cicilan (H-3, H-1, H-0)

- [x] **9. Verification & Polish**
  - [x] Verifikasi build aplikasi Next.js berjalan tanpa kendala
  - [x] Pastikan seluruh data terintegrasi penuh dan responsif di mobile maupun desktop

- [x] **10. Fitur Interaktif (Terrarium Pet Companion)**
  - [x] Implementasikan komponen `InteractiveTerrarium.jsx` dengan mini garden dan kucing Tumi
  - [x] Tambahkan interaksi siram air, makan ikan, dan main bola benang dengan animasi Framer Motion
  - [x] Integrasikan pertumbuhan pohon secara dinamis berdasarkan saving rate bulanan
  - [x] Sinkronkan statistik level dan kasih sayang kucing secara persisten menggunakan local storage

- [x] **11. Fitur Perintah Suara (Voice-to-Text)**
  - [x] Integrasikan Web Speech API (SpeechRecognition) dengan pelokalan Bahasa Indonesia (`id-ID`)
  - [x] Tambahkan tombol mikrofon interaktif dengan efek denyut merah (*pulse*) saat merekam suara
  - [x] Sambungkan hasil transkripsi suara langsung ke dalam kolom input teks obrolan AI
  - [x] Sediakan *graceful fallback* (peringatan ramah) jika peramban pengguna belum mendukung Web Speech API

- [x] **12. Fitur Unggah & Pemindaian Struk (Receipt OCR Vision)**
  - [x] Tambahkan tombol lampiran `Paperclip` untuk memilih file gambar struk belanja
  - [x] Tampilkan pratinjau thumbnail mini struk belanja di dalam chat bar dengan opsi pembatalan (tombol silang `X`)
  - [x] Konversikan gambar menjadi Base64 dan kirimkan ke endpoint `/api/parse-tx` via payload POST
  - [x] Perluas API route Gemini untuk menerima data `image` (inlineData) dan memproses rincian struk (total belanja, kategori, deskripsi) secara cerdas menggunakan model Vision



