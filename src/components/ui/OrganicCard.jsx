'use client';
import { motion } from 'framer-motion';

export default function OrganicCard({ children, className = '', type = 'neutral' }) {
  const bgClasses = {
    income: 'bg-gradient-to-br from-[#EBFDF5] to-[#D8F3DC] border border-mint/70',
    expense: 'bg-gradient-to-br from-[#FCF3F0] to-[#F5DACB] border border-terracotta/20',
    neutral: 'bg-white border border-mint/40'
  };

  return (
    <motion.div
      className={`organic-shape p-6 shadow-[0_8px_32px_rgba(45,106,79,0.04)] ${bgClasses[type]} ${className}`}
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      {children}
    </motion.div>
  );
}
