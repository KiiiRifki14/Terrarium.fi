'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { Leaf } from 'lucide-react';

export default function WalletSetup({ onComplete }) {
  const [wallets, setWallets] = useState([{ name: 'Cash', balance: '' }]);
  const [loading, setLoading] = useState(false);

  const handleAdd = () => setWallets([...wallets, { name: '', balance: '' }]);
  
  const handleUpdate = (index, field, value) => {
    const newWallets = [...wallets];
    newWallets[index][field] = value;
    setWallets(newWallets);
  };

  const handleSave = async () => {
    const validWallets = wallets.filter(w => w.name.trim());
    if (validWallets.length === 0) return;
    
    setLoading(true);
    
    // Insert wallets
    const inserts = validWallets.map(w => ({
      name: w.name,
      initial_balance: parseFloat(w.balance) || 0
    }));
    
    const { error } = await supabase.from('wallets').insert(inserts);
    
    setLoading(false);
    if (!error) {
      onComplete();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-[40px] shadow-xl w-full max-w-md border border-mint"
      >
        <h2 className="text-3xl font-fredoka text-forest mb-2">Setup Tamanmu 🌿</h2>
        <p className="text-forest/70 mb-8 font-quicksand">Tambahkan dompet/rekening awalmu sebelum mulai mencatat.</p>
        
        <div className="space-y-4 mb-8">
          {wallets.map((w, i) => (
            <div key={i} className="flex gap-2">
              <input 
                type="text"
                placeholder="Nama (Cth: Cash, BCA)"
                value={w.name}
                onChange={(e) => handleUpdate(i, 'name', e.target.value)}
                className="flex-1 bg-mint/20 px-4 py-3 rounded-2xl outline-none focus:border focus:border-forest"
              />
              <input 
                type="number"
                placeholder="Saldo Awal"
                value={w.balance}
                onChange={(e) => handleUpdate(i, 'balance', e.target.value)}
                className="w-1/3 bg-mint/20 px-4 py-3 rounded-2xl outline-none focus:border focus:border-forest"
              />
            </div>
          ))}
        </div>
        
        <button 
          onClick={handleAdd}
          className="text-spring font-bold w-full mb-8"
        >
          + Tambah Dompet Lain
        </button>
        
        <button 
          onClick={handleSave}
          disabled={loading}
          className="w-full bg-forest text-white py-4 rounded-full font-bold text-lg flex items-center justify-center gap-2 hover:opacity-90"
        >
          {loading ? <Leaf className="animate-spin" /> : 'Mulai Tanam 🪴'}
        </button>
      </motion.div>
    </div>
  );
}
