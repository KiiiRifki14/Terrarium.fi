'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { Leaf } from 'lucide-react';

export default function ManualEntrySheet({ isOpen, onClose, wallets, onSave }) {
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense');
  const [walletId, setWalletId] = useState('');
  const [toWalletId, setToWalletId] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Sync state when wallets are loaded
  useEffect(() => {
    if (wallets?.length > 0) {
      if (!walletId) setWalletId(wallets[0].id);
      if (!toWalletId) setToWalletId(wallets[1]?.id || wallets[0].id);
    }
  }, [wallets, walletId, toWalletId]);

  const handleSave = async () => {
    if (!amount || !description) return;
    if (type === 'transfer' && (!walletId || !toWalletId || walletId === toWalletId)) {
      alert("Pilih dompet asal dan tujuan yang berbeda.");
      return;
    }
    if (type !== 'transfer' && !walletId) return;

    setIsLoading(true);
    const batch_id = crypto.randomUUID();

    if (type === 'transfer') {
      const tx1Id = crypto.randomUUID();
      const tx2Id = crypto.randomUUID();
      
      const fromWalletName = wallets.find(w => w.id === walletId)?.name || 'Cash';
      const toWalletName = wallets.find(w => w.id === toWalletId)?.name || 'E-Wallet';

      const { error } = await supabase.from('transactions').insert([
        {
          id: tx1Id,
          wallet_id: walletId,
          batch_id,
          amount: parseFloat(amount),
          type: 'expense',
          description: `${description} (ke ${toWalletName})`,
          category: 'Transfer',
          raw_input_text: 'Manual Transfer',
          transfer_pair_id: tx2Id
        },
        {
          id: tx2Id,
          wallet_id: toWalletId,
          batch_id,
          amount: parseFloat(amount),
          type: 'income',
          description: `${description} (dari ${fromWalletName})`,
          category: 'Transfer',
          raw_input_text: 'Manual Transfer',
          transfer_pair_id: tx1Id
        }
      ]);

      setIsLoading(false);
      if (!error) {
        setAmount('');
        setDescription('');
        setCategory('');
        onSave();
        onClose();
      } else {
        alert('Gagal transfer: ' + error.message);
      }
    } else {
      const { error } = await supabase.from('transactions').insert([{
        wallet_id: walletId,
        batch_id,
        amount: parseFloat(amount),
        type,
        description,
        category: category || 'General',
        raw_input_text: 'Manual Entry'
      }]);

      setIsLoading(false);
      if (!error) {
        setAmount('');
        setDescription('');
        setCategory('');
        onSave();
        onClose();
      } else {
        alert('Gagal menanam transaksi: ' + error.message);
      }
    }
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
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            className="fixed bottom-0 left-0 right-0 bg-cream rounded-t-[40px] p-6 z-50 shadow-[0_-10px_40px_rgba(45,106,79,0.1)] overflow-y-auto max-h-[90vh] md:max-w-lg md:mx-auto"
          >
            <div className="w-16 h-2 bg-mint rounded-full mx-auto mb-8" />
            
            <h2 className="text-2xl font-fredoka text-forest mb-6 text-center">Tambah Cepat 🌿</h2>
            
            <div className="grid grid-cols-3 gap-2 mb-6">
               <button 
                 onClick={() => setType('income')}
                 className={`py-3 rounded-full font-bold text-xs transition-all ${type === 'income' ? 'bg-spring text-white shadow-sm' : 'bg-mint/60 text-forest'}`}
               >
                 + Masuk
               </button>
               <button 
                 onClick={() => setType('expense')}
                 className={`py-3 rounded-full font-bold text-xs transition-all ${type === 'expense' ? 'bg-terracotta text-white shadow-sm' : 'bg-terracotta/20 text-terracotta'}`}
               >
                 - Keluar
               </button>
               <button 
                 onClick={() => setType('transfer')}
                 className={`py-3 rounded-full font-bold text-xs transition-all ${type === 'transfer' ? 'bg-forest text-white shadow-sm' : 'bg-mint/60 text-forest'}`}
               >
                 ↔️ Transfer
               </button>
            </div>
            
            <input 
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="w-full text-center text-5xl font-quicksand font-bold text-forest bg-transparent border-b-2 border-mint focus:border-forest outline-none pb-4 mb-6"
            />

            <div className="space-y-4 mb-6">
              <input 
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={type === 'transfer' ? "Deskripsi transfer (Cth: Pindah Saldo Bulanan)" : "Deskripsi (Cth: Beli Kopi)"}
                className="w-full bg-white px-4 py-3 rounded-2xl border border-mint focus:outline-none focus:border-forest text-forest font-quicksand font-bold text-sm"
              />
              {type !== 'transfer' && (
                <input 
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Kategori (Cth: Makanan)"
                  className="w-full bg-white px-4 py-3 rounded-2xl border border-mint focus:outline-none focus:border-forest text-forest font-quicksand font-bold text-sm"
                />
              )}
            </div>
            
            <div className="mb-6">
              {type === 'transfer' ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-forest/70 font-bold mb-2 ml-2">Dari Dompet (Asal) 📤</p>
                    <div className="flex gap-2 overflow-x-auto pb-2 px-2 scrollbar-none">
                      {wallets?.map(w => (
                        <button 
                          key={`from-${w.id}`}
                          onClick={() => setWalletId(w.id)}
                          className={`px-5 py-2 rounded-full border text-xs font-bold transition-all whitespace-nowrap ${walletId === w.id ? 'bg-terracotta text-white border-terracotta shadow-sm animate-pulse' : 'bg-white border-mint text-forest'}`}
                        >
                          {w.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-forest/70 font-bold mb-2 ml-2">Ke Dompet (Tujuan) 📥</p>
                    <div className="flex gap-2 overflow-x-auto pb-2 px-2 scrollbar-none">
                      {wallets?.map(w => (
                        <button 
                          key={`to-${w.id}`}
                          onClick={() => setToWalletId(w.id)}
                          className={`px-5 py-2 rounded-full border text-xs font-bold transition-all whitespace-nowrap ${toWalletId === w.id ? 'bg-spring text-white border-spring shadow-sm animate-pulse' : 'bg-white border-mint text-forest'}`}
                        >
                          {w.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-xs text-forest/70 font-bold mb-2 ml-2">Pilih Dompet</p>
                  <div className="flex gap-2 overflow-x-auto pb-2 px-2 scrollbar-none">
                    {wallets?.map(w => (
                      <button 
                        key={w.id} 
                        onClick={() => setWalletId(w.id)}
                        className={`px-6 py-2 rounded-full border text-xs font-bold transition-all whitespace-nowrap ${walletId === w.id ? 'bg-forest text-white border-forest shadow-sm' : 'bg-white border-mint text-forest'}`}
                      >
                        {w.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <button 
              onClick={handleSave}
              disabled={isLoading || !amount || !description || (type === 'transfer' && walletId === toWalletId)}
              className="w-full bg-forest text-white py-4 rounded-full font-bold text-lg flex items-center justify-center gap-2 hover:bg-forest/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? <Leaf className="animate-spin text-mint" size={24} /> : 'Tanam Transaksi 🌱'}
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
