import { categoryMeta } from '../lib/categories.js';
import { formatMoney } from '../lib/format.js';

export default function TransactionItem({ tx, onClick, budgetName }) {
  const meta = categoryMeta(tx.category);
  const income = tx.type === 'income';
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl px-2 py-2.5 text-left transition hover:bg-slate-50 active:scale-[0.99] dark:hover:bg-slate-800/60"
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-xl" style={{ backgroundColor: `${meta.color}22` }}>
        {meta.icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{tx.description || tx.category}</span>
        <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
          {tx.category}
          {budgetName && ` · ${budgetName}`}
        </span>
      </span>
      <span className={`shrink-0 font-semibold tabular-nums ${income ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>
        {income ? '+' : '−'}
        {formatMoney(tx.amount)}
      </span>
    </button>
  );
}
