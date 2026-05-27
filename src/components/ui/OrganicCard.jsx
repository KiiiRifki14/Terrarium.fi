'use client';
import { motion } from 'framer-motion';

export default function OrganicCard({ children, className = '', type = 'neutral' }) {
  const bgClasses = {
    income: 'bg-mint',
    expense: 'bg-[#FAD2E1]',
    neutral: 'bg-white'
  };

  return (
    <motion.div
      className={`organic-shape p-6 shadow-[0_8px_32px_rgba(45,106,79,0.05)] ${bgClasses[type]} ${className}`}
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      {children}
    </motion.div>
  );
}
