'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { Leaf } from 'lucide-react';

export default function DebtPaymentSheet({ isOpen, onClose, debt, wallets, onSave }) {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [walletId, setWalletId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isHutang = debt?.type === 'hutang';
  const remaining = debt ? parseFloat(debt.total_amount) - parseFloat(debt.paid_amount || 0) : 0;

  // Pre-fill installment amount and default wallet
  useEffect(() => {
    if (isOpen && debt) {
      setAmount(debt.installment_amount ? String(debt.installment_amount) : String(Math.max(remaining, 0)));
      setWalletId(debt.wallet_id || wallets?.[0]?.id || '');
    }
  }, [isOpen, debt]);

  const handleSave = async () => {
    if (!amount || !walletId || !debt) return;
    setIsLoading(true);

    const payAmount = parseFloat(amount);
    const newPaidAmount = parseFloat(debt.paid_amount || 0) + payAmount;
    const isNowLunas = newPaidAmount >= parseFloat(debt.total_amount);

    // 1. Create a linked transaction in the transactions table
    const txCategory = isHutang ? 'Bayar Hutang' : 'Terima Piutang';
    const txType = isHutang ? 'expense' : 'income';
    const txDesc = isHutang
      ? `Bayar hutang ke ${debt.contact_name}`
      : `Terima piutang dari ${debt.contact_name}`;

    const txResult = await supabase.from('transactions').insert([{
      wallet_id: walletId,
      batch_id: crypto.randomUUID(),
      amount: payAmount,
      type: txType,
      description: txDesc,
      category: txCategory,
      raw_input_text: `Debt Payment - ${debt.id}`,
    }]).select().single();

    if (txResult.error) {
      console.error('Transaction error:', txResult.error);
      setIsLoading(false);
      return;
    }

    // 2. Record in debt_payments table
    const { error: paymentError } = await supabase.from('debt_payments').insert([{
      debt_id: debt.id,
      amount: payAmount,
      note: note || null,
      wallet_id: walletId,
      transaction_id: txResult.data?.id || null,
    }]);

    if (paymentError) {
      console.error('Debt payment error:', paymentError);
    }

    // 3. Update paid_amount on debt — and set lunas if fully paid
    const updatePayload = {
      paid_amount: newPaidAmount,
      ...(isNowLunas ? { status: 'lunas' } : {}),
    };

    await supabase.from('debts').update(updatePayload).eq('id', debt.id);

    setIsLoading(false);
    setAmount('');
    setNote('');
    onSave();
    onClose();
  };

  if (!debt) return null;

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
            className="fixed bottom-0 left-0 right-0 bg-cream rounded-t-[40px] p-6 z-50 shadow-[0_-10px_40px_rgba(45,106,79,0.15)] md:max-w-lg md:mx-auto"
          >
            <div className="w-16 h-2 bg-mint rounded-full mx-auto mb-6" />

            <h2 className="text-2xl font-fredoka text-forest mb-1 text-center">
              {isHutang ? '💸 Catat Pembayaran' : '💰 Catat Penerimaan'}
            </h2>
            <p className="text-center text-xs text-forest/50 font-quicksand font-bold mb-6">
              {isHutang ? `Bayar hutang ke` : `Terima uang dari`} <span className="text-forest font-bold">{debt.contact_name}</span>
              {' · '}Sisa Rp {Math.max(remaining, 0).toLocaleString('id-ID')}
            </p>

            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="w-full text-center text-5xl font-quicksand font-bold text-forest bg-transparent border-b-2 border-mint focus:border-forest outline-none pb-4 mb-6"
            />

            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Catatan (opsional)"
              className="w-full bg-white px-4 py-3 rounded-2xl border border-mint focus:outline-none focus:border-forest text-forest font-quicksand font-bold text-sm mb-6"
            />

            <div className="mb-6">
              <p className="text-xs text-forest/70 font-bold mb-2 ml-2">{isHutang ? 'Bayar dari Dompet' : 'Terima ke Dompet'}</p>
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
              disabled={isLoading || !amount || !walletId}
              className={`w-full py-4 rounded-full font-bold text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-white ${
                isHutang ? 'bg-terracotta hover:bg-terracotta/90' : 'bg-spring hover:bg-spring/90'
              }`}
            >
              {isLoading ? <Leaf className="animate-spin text-white/70" size={24} /> : (isHutang ? 'Catat Pembayaran 🌱' : 'Catat Penerimaan 🌱')}
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
