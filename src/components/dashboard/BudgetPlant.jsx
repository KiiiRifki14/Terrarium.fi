'use client';
import { motion } from 'framer-motion';

export default function BudgetPlant({ category, limit, spent }) {
  const percentage = Math.min((spent / limit) * 100, 100);
  
  let state = 'healthy';
  let emoji = '🌱';
  let color = 'text-spring';
  
  if (percentage > 80) {
    state = 'wilted';
    emoji = '🥀';
    color = 'text-terracotta';
  } else if (percentage > 50) {
    state = 'yellowing';
    emoji = '🌿';
    color = 'text-yellow-600';
  }

  const plantVariants = {
    healthy: { rotate: [0, 5, -5, 0], transition: { repeat: Infinity, duration: 4, ease: "easeInOut" } },
    yellowing: { rotate: [0, 2, -2, 0], transition: { repeat: Infinity, duration: 5, ease: "easeInOut" } },
    wilted: { rotate: 20, y: 5, transition: { duration: 0.5 } }
  };

  return (
    <div className="bg-white rounded-3xl p-4 border border-mint flex items-center gap-4">
      <motion.div 
        className="text-4xl"
        variants={plantVariants}
        animate={state}
      >
        {emoji}
      </motion.div>
      <div className="flex-1">
        <div className="flex justify-between items-end mb-2">
          <h4 className="font-fredoka text-forest">{category}</h4>
          <span className={`text-sm font-bold ${color}`}>
            {Math.round(percentage)}%
          </span>
        </div>
        <div className="h-2 w-full bg-mint/50 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`h-full rounded-full ${percentage > 80 ? 'bg-terracotta' : percentage > 50 ? 'bg-yellow-500' : 'bg-spring'}`}
          />
        </div>
        <p className="text-xs text-forest/50 mt-2">
          Rp {spent.toLocaleString()} / Rp {limit.toLocaleString()}
        </p>
      </div>
    </div>
  );
}
