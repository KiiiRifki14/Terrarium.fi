'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import OrganicCard from '@/components/ui/OrganicCard';
import FloatingChatInput from '@/components/ui/FloatingChatInput';
import ManualEntrySheet from '@/components/ui/ManualEntrySheet';
import BudgetPlant from '@/components/dashboard/BudgetPlant';
import AnalyticsChart from '@/components/dashboard/AnalyticsChart';
import WalletSetup from '@/components/onboarding/WalletSetup';
import { Download, Plus } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [wallets, setWallets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [chartData, setChartData] = useState([]);
  
  const [isManualSheetOpen, setIsManualSheetOpen] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const fetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
      return;
    }
    setUser(session.user);

    // Fetch wallets
    const { data: wData } = await supabase.from('wallets').select('*');
    setWallets(wData || []);

    if (wData?.length > 0) {
      // Fetch recent transactions
      const { data: txData } = await supabase.from('transactions').select('*').order('created_at', { ascending: false }).limit(20);
      setTransactions(txData || []);

      // Fetch budgets
      const { data: bData } = await supabase.from('budgets').select('*');
      setBudgets(bData || []);

      // Process chart data (simple example grouped by date)
      const grouped = (txData || []).reduce((acc, tx) => {
        const date = new Date(tx.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
        if (!acc[date]) acc[date] = { date, income: 0, expense: 0 };
        if (tx.type === 'income') acc[date].income += parseFloat(tx.amount);
        if (tx.type === 'expense') acc[date].expense += parseFloat(tx.amount);
        return acc;
      }, {});
      setChartData(Object.values(grouped).reverse());
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [router]);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  const handleAiSubmit = async (text) => {
    setIsAiLoading(true);
    try {
      const res = await fetch('/api/parse-tx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      
      if (!res.ok) throw new Error('API Error');
      
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // Save to Supabase
      const batch_id = crypto.randomUUID();
      const inserts = data.transactions.map(tx => {
        const matchedWallet = wallets.find(w => w.name.toLowerCase() === tx.wallet?.toLowerCase()) || wallets[0];
        return {
          wallet_id: matchedWallet.id,
          batch_id,
          amount: parseFloat(tx.amount),
          type: tx.type,
          description: tx.description,
          category: tx.category,
          raw_input_text: text
        };
      });

      const { error } = await supabase.from('transactions').insert(inserts);
      if (error) throw error;
      
      showToast('🌿 Transaksi berhasil ditanam!');
      fetchData(); // Refresh
    } catch (err) {
      console.error(err);
      showToast('Oops, Terrarium bingung bacanya nih 🌿. Boleh manual aja?');
      setIsManualSheetOpen(true);
    } finally {
      setIsAiLoading(false);
    }
  };

  const totalBalance = wallets.reduce((acc, w) => acc + parseFloat(w.initial_balance), 0) + 
                       transactions.reduce((acc, tx) => acc + (tx.type === 'income' ? parseFloat(tx.amount) : -parseFloat(tx.amount)), 0);

  if (loading) return <div className="min-h-screen bg-cream flex items-center justify-center text-forest font-fredoka text-2xl animate-pulse">Memuat...</div>;
  if (wallets.length === 0) return <WalletSetup onComplete={fetchData} />;

  return (
    <div className="min-h-screen bg-cream pb-32">
      {/* Header */}
      <header className="p-6 pt-10 flex justify-between items-center">
        <h1 className="text-2xl font-fredoka text-forest">Terrarium.fi</h1>
        <button 
          onClick={async () => {
            const res = await fetch('/api/transactions/export');
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'terrarium_export.csv';
            a.click();
          }}
          className="p-2 bg-mint/50 rounded-full text-forest hover:bg-mint transition-colors"
          title="Unduh Panen Data (CSV) 📊"
        >
          <Download size={20} />
        </button>
      </header>

      <main className="px-4 md:max-w-2xl md:mx-auto space-y-6">
        {/* Total Balance Card */}
        <OrganicCard type="income" className="text-center py-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl">🌿</div>
          <p className="text-forest/70 font-quicksand font-bold mb-2">Total Saldo</p>
          <h2 className="text-5xl font-quicksand font-bold text-forest">
            Rp {totalBalance.toLocaleString('id-ID')}
          </h2>
        </OrganicCard>

        <div className="flex gap-4">
          <button 
            onClick={() => setIsManualSheetOpen(true)}
            className="flex-1 bg-white border border-mint py-4 rounded-[24px] text-forest font-bold font-quicksand flex items-center justify-center gap-2 hover:bg-mint/20 transition-colors"
          >
            <Plus size={20} /> Tambah Cepat
          </button>
        </div>

        {/* Analytics */}
        {chartData.length > 0 && <AnalyticsChart data={chartData} />}

        {/* Budgets / Tanaman Keuangan */}
        {budgets.length > 0 && (
          <section>
            <h3 className="text-xl font-fredoka text-forest mb-4">Taman Pengeluaran 🪴</h3>
            <div className="space-y-4">
              {budgets.map(b => {
                const spent = transactions
                  .filter(tx => tx.type === 'expense' && tx.category === b.category)
                  .reduce((acc, tx) => acc + parseFloat(tx.amount), 0);
                return <BudgetPlant key={b.id} category={b.category} limit={b.monthly_limit} spent={spent} />;
              })}
            </div>
          </section>
        )}

        {/* Recent Transactions */}
        <section>
          <h3 className="text-xl font-fredoka text-forest mb-4">Riwayat Terkini</h3>
          <div className="space-y-3">
            {transactions.map(tx => (
              <div key={tx.id} className="bg-white p-4 rounded-2xl flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${tx.type === 'income' ? 'bg-spring/20' : 'bg-terracotta/20'}`}>
                    {tx.type === 'income' ? '💰' : '💸'}
                  </div>
                  <div>
                    <p className="font-bold text-forest font-quicksand">{tx.description}</p>
                    <p className="text-xs text-forest/50">{tx.category} • {wallets.find(w => w.id === tx.wallet_id)?.name}</p>
                  </div>
                </div>
                <p className={`font-bold font-quicksand ${tx.type === 'income' ? 'text-spring' : 'text-terracotta'}`}>
                  {tx.type === 'income' ? '+' : '-'}Rp {parseFloat(tx.amount).toLocaleString('id-ID')}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <FloatingChatInput onSubmit={handleAiSubmit} isLoading={isAiLoading} />
      
      <ManualEntrySheet 
        isOpen={isManualSheetOpen} 
        onClose={() => setIsManualSheetOpen(false)} 
        wallets={wallets} 
        onSave={fetchData} 
      />

      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50">
          <motion.div 
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-forest text-white px-6 py-3 rounded-full font-quicksand shadow-lg"
          >
            {toastMsg}
          </motion.div>
        </div>
      )}
    </div>
  );
}
