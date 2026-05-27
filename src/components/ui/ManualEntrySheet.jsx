'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { Leaf } from 'lucide-react';

export default function ManualEntrySheet({ isOpen, onClose, wallets, onSave }) {
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense');
  const [walletId, setWalletId] = useState(wallets?.[0]?.id || '');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!amount || !description || !walletId) return;
    setIsLoading(true);
    
    // Generate batch_id
    const batch_id = crypto.randomUUID();
    
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
      onSave(); // Refresh dashboard
      onClose();
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
            
            <div className="flex gap-4 mb-6">
               <button 
                 onClick={() => setType('income')}
                 className={`flex-1 py-3 rounded-full font-bold transition-colors ${type === 'income' ? 'bg-spring text-white' : 'bg-mint text-forest'}`}
               >
                 + Pemasukan
               </button>
               <button 
                 onClick={() => setType('expense')}
                 className={`flex-1 py-3 rounded-full font-bold transition-colors ${type === 'expense' ? 'bg-terracotta text-white' : 'bg-terracotta/20 text-terracotta'}`}
               >
                 - Pengeluaran
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
                placeholder="Deskripsi (Cth: Beli Kopi)"
                className="w-full bg-white px-4 py-3 rounded-2xl border border-mint focus:outline-none focus:border-forest text-forest"
              />
              <input 
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Kategori (Cth: Makanan)"
                className="w-full bg-white px-4 py-3 rounded-2xl border border-mint focus:outline-none focus:border-forest text-forest"
              />
            </div>
            
            <div className="mb-6">
              <p className="text-sm text-forest/70 font-bold mb-2 ml-2">Pilih Dompet</p>
              <div className="flex gap-2 overflow-x-auto pb-2 px-2">
                {wallets?.map(w => (
                  <button 
                    key={w.id} 
                    onClick={() => setWalletId(w.id)}
                    className={`px-6 py-2 rounded-full border transition-colors whitespace-nowrap ${walletId === w.id ? 'bg-forest text-white border-forest' : 'bg-white border-mint text-forest'}`}
                  >
                    {w.name}
                  </button>
                ))}
              </div>
            </div>
            
            <button 
              onClick={handleSave}
              disabled={isLoading || !amount || !description}
              className="w-full bg-forest text-white py-4 rounded-full font-bold text-lg flex items-center justify-center gap-2 hover:bg-forest/90 disabled:opacity-50"
            >
              {isLoading ? <Leaf className="animate-spin" size={24} /> : 'Tanam Transaksi 🌱'}
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
