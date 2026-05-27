import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const { data, error } = await supabase
    .from('transactions')
    .select('*, wallets(name)')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const csvRows = [
    ['Tanggal', 'Dompet', 'Tipe', 'Kategori', 'Jumlah', 'Deskripsi']
  ];

  data.forEach(tx => {
    csvRows.push([
      new Date(tx.created_at).toISOString(),
      tx.wallets?.name || 'Unknown',
      tx.type,
      tx.category,
      tx.amount,
      `"${tx.description.replace(/"/g, '""')}"`
    ]);
  });

  const csvString = csvRows.map(row => row.join(',')).join('\n');

  return new NextResponse(csvString, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="terrarium_export.csv"',
    },
  });
}
