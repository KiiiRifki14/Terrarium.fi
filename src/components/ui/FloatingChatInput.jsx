'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Leaf } from 'lucide-react';

export default function FloatingChatInput({ onSubmit, isLoading }) {
  const [text, setText] = useState('');

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    
    await onSubmit(text);
    setText('');
  };

  return (
    <div className="fixed bottom-6 left-0 right-0 px-4 md:max-w-lg md:mx-auto z-40">
      <motion.form 
        onSubmit={handleSend}
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex items-center bg-white p-2 rounded-full shadow-[0_10px_40px_rgba(45,106,79,0.15)] border-2 border-mint"
      >
        <input 
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Cth: Beli es kopi 20rb dari kembalian..."
          className="flex-1 bg-transparent px-4 py-3 outline-none font-quicksand text-forest placeholder:text-forest/40"
          disabled={isLoading}
        />
        <motion.button 
          whileTap={{ scale: 0.9 }}
          type="submit"
          disabled={isLoading || !text.trim()}
          className="bg-forest text-white rounded-full flex items-center justify-center aspect-square h-12 w-12 disabled:opacity-50"
        >
          {isLoading ? <Leaf className="animate-spin" size={20} /> : <Send size={20} />}
        </motion.button>
      </motion.form>
    </div>
  );
}
