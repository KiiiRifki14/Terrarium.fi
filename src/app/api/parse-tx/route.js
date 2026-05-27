import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy_key');

export async function POST(req) {
  try {
    const { text } = await req.json();
    
    // Fetch dynamic wallets
    const { data: wallets } = await supabase.from('wallets').select('name');
    const walletNames = wallets?.map(w => w.name).join(', ') || 'Cash';
    
    const systemPrompt = `Kamu adalah asisten keuangan cerdas bernama Terrarium. Tugasmu mengekstrak data transaksi dari teks bahasa gaul. 
Pengguna mungkin memasukkan beberapa transaksi sekaligus. Pisahkan semuanya dengan tepat.
Daftar Wallet (Dompet) pengguna saat ini: [${walletNames}]. (Default: dompet pertama jika tidak disebutkan).

Output HARUS SELALU JSON Array of Objects, tanpa teks tambahan.
Skema JSON:
{
  "amount": number (nilai absolut tanpa simbol),
  "type": "income" | "expense",
  "description": string,
  "category": string (cth: "Makanan", "Transport", "Hadiah"),
  "wallet": string (cocokkan dengan Daftar Wallet terdekat, atau default dompet pertama)
}`;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text }] }],
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
