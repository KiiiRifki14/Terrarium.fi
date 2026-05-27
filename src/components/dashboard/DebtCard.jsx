'use client';
import { motion } from 'framer-motion';

export default function DebtCard({ debt, wallets, onPayment, onMarkLunas }) {
  const remaining = parseFloat(debt.total_amount) - parseFloat(debt.paid_amount || 0);
  const percentage = Math.min((parseFloat(debt.paid_amount || 0) / parseFloat(debt.total_amount)) * 100, 100);
  const isLunas = debt.status === 'lunas' || percentage >= 100;
  const isHutang = debt.type === 'hutang';

  // Calculate next due date for installments
  const getNextDueLabel = () => {
    if (!debt.is_installment || !debt.installment_due_day) return null;
    const now = new Date();
    const due = new Date(now.getFullYear(), now.getMonth(), debt.installment_due_day);
    if (due < now) due.setMonth(due.getMonth() + 1);
    const diffDays = Math.round((due - now) / (1000 * 60 * 60 * 24));
    const dueStr = due.toLocaleDateString('id-ID', { day: 'numeric', month: 'long' });

    if (diffDays === 0) return { label: `Hari ini! (${dueStr})`, urgent: true };
    if (diffDays === 1) return { label: `Besok! (${dueStr})`, urgent: true };
    if (diffDays <= 3) return { label: `${diffDays} hari lagi (${dueStr})`, urgent: true };
    return { label: dueStr, urgent: false };
  };

  // Count installments paid
  const installmentsPaid = debt.is_installment && debt.installment_amount
    ? Math.floor(parseFloat(debt.paid_amount || 0) / parseFloat(debt.installment_amount))
    : null;

  const nextDue = getNextDueLabel();
  const walletName = wallets?.find(w => w.id === debt.wallet_id)?.name || '—';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white border rounded-3xl p-5 shadow-sm relative overflow-hidden ${
        isLunas ? 'border-mint/40 opacity-75' : isHutang ? 'border-terracotta/30' : 'border-spring/30'
      }`}
    >
      {/* Watermark decoration */}
      <div className="absolute top-0 right-0 translate-x-3 -translate-y-3 text-5xl opacity-5 select-none pointer-events-none">
        {isHutang ? '💸' : '🤝'}
      </div>

      {/* Header Row */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl shrink-0 ${
            isHutang ? 'bg-terracotta/10' : 'bg-spring/10'
          }`}>
            {isHutang ? '😟' : '🤝'}
          </div>
          <div className="min-w-0">
            <h4 className="font-fredoka text-forest font-bold text-base truncate">{debt.contact_name}</h4>
            {debt.description && (
              <p className="text-[11px] text-forest/50 truncate font-quicksand">{debt.description}</p>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
            isLunas
              ? 'bg-mint/40 text-forest/60'
              : isHutang
              ? 'bg-terracotta/10 text-terracotta font-bold'
              : 'bg-spring/10 text-spring font-bold'
          }`}>
            {isLunas ? '✅ Lunas' : isHutang ? '🔴 Hutang' : '🟢 Piutang'}
          </span>
          <p className="text-[10px] text-forest/40 font-quicksand">{walletName}</p>
        </div>
      </div>

      {/* Amount Info */}
      <div className="flex justify-between items-baseline mb-2">
        <p className="text-xs text-forest/50 font-bold font-quicksand">Sisa</p>
        <p className={`font-quicksand font-bold text-base ${isLunas ? 'text-forest/40 line-through' : isHutang ? 'text-terracotta' : 'text-spring'}`}>
          Rp {Math.max(remaining, 0).toLocaleString('id-ID')}
        </p>
      </div>
      <div className="flex justify-between items-center mb-3">
        <p className="text-[10px] text-forest/40 font-quicksand">
          Dibayar: Rp {parseFloat(debt.paid_amount || 0).toLocaleString('id-ID')}
        </p>
        <p className="text-[10px] text-forest/40 font-quicksand">
          Total: Rp {parseFloat(debt.total_amount).toLocaleString('id-ID')}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="h-2 w-full bg-mint/30 rounded-full overflow-hidden mb-3">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className={`h-full rounded-full ${
            isLunas ? 'bg-mint' : isHutang ? 'bg-terracotta' : 'bg-spring'
          }`}
        />
      </div>

      {/* Installment Info */}
      {debt.is_installment && (
        <div className={`text-[11px] font-bold font-quicksand mb-3 flex items-center gap-1.5 ${
          nextDue?.urgent ? 'text-terracotta' : 'text-forest/50'
        }`}>
          <span>{nextDue?.urgent ? '⚠️' : '📅'}</span>
          <span>
            Cicilan {installmentsPaid}/{debt.installment_months} bulan
            {nextDue && ` • Jatuh tempo: ${nextDue.label}`}
          </span>
        </div>
      )}

      {/* Action Buttons */}
      {!isLunas && (
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => onPayment(debt)}
            className={`flex-1 py-2.5 rounded-full text-xs font-bold transition-all shadow-sm ${
              isHutang
                ? 'bg-terracotta text-white hover:bg-terracotta/90'
                : 'bg-spring text-white hover:bg-spring/90'
            }`}
          >
            {isHutang ? '💸 Catat Pembayaran' : '💰 Catat Penerimaan'}
          </button>
          {remaining <= 0 && (
            <button
              onClick={() => onMarkLunas(debt.id)}
              className="px-4 py-2.5 rounded-full text-xs font-bold bg-mint/40 text-forest/70 hover:bg-mint transition-all"
            >
              ✅ Lunas
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}
