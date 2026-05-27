import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy_key');

export async function POST(req) {
  try {
    const { text, image } = await req.json();
    
    // Fetch dynamic wallets
    const { data: wallets } = await supabase.from('wallets').select('name, type');
    const regularWallets = wallets?.filter(w => w.type !== 'investasi').map(w => w.name).join(', ') || 'Cash';
    const investasiWallets = wallets?.filter(w => w.type === 'investasi').map(w => w.name).join(', ') || 'Tidak ada';
    
    const systemPrompt = `Kamu adalah asisten keuangan cerdas bernama Terrarium. Tugasmu mengekstrak data transaksi dari teks bahasa gaul atau gambar struk belanja / kuitansi / invoice / nota yang diberikan.
Pengguna mungkin memasukkan beberapa transaksi sekaligus (baik lewat teks maupun gambar). Pisahkan semuanya dengan tepat.

Daftar Wallet Regular: [${regularWallets}]
Daftar Wallet Investasi: [${investasiWallets}]
Semua wallet (regular maupun investasi) bisa menjadi sumber atau tujuan transfer. Default wallet jika tidak disebutkan: dompet regular pertama.

Jika pengguna mengunggah gambar struk belanja/kuitansi/nota/invoice:
1. Bacalah rincian teks pada struk dengan teliti.
2. Ekstrak jumlah total akhir belanja (total amount).
3. Buat deskripsi ringkas yang mendeskripsikan transaksi tersebut (cth: "Belanja Alfamart", "Makan Siang di KFC").
4. Tentukan kategori yang cocok (cth: "Makanan" untuk restoran, "Belanja" untuk minimarket/supermarket, "Tagihan" untuk listrik/internet, "Kesehatan" untuk obat/apotek).
5. Secara default, tipe transaksi untuk struk belanja/kuitansi adalah "expense" (pengeluaran), kecuali jika ada indikasi jelas itu adalah tanda terima uang masuk ("income").
6. Jika pengguna menyertakan teks tambahan (misal: "pake gopay"), cocokkan kata kunci wallet tersebut dengan Daftar Wallet.

Output HARUS SELALU JSON Array of Objects, tanpa teks markdown tambahan.

Skema JSON untuk transaksi biasa:
{
  "amount": number (nilai absolut tanpa simbol),
  "type": "income" | "expense",
  "description": string,
  "category": string (cth: "Makanan", "Transport", "Hadiah", "Belanja"),
  "wallet": string (cocokkan dengan Daftar Wallet terdekat)
}

Jika input mengandung kata transfer, pindah, kirim ke, tarik ke, atau sejenisnya ANTAR dua wallet yang ada di daftar wallet pengguna, output-nya adalah array dengan DUA objek:
- Objek pertama: type "expense", wallet sumber, category "Transfer"
- Objek kedua: type "income", wallet tujuan, category "Transfer"
Contoh input: "pindah 200rb dari BCA ke GoPay"
Contoh output:
[
  { "amount": 200000, "type": "expense", "description": "Transfer ke GoPay", "category": "Transfer", "wallet": "BCA" },
  { "amount": 200000, "type": "income", "description": "Transfer dari BCA", "category": "Transfer", "wallet": "GoPay" }
]

Jika input mengandung kata pinjam, hutang, minjem, utang, nyicil, bayar hutang, nagih, piutang, atau sejenisnya, gunakan skema debt_event:
{
  "amount": number (total jumlah pinjaman),
  "type": "debt_event",
  "debt_type": "hutang" | "piutang",
  "contact_name": string (nama teman/pinjol),
  "description": string,
  "wallet": string,
  "is_installment": boolean,
  "installment_amount": number (opsional, jika cicilan),
  "installment_months": number (opsional, jika cicilan),
  "due_day": number (opsional, tanggal jatuh tempo tiap bulan)
}

Hutang = kamu yang pinjam uang (uang masuk ke kantongmu). Piutang = kamu yang meminjamkan uang ke orang lain (uang keluar dari kantongmu).`;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Construct multimodal parts
    const parts = [];
    if (text) {
      parts.push({ text: `Catatan/teks pengguna: ${text}` });
    }
    if (image) {
      const mimeType = image.split(';')[0].split(':')[1];
      const base64Data = image.split(',')[1];
      parts.push({
        inlineData: {
          data: base64Data,
          mimeType: mimeType
        }
      });
    }

    if (parts.length === 0) {
      return NextResponse.json({ error: 'No input provided' }, { status: 400 });
    }

    const result = await model.generateContent({
      contents: [{ role: 'user', parts }],
      systemInstruction: { role: 'system', parts: [{ text: systemPrompt }] },
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const responseText = result.response.text();
    const transactions = JSON.parse(responseText);

    return NextResponse.json({ transactions });
  } catch (error) {
    console.error('Gemini parsing error:', error);
    return NextResponse.json({ error: 'Failed to parse transactions' }, { status: 500 });
  }
}
