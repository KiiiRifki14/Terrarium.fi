'use client';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export default function AnalyticsChart({ data, mode = 'both' }) {
  // data format expected: [{ date: 'Mon', expense: 4000, income: 2400 }, ...]
  
  return (
    <div className="w-full h-[290px] bg-white rounded-[32px] p-6 shadow-[0_8px_32px_rgba(45,106,79,0.05)] border border-mint flex flex-col">
      <h3 className="text-lg font-fredoka text-forest mb-4 shrink-0 font-bold">
        {mode === 'expense-only' ? 'Tren Pengeluaran (7 Hari Terakhir) 📈' : 'Tren Keuangan 📈'}
      </h3>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
            <defs>
              <linearGradient id="colorGreen" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#52B788" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#52B788" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorRed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#E07A5F" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#E07A5F" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#D8F3DC" opacity={0.3} vertical={false} />
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 11, fill: '#2D6A4F', opacity: 0.8, fontFamily: 'var(--font-quicksand)', fontWeight: 'bold' }} 
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 11, fill: '#2D6A4F', opacity: 0.8, fontFamily: 'var(--font-quicksand)', fontWeight: 'bold' }} 
            />
            <Tooltip 
              contentStyle={{ borderRadius: '16px', border: '1px solid #D8F3DC', boxShadow: '0 8px 24px rgba(45,106,79,0.08)' }}
              itemStyle={{ fontFamily: 'var(--font-quicksand)', fontWeight: 'bold' }}
              labelStyle={{ fontFamily: 'var(--font-fredoka)', color: '#2D6A4F', fontWeight: 'bold' }}
            />
            {mode === 'expense-only' ? (
              <Area type="monotone" dataKey="expense" name="Pengeluaran" stroke="#52B788" strokeWidth={3} fillOpacity={1} fill="url(#colorGreen)" />
            ) : (
              <>
                <Area type="monotone" dataKey="income" name="Pemasukan" stroke="#52B788" strokeWidth={3} fillOpacity={1} fill="url(#colorGreen)" />
                <Area type="monotone" dataKey="expense" name="Pengeluaran" stroke="#E07A5F" strokeWidth={3} fillOpacity={1} fill="url(#colorRed)" />
              </>
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

