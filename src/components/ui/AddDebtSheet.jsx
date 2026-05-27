'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { Leaf } from 'lucide-react';

export default function AddDebtSheet({ isOpen, onClose, wallets, onSave }) {
  const [debtType, setDebtType] = useState('hutang');
  const [contactName, setContactName] = useState('');
  const [description, setDescription] = useState('');
  const [walletId, setWalletId] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [isInstallment, setIsInstallment] = useState(false);
  const [installmentAmount, setInstallmentAmount] = useState('');
  const [installmentMonths, setInstallmentMonths] = useState('');
  const [dueDayOfMonth, setDueDayOfMonth] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && wallets?.length > 0 && !walletId) {
      setWalletId(wallets[0].id);
    }
  }, [isOpen, wallets, walletId]);

  // Auto-calculate total from installment fields
  useEffect(() => {
    if (isInstallment && installmentAmount && installmentMonths) {
      setTotalAmount(String(parseFloat(installmentAmount) * parseInt(installmentMonths)));
    }
  }, [isInstallment, installmentAmount, installmentMonths]);

  const handleSave = async () => {
    if (!contactName.trim() || !totalAmount || !walletId) return;
    setIsLoading(true);

    const startDate = new Date().toISOString().split('T')[0];
    let endDate = null;
    if (isInstallment && installmentMonths && dueDayOfMonth) {
      const end = new Date();
      end.setMonth(end.getMonth() + parseInt(installmentMonths));
      endDate = end.toISOString().split('T')[0];
    }

    // 1. Insert debt record
    const { data: debtData, error: debtError } = await supabase.from('debts').insert([{
      type: debtType,
      contact_name: contactName.trim(),
      description: description.trim() || null,
      total_amount: parseFloat(totalAmount),
      paid_amount: 0,
      wallet_id: walletId,
      is_installment: isInstallment,
      installment_amount: isInstallment ? parseFloat(installmentAmount) : null,
      installment_months: isInstallment ? parseInt(installmentMonths) : null,
      installment_due_day: isInstallment && dueDayOfMonth ? parseInt(dueDayOfMonth) : null,
      start_date: startDate,
      end_date: endDate,
      status: 'active',
    }]).select().single();

    if (debtError) {
      console.error('Add debt error:', debtError);
      setIsLoading(false);
      return;
    }

    // 2. Create linked transaction
    // Hutang → kamu dapat uang (income). Piutang → kamu kasih uang (expense).
    const txType = debtType === 'hutang' ? 'income' : 'expense';
    const txCategory = debtType === 'hutang' ? 'Hutang' : 'Piutang';
    const txDesc = debtType === 'hutang'
      ? `Pinjam dari ${contactName.trim()}`
      : `Pinjamkan ke ${contactName.trim()}`;

    await supabase.from('transactions').insert([{
      wallet_id: walletId,
      batch_id: crypto.randomUUID(),
      amount: parseFloat(totalAmount),
      type: txType,
      description: txDesc,
      category: txCategory,
      raw_input_text: `Debt Created - ${debtData?.id}`,
    }]);

    setIsLoading(false);
    // Reset form
    setContactName('');
    setDescription('');
    setTotalAmount('');
    setInstallmentAmount('');
    setInstallmentMonths('');
    setDueDayOfMonth('');
    setIsInstallment(false);
    setDebtType('hutang');
    onSave();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-forest z-40" onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
            className="fixed bottom-0 left-0 right-0 bg-cream rounded-t-[40px] p-6 z-50 shadow-[0_-10px_40px_rgba(45,106,79,0.15)] overflow-y-auto max-h-[90vh] md:max-w-lg md:mx-auto"
          >
            <div className="w-16 h-2 bg-mint rounded-full mx-auto mb-6" />

            <h2 className="text-2xl font-fredoka text-forest mb-6 text-center">Tanam Catatan Baru 🌿</h2>

            {/* Tipe: Hutang / Piutang */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                onClick={() => setDebtType('hutang')}
                className={`py-3 rounded-full font-bold text-sm transition-all ${
                  debtType === 'hutang' ? 'bg-terracotta text-white shadow-sm' : 'bg-terracotta/15 text-terracotta'
                }`}
              >
                😟 Hutang Saya
              </button>
              <button
                onClick={() => setDebtType('piutang')}
                className={`py-3 rounded-full font-bold text-sm transition-all ${
                  debtType === 'piutang' ? 'bg-spring text-white shadow-sm' : 'bg-spring/15 text-spring'
                }`}
              >
                🤝 Piutang Saya
              </button>
            </div>

            <p className="text-xs text-forest/50 font-quicksand font-bold text-center mb-6">
              {debtType === 'hutang'
                ? 'Hutang = kamu pinjam uang dari orang lain (uang masuk)'
                : 'Piutang = kamu pinjamkan uang ke orang lain (uang keluar)'}
            </p>

            {/* Form fields */}
            <div className="space-y-4 mb-6">
              <input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder={debtType === 'hutang' ? 'Nama orang / nama pinjol' : 'Nama orang yang kamu pinjami'}
                className="w-full bg-white px-4 py-3 rounded-2xl border border-mint focus:outline-none focus:border-forest text-forest font-quicksand font-bold text-sm"
                required
              />
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Deskripsi (opsional)"
                className="w-full bg-white px-4 py-3 rounded-2xl border border-mint focus:outline-none focus:border-forest text-forest font-quicksand text-sm"
              />
            </div>

            {/* Cicilan Toggle */}
            <div className="flex items-center justify-between mb-4 bg-white px-4 py-3 rounded-2xl border border-mint">
              <div>
                <p className="font-bold font-quicksand text-forest text-sm">Sistem Cicilan</p>
                <p className="text-[11px] text-forest/50 font-quicksand">Aktifkan jika ada jadwal cicilan bulanan</p>
              </div>
              <button
                onClick={() => setIsInstallment(!isInstallment)}
                className={`relative w-12 h-6 rounded-full transition-colors ${isInstallment ? 'bg-forest' : 'bg-mint'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${isInstallment ? 'left-7' : 'left-1'}`} />
              </button>
            </div>

            {/* Cicilan fields (conditional) */}
            <AnimatePresence>
              {isInstallment && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 mb-6 overflow-hidden"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-forest/70 font-bold ml-1 mb-1 block">Cicilan / Bulan</label>
                      <input
                        type="number"
                        value={installmentAmount}
                        onChange={(e) => setInstallmentAmount(e.target.value)}
                        placeholder="Rp..."
                        className="w-full bg-white px-4 py-3 rounded-2xl border border-mint focus:outline-none focus:border-forest text-forest font-quicksand font-bold text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-forest/70 font-bold ml-1 mb-1 block">Berapa Bulan?</label>
                      <input
                        type="number"
                        value={installmentMonths}
                        onChange={(e) => setInstallmentMonths(e.target.value)}
                        placeholder="cth: 12"
                        className="w-full bg-white px-4 py-3 rounded-2xl border border-mint focus:outline-none focus:border-forest text-forest font-quicksand font-bold text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-forest/70 font-bold ml-1 mb-1 block">Tanggal Jatuh Tempo Tiap Bulan</label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={dueDayOfMonth}
                      onChange={(e) => setDueDayOfMonth(e.target.value)}
                      placeholder="cth: 15 (tanggal 15 tiap bulan)"
                      className="w-full bg-white px-4 py-3 rounded-2xl border border-mint focus:outline-none focus:border-forest text-forest font-quicksand font-bold text-sm"
                    />
                  </div>
                  {totalAmount && (
                    <div className="bg-mint/20 px-4 py-3 rounded-2xl">
                      <p className="text-xs text-forest/60 font-quicksand">Total otomatis dihitung:</p>
                      <p className="font-bold text-forest font-quicksand">Rp {parseFloat(totalAmount).toLocaleString('id-ID')}</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Total Amount (manual if non-installment) */}
            {!isInstallment && (
              <div className="mb-6">
                <label className="text-xs text-forest/70 font-bold ml-1 mb-1 block">Total Jumlah</label>
                <input
                  type="number"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  placeholder="Rp total..."
                  className="w-full bg-white px-4 py-3 rounded-2xl border border-mint focus:outline-none focus:border-forest text-forest font-quicksand font-bold text-sm"
                />
              </div>
            )}

            {/* Wallet selector */}
            <div className="mb-6">
              <p className="text-xs text-forest/70 font-bold mb-2 ml-2">
                {debtType === 'hutang' ? 'Uang Masuk ke Dompet' : 'Uang Keluar dari Dompet'}
              </p>
              <div className="flex gap-2 overflow-x-auto pb-2 px-2">
                {wallets?.map(w => (
                  <button
                    key={w.id}
                    onClick={() => setWalletId(w.id)}
                    className={`px-5 py-2 rounded-full border text-xs font-bold transition-all whitespace-nowrap ${
                      walletId === w.id ? 'bg-forest text-white border-forest shadow-sm' : 'bg-white border-mint text-forest'
                    }`}
                  >
                    {w.name}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={isLoading || !contactName.trim() || !totalAmount || !walletId}
              className="w-full bg-forest text-white py-4 rounded-full font-bold text-lg flex items-center justify-center gap-2 hover:bg-forest/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? <Leaf className="animate-spin text-mint" size={24} /> : 'Tanam Catatan Hutang 🌱'}
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
