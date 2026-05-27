'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import OrganicCard from '@/components/ui/OrganicCard';
import FloatingChatInput from '@/components/ui/FloatingChatInput';
import ManualEntrySheet from '@/components/ui/ManualEntrySheet';
import BudgetPlant from '@/components/dashboard/BudgetPlant';
import AnalyticsChart from '@/components/dashboard/AnalyticsChart';
import DebtCard from '@/components/dashboard/DebtCard';
import DebtPaymentSheet from '@/components/ui/DebtPaymentSheet';
import AddDebtSheet from '@/components/ui/AddDebtSheet';
import WalletSetup from '@/components/onboarding/WalletSetup';
import Navigation from '@/components/ui/Navigation';
import InteractiveTerrarium from '@/components/dashboard/InteractiveTerrarium';
import { 
  Download, Plus, Trash2, TrendingUp, TrendingDown, 
  Wallet, LogOut, Coins, Award, Handshake
} from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('beranda');

  // Core Data
  const [wallets, setWallets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [debts, setDebts] = useState([]);

  // Forms & Modals
  const [isManualSheetOpen, setIsManualSheetOpen] = useState(false);
  const [isAddDebtSheetOpen, setIsAddDebtSheetOpen] = useState(false);
  const [isDebtPaymentSheetOpen, setIsDebtPaymentSheetOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState(null);
  const [debtFilter, setDebtFilter] = useState('hutang'); // 'hutang' | 'piutang'
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  // Add Budget Form States
  const [budgetCategory, setBudgetCategory] = useState('');
  const [budgetLimit, setBudgetLimit] = useState('');

  // Add Wallet Form States
  const [walletName, setWalletName] = useState('');
  const [walletInitialBalance, setWalletInitialBalance] = useState('');
  const [walletType, setWalletType] = useState('regular');

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
      // Fetch all transactions to compute wallet balances correctly
      const { data: txData } = await supabase.from('transactions').select('*').order('created_at', { ascending: false });
      setTransactions(txData || []);

      // Fetch budgets
      const { data: bData } = await supabase.from('budgets').select('*');
      setBudgets(bData || []);

      // Fetch debts
      const { data: dData } = await supabase.from('debts').select('*').order('created_at', { ascending: false });
      setDebts(dData || []);
    }
    
    setLoading(false);
  };

  // Push notification registration
  const registerPushNotification = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return;
      
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) return;
      
      const urlBase64ToUint8Array = (base64String) => {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)));
      };
      
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });
      
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription),
      });
    } catch (err) {
      console.warn('Push notification registration failed:', err);
    }
  };

  useEffect(() => {
    fetchData();
    // Register push notification on mount (will request permission only once)
    registerPushNotification();
  }, [router]);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  const handleAiSubmit = async (text, image) => {
    setIsAiLoading(true);
    try {
      const res = await fetch('/api/parse-tx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, image })
      });
      
      if (!res.ok) throw new Error('API Error');
      
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // Check for debt_event
      const hasDebtEvent = data.transactions.some(tx => tx.type === 'debt_event');
      if (hasDebtEvent) {
        const debtTx = data.transactions.find(tx => tx.type === 'debt_event');
        const matchedWallet = wallets.find(w => w.name.toLowerCase() === debtTx.wallet?.toLowerCase()) || wallets[0];
        const totalAmount = parseFloat(debtTx.amount);
        const startDate = new Date().toISOString().split('T')[0];
        let endDate = null;
        if (debtTx.is_installment && debtTx.installment_months) {
          const end = new Date();
          end.setMonth(end.getMonth() + parseInt(debtTx.installment_months));
          endDate = end.toISOString().split('T')[0];
        }

        const { data: debtData, error: debtErr } = await supabase.from('debts').insert([{
          type: debtTx.debt_type,
          contact_name: debtTx.contact_name || 'Tidak Diketahui',
          description: debtTx.description || null,
          total_amount: totalAmount,
          paid_amount: 0,
          wallet_id: matchedWallet.id,
          is_installment: debtTx.is_installment || false,
          installment_amount: debtTx.installment_amount || null,
          installment_months: debtTx.installment_months || null,
          installment_due_day: debtTx.due_day || null,
          start_date: startDate,
          end_date: endDate,
          status: 'active',
        }]).select().single();

        if (debtErr) throw debtErr;

        // Create linked transaction
        const txType = debtTx.debt_type === 'hutang' ? 'income' : 'expense';
        const txCategory = debtTx.debt_type === 'hutang' ? 'Hutang' : 'Piutang';
        await supabase.from('transactions').insert([{
          wallet_id: matchedWallet.id,
          batch_id: crypto.randomUUID(),
          amount: totalAmount,
          type: txType,
          description: debtTx.description || (debtTx.debt_type === 'hutang' ? `Pinjam dari ${debtTx.contact_name}` : `Pinjamkan ke ${debtTx.contact_name}`),
          category: txCategory,
          raw_input_text: text,
        }]);

        showToast(`🌿 Hutang dari ${debtTx.contact_name} berhasil dicatat!`);
        fetchData();
        return;
      }

      // Regular transaction or Transfer
      const batch_id = crypto.randomUUID();
      const isTransfer = data.transactions.length === 2 && data.transactions.every(tx => tx.category === 'Transfer');
      const tx1Id = crypto.randomUUID();
      const tx2Id = crypto.randomUUID();

      const inserts = data.transactions.map((tx, index) => {
        const matchedWallet = wallets.find(w => w.name.toLowerCase() === tx.wallet?.toLowerCase()) || wallets[0];
        return {
          id: isTransfer ? (index === 0 ? tx1Id : tx2Id) : crypto.randomUUID(),
          wallet_id: matchedWallet.id,
          batch_id,
          amount: parseFloat(tx.amount),
          type: tx.type,
          description: tx.description,
          category: tx.category,
          raw_input_text: text,
          transfer_pair_id: isTransfer ? (index === 0 ? tx2Id : tx1Id) : null
        };
      });

      const { error } = await supabase.from('transactions').insert(inserts);
      if (error) throw error;
      
      showToast('🌿 Transaksi berhasil ditanam!');
      fetchData();
    } catch (err) {
      console.error(err);
      showToast('Oops, Terrarium bingung bacanya nih 🌿. Boleh manual aja?');
      setIsManualSheetOpen(true);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Helper Wallet Calculations
  const getWalletBalance = (wallet) => {
    const walletTx = transactions.filter(tx => tx.wallet_id === wallet.id);
    const net = walletTx.reduce((acc, tx) => {
      return acc + (tx.type === 'income' ? parseFloat(tx.amount) : -parseFloat(tx.amount));
    }, 0);
    return parseFloat(wallet.initial_balance) + net;
  };

  // Total balance across all wallets
  const totalBalance = wallets.reduce((acc, w) => acc + getWalletBalance(w), 0);

  // Month-to-date Calculations
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const currentMonthTransactions = transactions.filter(tx => new Date(tx.created_at) >= startOfMonth);

  // Excluded categories from income/expense calculations
  const EXCLUDED_CATEGORIES = ['Transfer', 'Hutang', 'Piutang', 'Bayar Hutang', 'Terima Piutang'];

  const monthlyIncome = currentMonthTransactions
    .filter(tx => tx.type === 'income' && !EXCLUDED_CATEGORIES.includes(tx.category))
    .reduce((acc, tx) => acc + parseFloat(tx.amount), 0);

  const monthlyExpense = currentMonthTransactions
    .filter(tx => tx.type === 'expense' && !EXCLUDED_CATEGORIES.includes(tx.category))
    .reduce((acc, tx) => acc + parseFloat(tx.amount), 0);

  const savings = monthlyIncome - monthlyExpense;
  const savingsRate = monthlyIncome > 0 ? (savings / monthlyIncome) * 100 : 0;

  // Chart data calculations (last 7 days of expenses)
  const processLast7DaysExpenses = () => {
    const data = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      
      const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
      const endOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
      
      const dayExpenses = transactions
        .filter(tx => {
          const txDate = new Date(tx.created_at);
          return tx.type === 'expense' && !EXCLUDED_CATEGORIES.includes(tx.category) && txDate >= startOfDay && txDate <= endOfDay;
        })
        .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
        
      data.push({
        date: dateStr,
        expense: dayExpenses
      });
    }
    return data;
  };

  // Chart data for Analytics Tab (last 14 days of income vs expense)
  const processTrendData = () => {
    const data = [];
    const today = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      
      const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
      const endOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
      
      const dayIncome = transactions
        .filter(tx => {
          const txDate = new Date(tx.created_at);
          return tx.type === 'income' && tx.category !== 'Transfer' && txDate >= startOfDay && txDate <= endOfDay;
        })
        .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);

      const dayExpense = transactions
        .filter(tx => {
          const txDate = new Date(tx.created_at);
          return tx.type === 'expense' && tx.category !== 'Transfer' && txDate >= startOfDay && txDate <= endOfDay;
        })
        .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
        
      data.push({
        date: dateStr,
        income: dayIncome,
        expense: dayExpense
      });
    }
    return data;
  };

  // Top spending categories calculation
  const getCategoryBreakdown = () => {
    const catMap = currentMonthTransactions
      .filter(tx => tx.type === 'expense' && tx.category !== 'Transfer')
      .reduce((acc, tx) => {
        const cat = tx.category || 'Lainnya';
        acc[cat] = (acc[cat] || 0) + parseFloat(tx.amount);
        return acc;
      }, {});
      
    return Object.entries(catMap)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  };

  // Emoji Mapping Helpers
  const categoryEmojis = {
    makanan: '🍔',
    minuman: '🥤',
    makan: '🍔',
    kopi: '☕',
    transport: '🚗',
    transportasi: '🚗',
    ojek: '🛵',
    belanja: '🛍️',
    shopping: '🛍️',
    gaji: '💰',
    transfer: '↔️',
    kesehatan: '🏥',
    obat: '💊',
    hiburan: '🎮',
    nonton: '🎬',
    tagihan: '🧾',
    listrik: '⚡',
    air: '💧',
    pulsa: '📱',
    internet: '🌐',
    investasi: '📈',
    pendidikan: '📚',
    sedekah: '🕌',
    hadiah: '🎁',
    lainnya: '🌿'
  };

  const getCategoryEmoji = (category, type) => {
    if (!category) return type === 'income' ? '💰' : '💸';
    const clean = category.toLowerCase().trim();
    if (categoryEmojis[clean]) return categoryEmojis[clean];
    for (const [key, emoji] of Object.entries(categoryEmojis)) {
      if (clean.includes(key)) return emoji;
    }
    return type === 'income' ? '💰' : '💸';
  };

  const getWalletEmoji = (name) => {
    const n = name.toLowerCase();
    if (n.includes('cash') || n.includes('tunai') || n.includes('dompet')) return '💵';
    if (n.includes('bca') || n.includes('mandiri') || n.includes('bni') || n.includes('bri') || n.includes('bank') || n.includes('rekening')) return '🏦';
    if (n.includes('gopay') || n.includes('ovo') || n.includes('dana') || n.includes('linkaja') || n.includes('spay') || n.includes('e-wallet') || n.includes('ewallet')) return '📱';
    if (n.includes('cc') || n.includes('credit') || n.includes('kartu')) return '💳';
    return '👛';
  };

  // CRUD Actions
  const handleAddBudget = async (e) => {
    e.preventDefault();
    if (!budgetCategory.trim() || !budgetLimit) return;
    
    const firstDay = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    
    const { error } = await supabase.from('budgets').insert([{
      category: budgetCategory.trim(),
      monthly_limit: parseFloat(budgetLimit),
      month_year: firstDay
    }]);

    if (!error) {
      showToast('Budget baru berhasil ditanam! 🌱');
      setBudgetCategory('');
      setBudgetLimit('');
      fetchData();
    } else {
      showToast('Gagal menanam budget: ' + error.message);
    }
  };

  const handleAddWallet = async (e) => {
    e.preventDefault();
    if (!walletName.trim()) return;
    
    const { error } = await supabase.from('wallets').insert([{
      name: walletName.trim(),
      initial_balance: parseFloat(walletInitialBalance) || 0,
      type: walletType
    }]);

    if (!error) {
      showToast('Dompet baru berhasil ditambahkan! 💳');
      setWalletName('');
      setWalletInitialBalance('');
      setWalletType('regular');
      fetchData();
    } else {
      showToast('Gagal menambahkan dompet: ' + error.message);
    }
  };

  const handleDeleteWallet = async (walletId, walletName) => {
    if (!confirm(`Hapus dompet "${walletName}"? Semua riwayat transaksi di dompet ini juga akan terhapus permanen.`)) return;
    
    // Delete transactions of wallet first (due to foreign key constraint)
    const { error: txErr } = await supabase.from('transactions').delete().eq('wallet_id', walletId);
    if (txErr) {
      showToast('Gagal membersihkan transaksi dompet');
      return;
    }

    const { error: wErr } = await supabase.from('wallets').delete().eq('id', walletId);
    if (!wErr) {
      showToast('Dompet berhasil dibersihkan! 🧹');
      fetchData();
    } else {
      showToast('Gagal menghapus dompet');
    }
  };

  const handleDeleteTransaction = async (id) => {
    if (!confirm('Apakah kamu yakin ingin mencabut transaksi ini?')) return;
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (!error) {
      showToast('Transaksi berhasil dicabut! 🧹');
      fetchData();
    } else {
      showToast('Gagal menghapus transaksi');
    }
  };

  const handlePayment = (debt) => {
    setSelectedDebt(debt);
    setIsDebtPaymentSheetOpen(true);
  };

  const handleMarkLunas = async (debtId) => {
    const { error } = await supabase.from('debts').update({ status: 'lunas' }).eq('id', debtId);
    if (!error) {
      showToast('Status hutang di-set Lunas! ✅');
      fetchData();
    } else {
      showToast('Gagal merubah status');
    }
  };

  const handleExportCsv = async () => {
    try {
      const res = await fetch('/api/transactions/export');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `terrarium_export_${now.getFullYear()}_${now.getMonth() + 1}.csv`;
      a.click();
      showToast('📊 Panen data CSV sukses!');
    } catch (e) {
      showToast('Gagal mengekspor data');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  // Render State Loading
  if (loading) return <div className="min-h-screen bg-cream flex items-center justify-center text-forest font-fredoka text-2xl animate-pulse">Memuat Taman Terrarium... 🌿</div>;
  if (wallets.length === 0) return <WalletSetup onComplete={fetchData} />;

  // Render Tab Content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'beranda':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Column Left (Saldo, Summary, Wallets, Chart) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Total Saldo Card */}
              <OrganicCard type="income" className="text-center py-8 relative overflow-hidden">
                <div className="absolute top-3 right-5 opacity-15 text-5xl select-none pointer-events-none">🌿</div>
                <p className="text-forest/70 font-quicksand font-bold mb-1 text-sm tracking-wide">TOTAL SALDO SELURUHNYA</p>
                <h2 className="text-4xl md:text-5xl font-quicksand font-bold text-forest">
                  Rp {totalBalance.toLocaleString('id-ID')}
                </h2>
              </OrganicCard>

              {/* Summary Cards */}
              <div className="flex gap-4">
                {/* Pemasukan Card */}
                <div className="rounded-tr-[32px] rounded-bl-[32px] rounded-tl-[16px] rounded-br-[16px] p-5 bg-spring/10 border border-spring/30 text-forest flex-1 flex flex-col justify-between shadow-sm">
                  <div>
                    <div className="flex items-center gap-1.5 text-spring font-bold text-xs uppercase tracking-wider mb-2">
                      <TrendingUp size={14} />
                      <span>Pemasukan Bulan Ini</span>
                    </div>
                    <p className="text-xl md:text-2xl font-bold font-quicksand text-forest">
                      + Rp {monthlyIncome.toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>

                {/* Pengeluaran Card */}
                <div className="rounded-tl-[32px] rounded-br-[32px] rounded-tr-[16px] rounded-bl-[16px] p-5 bg-terracotta/10 border border-terracotta/30 text-forest flex-1 flex flex-col justify-between shadow-sm">
                  <div>
                    <div className="flex items-center gap-1.5 text-terracotta font-bold text-xs uppercase tracking-wider mb-2">
                      <TrendingDown size={14} />
                      <span>Pengeluaran Bulan Ini</span>
                    </div>
                    <p className="text-xl md:text-2xl font-bold font-quicksand text-forest">
                      - Rp {monthlyExpense.toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Wallet Cards Row (Horizontal Scroll) */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Wallet size={18} className="text-forest/70" />
                  <h3 className="text-lg font-fredoka text-forest font-bold">Kebun Dompet</h3>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-4 pt-1 snap-x scrollbar-thin">
                  {wallets.filter(w => w.type !== 'investasi').map((w) => {
                    const balance = getWalletBalance(w);
                    return (
                      <motion.div
                        key={w.id}
                        whileHover={{ scale: 1.03 }}
                        className="snap-start min-w-[170px] bg-white border border-mint rounded-2xl p-4 flex flex-col justify-between shadow-sm relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 translate-x-2 -translate-y-2 opacity-5 text-4xl select-none">
                          🌿
                        </div>
                        <div>
                          <span className="text-2xl block mb-2">{getWalletEmoji(w.name)}</span>
                          <h4 className="font-fredoka text-forest text-sm font-bold truncate">{w.name}</h4>
                        </div>
                        <p className="text-forest font-bold text-base font-quicksand mt-2 truncate">
                          Rp {balance.toLocaleString('id-ID')}
                        </p>
                      </motion.div>
                    );
                  })}
                </div>

                {wallets.filter(w => w.type === 'investasi').length > 0 && (
                  <>
                    <div className="flex items-center gap-2 mb-3 mt-4">
                      <TrendingUp size={18} className="text-amber-500" />
                      <h3 className="text-lg font-fredoka text-forest font-bold">Investasi</h3>
                    </div>
                    <div className="flex gap-4 overflow-x-auto pb-4 pt-1 snap-x scrollbar-thin">
                      {wallets.filter(w => w.type === 'investasi').map((w) => {
                        const balance = getWalletBalance(w);
                        return (
                          <motion.div
                            key={w.id}
                            whileHover={{ scale: 1.03 }}
                            className="snap-start min-w-[170px] bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 flex flex-col justify-between shadow-sm relative overflow-hidden"
                          >
                            <div className="absolute top-0 right-0 p-2 opacity-50">
                              <span className="text-[10px] font-bold bg-amber-200/50 text-amber-700 px-2 py-1 rounded-md">Investasi</span>
                            </div>
                            <div className="absolute top-0 right-0 translate-x-2 -translate-y-2 opacity-5 text-4xl select-none">
                              📈
                            </div>
                            <div className="mt-4">
                              <span className="text-2xl block mb-2">{getWalletEmoji(w.name)}</span>
                              <h4 className="font-fredoka text-amber-900 text-sm font-bold truncate">{w.name}</h4>
                            </div>
                            <p className="text-amber-900 font-bold text-base font-quicksand mt-2 truncate">
                              Rp {balance.toLocaleString('id-ID')}
                            </p>
                          </motion.div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              {/* Chart Pengeluaran 7 Hari */}
              <AnalyticsChart data={processLast7DaysExpenses()} mode="expense-only" />
            </div>

            {/* Column Right (Budgets & Riwayat) */}
            <div className="lg:col-span-5 space-y-6">
              {/* Virtual Terrarium Pet Companion */}
              <InteractiveTerrarium savingsRate={savingsRate} />

              {/* Budgets Summary */}
              {budgets.length > 0 && (
                <section>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-fredoka text-forest font-bold">Tanaman Kategori 🪴</h3>
                    <button 
                      onClick={() => setActiveTab('budget')}
                      className="text-xs text-spring font-bold hover:underline"
                    >
                      Lihat Semua
                    </button>
                  </div>
                  <div className="space-y-3">
                    {budgets.slice(0, 3).map(b => {
                      const spent = transactions
                        .filter(tx => tx.type === 'expense' && tx.category !== 'Transfer' && tx.category === b.category && new Date(tx.created_at) >= startOfMonth)
                        .reduce((acc, tx) => acc + parseFloat(tx.amount), 0);
                      return <BudgetPlant key={b.id} category={b.category} limit={b.monthly_limit} spent={spent} />;
                    })}
                  </div>
                </section>
              )}

              {/* Riwayat Terkini */}
              <section className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-fredoka text-forest font-bold">Riwayat Terkini</h3>
                  <button 
                    onClick={() => setIsManualSheetOpen(true)}
                    className="flex items-center gap-1 text-xs bg-forest text-white px-3 py-1.5 rounded-full hover:bg-forest/90 font-bold transition-colors shadow-sm"
                  >
                    <Plus size={14} /> Tambah Cepat
                  </button>
                </div>
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                  {transactions.length === 0 ? (
                    <div className="bg-white/50 border border-dashed border-mint rounded-2xl p-8 text-center text-forest/50 text-sm">
                      Belum ada transaksi ditanam. Mulai dengan chat di bawah! 🌿
                    </div>
                  ) : (
                    transactions.slice(0, 10).map(tx => (
                      <div key={tx.id} className="group bg-white p-4 rounded-2xl flex justify-between items-center shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 ${
                            tx.category === 'Transfer' ? 'bg-gray-200 text-gray-600' :
                            tx.type === 'income' ? 'bg-spring/10' : 'bg-terracotta/10'
                          }`}>
                            {getCategoryEmoji(tx.category, tx.type)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-forest text-sm font-quicksand truncate">{tx.description}</p>
                            <p className="text-[11px] text-forest/50 font-bold truncate">
                              {tx.category || 'General'} • {wallets.find(w => w.id === tx.wallet_id)?.name} • {
                                new Date(tx.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
                              }
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <p className={`font-bold font-quicksand text-sm ${
                            tx.category === 'Transfer' ? 'text-forest/70' :
                            tx.type === 'income' ? 'text-spring' : 'text-terracotta'
                          }`}>
                            {tx.type === 'income' ? '+' : '-'}Rp {parseFloat(tx.amount).toLocaleString('id-ID')}
                          </p>
                          <button
                            onClick={() => handleDeleteTransaction(tx.id)}
                            className="text-forest/30 hover:text-terracotta transition-colors p-1 md:opacity-0 md:group-hover:opacity-100"
                            title="Hapus Transaksi"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>
          </div>
        );

      case 'analitik':
        const trendData = processTrendData();
        const breakdown = getCategoryBreakdown();
        const totalInvestasi = wallets.filter(w => w.type === 'investasi').reduce((acc, w) => acc + getWalletBalance(w), 0);

        return (
          <div className="space-y-6">
            {/* Analytics Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-3xl border border-mint shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-spring/10 flex items-center justify-center text-spring">
                  <TrendingUp size={24} />
                </div>
                <div>
                  <p className="text-xs text-forest/50 font-bold">PEMASUKAN BULAN INI</p>
                  <p className="text-lg font-bold font-quicksand text-forest">Rp {monthlyIncome.toLocaleString('id-ID')}</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-mint shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-terracotta/10 flex items-center justify-center text-terracotta">
                  <TrendingDown size={24} />
                </div>
                <div>
                  <p className="text-xs text-forest/50 font-bold">PENGELUARAN BULAN INI</p>
                  <p className="text-lg font-bold font-quicksand text-forest">Rp {monthlyExpense.toLocaleString('id-ID')}</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-mint shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-mint/50 flex items-center justify-center text-forest">
                  <Award size={24} />
                </div>
                <div>
                  <p className="text-xs text-forest/50 font-bold">RASIO TABUNGAN</p>
                  <p className="text-lg font-bold font-quicksand text-forest">
                    {savingsRate > 0 ? `${Math.round(savingsRate)}%` : '0%'} ({savings >= 0 ? '+' : '-'}Rp {Math.abs(savings).toLocaleString('id-ID')})
                  </p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-mint shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                  <TrendingUp size={24} />
                </div>
                <div>
                  <p className="text-xs text-forest/50 font-bold">TOTAL INVESTASI</p>
                  <p className="text-lg font-bold font-quicksand text-forest">Rp {totalInvestasi.toLocaleString('id-ID')}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Trend Chart (Income vs Expense 14 Days) */}
              <div className="lg:col-span-8 space-y-4">
                <AnalyticsChart data={trendData} mode="both" />
              </div>

              {/* Top Categories */}
              <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-mint shadow-sm space-y-4">
                <h3 className="text-lg font-fredoka text-forest font-bold">Pengeluaran per Kategori</h3>
                <div className="space-y-4">
                  {breakdown.length === 0 ? (
                    <p className="text-sm text-forest/50 text-center py-8">Belum ada pengeluaran bulan ini. 🌾</p>
                  ) : (
                    breakdown.map((cat, i) => {
                      const pct = monthlyExpense > 0 ? (cat.amount / monthlyExpense) * 100 : 0;
                      return (
                        <div key={i} className="space-y-1">
                          <div className="flex justify-between text-sm font-bold font-quicksand text-forest">
                            <span className="flex items-center gap-1.5">
                              <span>{getCategoryEmoji(cat.category, 'expense')}</span>
                              <span>{cat.category}</span>
                            </span>
                            <span>{Math.round(pct)}%</span>
                          </div>
                          <div className="h-2 w-full bg-mint/45 rounded-full overflow-hidden">
                            <div className="h-full bg-spring rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <p className="text-[10px] text-forest/40 text-right">Rp {cat.amount.toLocaleString('id-ID')}</p>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case 'budget':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* List Budgets */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-fredoka text-forest font-bold">Budgets Tanaman Keuangan 🌱</h3>
              </div>
              
              {budgets.length === 0 ? (
                <div className="bg-white/50 border border-dashed border-mint rounded-3xl p-12 text-center text-forest/50">
                  <p className="mb-4">Taman budgetmu masih kosong. Tanam tunas budget pertamamu!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {budgets.map(b => {
                    const spent = transactions
                      .filter(tx => tx.type === 'expense' && tx.category !== 'Transfer' && tx.category === b.category && new Date(tx.created_at) >= startOfMonth)
                      .reduce((acc, tx) => acc + parseFloat(tx.amount), 0);
                    return (
                      <div key={b.id} className="relative group">
                        <BudgetPlant category={b.category} limit={b.monthly_limit} spent={spent} />
                        <button
                          onClick={async () => {
                            if (confirm(`Hapus target budget kategori "${b.category}"?`)) {
                              await supabase.from('budgets').delete().eq('id', b.id);
                              showToast('Budget dicabut! 🧹');
                              fetchData();
                            }
                          }}
                          className="absolute right-4 top-4 text-forest/30 hover:text-terracotta transition-colors p-1 md:opacity-0 md:group-hover:opacity-100"
                          title="Hapus Budget"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Create Budget Form */}
            <div className="lg:col-span-5">
              <div className="bg-white border border-mint rounded-[32px] p-6 shadow-sm">
                <h3 className="text-lg font-fredoka text-forest mb-4 font-bold">Tanam Budget Baru 🌱</h3>
                <form onSubmit={handleAddBudget} className="space-y-4">
                  <div>
                    <label className="text-xs text-forest/70 font-bold ml-1 mb-1 block">Kategori</label>
                    <input 
                      type="text" 
                      value={budgetCategory}
                      onChange={(e) => setBudgetCategory(e.target.value)}
                      placeholder="Cth: Makanan, Transport, Belanja"
                      className="w-full bg-cream px-4 py-3 rounded-2xl border border-mint focus:outline-none focus:border-forest text-forest text-sm font-quicksand font-bold"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs text-forest/70 font-bold ml-1 mb-1 block">Limit Bulanan</label>
                    <input 
                      type="number" 
                      value={budgetLimit}
                      onChange={(e) => setBudgetLimit(e.target.value)}
                      placeholder="Rp limit maksimal..."
                      className="w-full bg-cream px-4 py-3 rounded-2xl border border-mint focus:outline-none focus:border-forest text-forest text-sm font-quicksand font-bold"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-forest text-white py-3.5 rounded-full font-bold text-sm hover:bg-forest/90 transition-colors shadow-md flex items-center justify-center gap-2"
                  >
                    <Plus size={16} />
                    <span>Tanam Budget</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        );

      case 'pengaturan':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Manage Wallets */}
            <div className="lg:col-span-7 space-y-4">
              <h3 className="text-lg font-fredoka text-forest font-bold">Kelola Kebun Dompet 💳</h3>
              <div className="space-y-3">
                {wallets.map(w => {
                  const bal = getWalletBalance(w);
                  return (
                    <div key={w.id} className="bg-white border border-mint p-4 rounded-2xl flex justify-between items-center shadow-sm">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getWalletEmoji(w.name)}</span>
                        <div>
                          <h4 className="font-fredoka text-forest font-bold text-sm">
                            {w.name}
                            {w.type === 'investasi' && <span className="ml-2 text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-sm">Investasi</span>}
                          </h4>
                          <p className="text-[11px] text-forest/50 font-bold font-quicksand">Saldo Awal: Rp {parseFloat(w.initial_balance).toLocaleString('id-ID')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="font-bold text-forest font-quicksand text-sm">
                          Rp {bal.toLocaleString('id-ID')}
                        </p>
                        {wallets.length > 1 ? (
                          <button
                            onClick={() => handleDeleteWallet(w.id, w.name)}
                            className="text-forest/30 hover:text-terracotta transition-colors p-1"
                            title="Hapus Dompet"
                          >
                            <Trash2 size={16} />
                          </button>
                        ) : (
                          <span className="text-[10px] text-forest/30 font-bold">Dompet Utama</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Forms, CSV Export & Logout */}
            <div className="lg:col-span-5 space-y-6">
              {/* Add Wallet */}
              <div className="bg-white border border-mint rounded-[32px] p-6 shadow-sm">
                <h3 className="text-lg font-fredoka text-forest mb-4 font-bold">Tambah Dompet Baru 💳</h3>
                <form onSubmit={handleAddWallet} className="space-y-4">
                  <div>
                    <label className="text-xs text-forest/70 font-bold ml-1 mb-1 block">Nama Dompet</label>
                    <input 
                      type="text" 
                      value={walletName}
                      onChange={(e) => setWalletName(e.target.value)}
                      placeholder="Cth: BCA, Cash, Gopay"
                      className="w-full bg-cream px-4 py-3 rounded-2xl border border-mint focus:outline-none focus:border-forest text-forest text-sm font-quicksand font-bold"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs text-forest/70 font-bold ml-1 mb-1 block">Saldo Awal</label>
                    <input 
                      type="number" 
                      value={walletInitialBalance}
                      onChange={(e) => setWalletInitialBalance(e.target.value)}
                      placeholder="Rp 0"
                      className="w-full bg-cream px-4 py-3 rounded-2xl border border-mint focus:outline-none focus:border-forest text-forest text-sm font-quicksand font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-forest/70 font-bold ml-1 mb-1 block">Tipe Dompet</label>
                    <select
                      value={walletType}
                      onChange={(e) => setWalletType(e.target.value)}
                      className="w-full bg-cream px-4 py-3 rounded-2xl border border-mint focus:outline-none focus:border-forest text-forest text-sm font-quicksand font-bold"
                    >
                      <option value="regular">Regular</option>
                      <option value="investasi">Investasi</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-forest text-white py-3.5 rounded-full font-bold text-sm hover:bg-forest/90 transition-colors shadow-md flex items-center justify-center gap-2"
                  >
                    <Plus size={16} />
                    <span>Tambah Dompet</span>
                  </button>
                </form>
              </div>

              {/* Data & Account (For Mobile layout mainly, backup since desktop layout has sidebar options) */}
              <div className="md:hidden bg-white border border-mint rounded-[32px] p-6 shadow-sm space-y-4">
                <h3 className="text-lg font-fredoka text-forest font-bold">Data & Akun</h3>
                {user?.email && (
                  <p className="text-xs font-bold font-quicksand text-forest/60">
                    Masuk sebagai: <span className="text-forest font-bold">{user.email}</span>
                  </p>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={handleExportCsv}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-full border border-mint text-forest/80 font-bold font-quicksand text-sm hover:bg-mint/10 transition-colors"
                  >
                    <Download size={16} />
                    <span>Ekspor CSV</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-full bg-terracotta/10 text-terracotta font-bold font-quicksand text-sm hover:bg-terracotta hover:text-white transition-colors"
                  >
                    <LogOut size={16} />
                    <span>Keluar</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'hutang':
        const activeDebts = debts.filter(d => d.type === debtFilter && d.status === 'active');
        const lunasDebts = debts.filter(d => d.type === debtFilter && d.status === 'lunas');
        const activeCount = activeDebts.length;
        const lunasCount = lunasDebts.length;

        const totalHutangAktif = debts
          .filter(d => d.type === 'hutang' && d.status === 'active')
          .reduce((acc, d) => acc + (parseFloat(d.total_amount) - parseFloat(d.paid_amount || 0)), 0);

        const totalPiutangAktif = debts
          .filter(d => d.type === 'piutang' && d.status === 'active')
          .reduce((acc, d) => acc + (parseFloat(d.total_amount) - parseFloat(d.paid_amount || 0)), 0);

        return (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <OrganicCard type="expense" className="px-8 py-6 relative overflow-hidden">
                <div className="absolute top-3 right-5 opacity-15 text-5xl select-none pointer-events-none">😟</div>
                <p className="text-forest/70 font-quicksand font-bold mb-1.5 text-xs tracking-wide">TOTAL HUTANG AKTIF (HARUS DIBAYAR)</p>
                <h3 className="text-2xl md:text-3xl font-quicksand font-bold text-terracotta">
                  Rp {totalHutangAktif.toLocaleString('id-ID')}
                </h3>
              </OrganicCard>
              
              <OrganicCard type="income" className="px-8 py-6 relative overflow-hidden">
                <div className="absolute top-3 right-5 opacity-15 text-5xl select-none pointer-events-none">🤝</div>
                <p className="text-forest/70 font-quicksand font-bold mb-1.5 text-xs tracking-wide">TOTAL PIUTANG AKTIF (AKAN DITERIMA)</p>
                <h3 className="text-2xl md:text-3xl font-quicksand font-bold text-spring">
                  Rp {totalPiutangAktif.toLocaleString('id-ID')}
                </h3>
              </OrganicCard>
            </div>

            {/* Filter Toggle and Action Button */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-mint/40 pb-4">
              <div className="flex bg-mint/20 p-1.5 rounded-full self-start">
                <button
                  onClick={() => setDebtFilter('hutang')}
                  className={`px-5 py-2 rounded-full font-bold text-xs transition-all flex items-center gap-1.5 ${
                    debtFilter === 'hutang' ? 'bg-forest text-white shadow-sm' : 'text-forest/60 hover:text-forest'
                  }`}
                >
                  <span>😟 Hutang Saya</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${debtFilter === 'hutang' ? 'bg-white/20 text-white' : 'bg-mint text-forest'}`}>
                    {debts.filter(d => d.type === 'hutang' && d.status === 'active').length}
                  </span>
                </button>
                <button
                  onClick={() => setDebtFilter('piutang')}
                  className={`px-5 py-2 rounded-full font-bold text-xs transition-all flex items-center gap-1.5 ${
                    debtFilter === 'piutang' ? 'bg-forest text-white shadow-sm' : 'text-forest/60 hover:text-forest'
                  }`}
                >
                  <span>🤝 Piutang Saya</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${debtFilter === 'piutang' ? 'bg-white/20 text-white' : 'bg-mint text-forest'}`}>
                    {debts.filter(d => d.type === 'piutang' && d.status === 'active').length}
                  </span>
                </button>
              </div>

              <button
                onClick={() => setIsAddDebtSheetOpen(true)}
                className="flex items-center justify-center gap-2 bg-forest text-white px-5 py-3 rounded-full font-bold font-quicksand text-sm hover:bg-forest/90 transition-colors shadow-sm self-start sm:self-auto"
              >
                <Plus size={16} />
                <span>Tanam Catatan Baru</span>
              </button>
            </div>

            {/* Active Debts Grid */}
            <div className="space-y-4">
              <h4 className="text-lg font-fredoka text-forest font-bold">
                {debtFilter === 'hutang' ? 'Daftar Hutang Aktif' : 'Daftar Piutang Aktif'}
              </h4>
              {activeCount === 0 ? (
                <div className="bg-white/50 border border-dashed border-mint rounded-3xl p-12 text-center text-forest/50">
                  <p className="mb-2 text-base">Taman catatanmu bersih dan asri! 🌿</p>
                  <p className="text-xs">Tidak ada {debtFilter === 'hutang' ? 'hutang' : 'piutang'} aktif saat ini.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {activeDebts.map(debt => (
                    <div key={debt.id} className="relative group">
                      <DebtCard
                        debt={debt}
                        wallets={wallets}
                        onPayment={handlePayment}
                        onMarkLunas={handleMarkLunas}
                      />
                      <button
                        onClick={async () => {
                          if (confirm(`Hapus catatan ${debt.type === 'hutang' ? 'hutang dari' : 'piutang ke'} "${debt.contact_name}"?`)) {
                            const { error } = await supabase.from('debts').delete().eq('id', debt.id);
                            if (!error) {
                              showToast('Catatan berhasil dicabut! 🧹');
                              fetchData();
                            } else {
                              showToast('Gagal menghapus catatan');
                            }
                          }
                        }}
                        className="absolute right-3 top-3 text-forest/30 hover:text-terracotta transition-colors p-1 md:opacity-0 md:group-hover:opacity-100 z-10"
                        title="Hapus Catatan"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Lunas Section */}
            {lunasCount > 0 && (
              <div className="space-y-4 pt-4 border-t border-mint/20">
                <h4 className="text-lg font-fredoka text-forest/60 font-bold">
                  {debtFilter === 'hutang' ? 'Riwayat Hutang Lunas' : 'Riwayat Piutang Lunas'}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-75">
                  {lunasDebts.map(debt => (
                    <div key={debt.id} className="relative group">
                      <DebtCard
                        debt={debt}
                        wallets={wallets}
                        onPayment={handlePayment}
                        onMarkLunas={handleMarkLunas}
                      />
                      <button
                        onClick={async () => {
                          if (confirm(`Hapus catatan lunas "${debt.contact_name}"?`)) {
                            const { error } = await supabase.from('debts').delete().eq('id', debt.id);
                            if (!error) {
                              showToast('Catatan berhasil dicabut! 🧹');
                              fetchData();
                            } else {
                              showToast('Gagal menghapus catatan');
                            }
                          }
                        }}
                        className="absolute right-3 top-3 text-forest/30 hover:text-terracotta transition-colors p-1 md:opacity-0 md:group-hover:opacity-100 z-10"
                        title="Hapus Catatan"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case 'beranda': return 'Taman Keuangan';
      case 'analitik': return 'Analisis Kebun';
      case 'budget': return 'Taman Pengeluaran';
      case 'hutang': return 'Kebun Hutang & Piutang';
      case 'pengaturan': return 'Pengaturan Kebun';
      default: return 'Terrarium.fi';
    }
  };

  return (
    <div className="min-h-screen bg-cream md:pl-64 pb-36 md:pb-20 transition-all duration-300">
      
      {/* Navigation (Left Sidebar on desktop, Bottom Bar on mobile) */}
      <Navigation 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogout={handleLogout} 
        onExportCsv={handleExportCsv}
        userEmail={user?.email}
      />

      {/* Header */}
      <header className="sticky top-0 z-20 bg-cream/90 backdrop-blur-sm border-b border-mint/40 px-4 md:px-8 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl md:text-2xl font-fredoka text-forest font-bold flex items-center gap-2">
            <span>{getPageTitle()}</span>
          </h1>
          <p className="text-xs text-forest/50 font-quicksand hidden md:block mt-0.5">Kebun pencatatan keuangan pribadi organik Anda.</p>
        </div>
        
        {/* Quick actions in top right for Desktop only */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsManualSheetOpen(true)}
            className="flex items-center gap-2 bg-forest text-white px-4 py-2 rounded-full font-bold font-quicksand text-sm hover:bg-forest/90 transition-colors shadow-sm"
          >
            <Plus size={14} /> 
            <span className="hidden sm:inline">Tambah Transaksi</span>
            <span className="sm:hidden">Tambah</span>
          </button>
        </div>
      </header>

      {/* Main Content Pane */}
      <main className="px-4 md:px-8 py-6 max-w-7xl mx-auto">
        {renderTabContent()}
      </main>

      {/* Floating Chat Input Box */}
      {activeTab === 'beranda' && (
        <FloatingChatInput onSubmit={handleAiSubmit} isLoading={isAiLoading} />
      )}
      
      {/* Manual Entry Sheet */}
      <ManualEntrySheet 
        isOpen={isManualSheetOpen} 
        onClose={() => setIsManualSheetOpen(false)} 
        wallets={wallets} 
        onSave={fetchData} 
      />

      {/* Add Debt Sheet */}
      <AddDebtSheet
        isOpen={isAddDebtSheetOpen}
        onClose={() => setIsAddDebtSheetOpen(false)}
        wallets={wallets}
        onSave={fetchData}
      />

      {/* Debt Payment Sheet */}
      <DebtPaymentSheet
        isOpen={isDebtPaymentSheetOpen}
        onClose={() => {
          setIsDebtPaymentSheetOpen(false);
          setSelectedDebt(null);
        }}
        debt={selectedDebt}
        wallets={wallets}
        onSave={fetchData}
      />

      {/* Custom Floating Toast Alert */}
      {toastMsg && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50">
          <motion.div 
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-forest text-white px-6 py-3 rounded-full font-quicksand font-bold shadow-lg flex items-center gap-2 border border-mint"
          >
            <span>🌿</span>
            <span>{toastMsg}</span>
          </motion.div>
        </div>
      )}
    </div>
  );
}
