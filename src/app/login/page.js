'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage('🌿 Magic link telah dikirim! Cek email kamu.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="organic-shape bg-mint p-8 max-w-sm w-full text-center shadow-xl"
      >
        <h1 className="text-3xl font-fredoka text-forest mb-2">Terrarium.fi</h1>
        <p className="text-forest/80 mb-8 font-quicksand">Personal Finance Tracker</p>
        
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Masukkan email kamu..."
            className="w-full px-4 py-3 rounded-full bg-white border border-forest/20 text-forest placeholder:text-forest/50 focus:outline-none focus:border-spring transition-colors font-quicksand"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-forest text-white font-fredoka py-3 rounded-full hover:bg-forest/90 transition-colors disabled:opacity-50"
          >
            {loading ? 'Mengirim...' : 'Kirim Magic Link ✨'}
          </button>
        </form>
        {message && (
          <p className="mt-4 text-sm font-quicksand text-forest">{message}</p>
        )}
      </motion.div>
    </div>
  );
}
