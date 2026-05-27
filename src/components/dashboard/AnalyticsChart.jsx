'use client';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export default function AnalyticsChart({ data }) {
  // data format expected: [{ date: 'Mon', expense: 4000, income: 2400 }, ...]
  
  return (
    <div className="w-full h-[250px] bg-white rounded-[32px] p-6 shadow-[0_8px_32px_rgba(45,106,79,0.05)] border border-mint">
      <h3 className="text-lg font-fredoka text-forest mb-4">Tren Keuangan 📈</h3>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#52B788" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#52B788" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#E07A5F" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#E07A5F" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#2D6A4F', opacity: 0.7 }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#2D6A4F', opacity: 0.7 }} />
          <Tooltip 
            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
            itemStyle={{ fontFamily: 'var(--font-quicksand)', fontWeight: 'bold' }}
            labelStyle={{ fontFamily: 'var(--font-fredoka)', color: '#2D6A4F' }}
          />
          <Area type="monotone" dataKey="income" stroke="#52B788" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
          <Area type="monotone" dataKey="expense" stroke="#E07A5F" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
