import { useEffect, useMemo, useRef, useState } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import { useData } from '../context/DataContext.jsx';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../lib/categories.js';
import { addDays, formatDayLabel, formatMoney, toISODate } from '../lib/format.js';
import { Card, Segmented, Skeleton, inputCls } from '../components/ui.jsx';
import TransactionItem from '../components/TransactionItem.jsx';

const PAGE_SIZE = 25;

const PERIODS = [
  { value: 'all', label: 'Tout' },
  { value: '7d', label: '7 jours' },
  { value: '30d', label: '30 jours' },
  { value: 'month', label: 'Ce mois' },
  { value: 'prev', label: 'Mois dernier' },
];

function periodRange(period) {
  const now = new Date();
  switch (period) {
    case '7d':
      return [toISODate(addDays(now, -6)), toISODate(now)];
    case '30d':
      return [toISODate(addDays(now, -29)), toISODate(now)];
    case 'month':
      return [toISODate(new Date(now.getFullYear(), now.getMonth(), 1)), toISODate(now)];
    case 'prev':
      return [toISODate(new Date(now.getFullYear(), now.getMonth() - 1, 1)), toISODate(new Date(now.getFullYear(), now.getMonth(), 0))];
    default:
      return [null, null];
  }
}

export default function Transactions() {
  const { transactions, budgets, status } = useData();
  const { openTx } = useOutletContext();
  // Filtres conservés dans l'URL (partageables, survivent au retour arrière)
  const [params, setParams] = useSearchParams();
  const period = params.get('period') ?? 'all';
  const type = params.get('type') ?? 'all';
  const category = params.get('category') ?? '';
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(PAGE_SIZE);

  const setFilter = (key, value, fallback) => {
    const next = new URLSearchParams(params);
    if (value === fallback) next.delete(key);
    else next.set(key, value);
    // Une catégorie de sortie n'a pas de sens pour un filtre "Entrées" (et inversement)
    if (key === 'type') next.delete('category');
    setParams(next, { replace: true });
  };

  const filtered = useMemo(() => {
    const [from, to] = periodRange(period);
    const q = query.trim().toLowerCase();
    return transactions.filter(
      (t) =>
        (!from || t.date >= from) &&
        (!to || t.date <= to) &&
        (type === 'all' || t.type === type) &&
        (!category || t.category === category) &&
        (!q || t.description.toLowerCase().includes(q) || t.category.toLowerCase().includes(q)),
    );
  }, [transactions, period, type, category, query]);

  useEffect(() => setLimit(PAGE_SIZE), [period, type, category, query]);

  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const t of filtered) t.type === 'income' ? (income += t.amount) : (expense += t.amount);
    return { income, expense };
  }, [filtered]);

  // Défilement infini : charge la page suivante quand la sentinelle devient visible
  const sentinel = useRef(null);
  const hasMore = limit < filtered.length;
  useEffect(() => {
    if (!hasMore || !sentinel.current) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setLimit((l) => l + PAGE_SIZE), { rootMargin: '200px' });
    io.observe(sentinel.current);
    return () => io.disconnect();
  }, [hasMore, filtered]);

  const groups = useMemo(() => {
    const out = [];
    for (const t of filtered.slice(0, limit)) {
      const last = out[out.length - 1];
      if (last?.date === t.date) last.items.push(t);
      else out.push({ date: t.date, items: [t] });
    }
    return out;
  }, [filtered, limit]);

  const categoryOptions = type === 'income' ? INCOME_CATEGORIES : type === 'expense' ? EXPENSE_CATEGORIES : [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];
  const budgetName = (id) => budgets.find((b) => b.id === id)?.name;

  return (
    <div className="space-y-4">
      {/* Filtres */}
      <div className="space-y-3">
        <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher…" className={inputCls} />
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setFilter('period', p.value, 'all')}
              className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
                period === p.value
                  ? 'border-indigo-600 bg-indigo-600 text-white'
                  : 'border-slate-200 bg-white text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-[1fr_auto] gap-2 sm:grid-cols-2">
          <Segmented
            value={type}
            onChange={(v) => setFilter('type', v, 'all')}
            options={[
              { value: 'all', label: 'Tous' },
              { value: 'income', label: 'Entrées', activeClass: 'text-emerald-600 dark:text-emerald-400' },
              { value: 'expense', label: 'Sorties', activeClass: 'text-rose-600 dark:text-rose-400' },
            ]}
          />
          <select value={category} onChange={(e) => setFilter('category', e.target.value, '')} className={`${inputCls} py-2 text-sm`} aria-label="Catégorie">
            <option value="">Catégorie</option>
            {categoryOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon} {c.id}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Synthèse de la sélection */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <Summary label="Entrées" value={totals.income} className="text-emerald-600 dark:text-emerald-400" />
        <Summary label="Sorties" value={totals.expense} className="text-rose-600 dark:text-rose-400" />
        <Summary label="Net" value={totals.income - totals.expense} />
      </div>

      {status === 'loading' ? (
        <Skeleton className="h-96 rounded-3xl" />
      ) : filtered.length === 0 ? (
        <Card className="py-12 text-center text-sm text-slate-500">Aucune transaction ne correspond à ces filtres.</Card>
      ) : (
        <div className="space-y-4">
          {groups.map((g) => (
            <section key={g.date}>
              <h3 className="mb-1 px-2 text-xs font-semibold tracking-wide text-slate-400 uppercase">{formatDayLabel(g.date)}</h3>
              <Card className="p-2">
                {g.items.map((t) => (
                  <TransactionItem key={t.id} tx={t} budgetName={budgetName(t.budget_id)} onClick={() => openTx(t)} />
                ))}
              </Card>
            </section>
          ))}
          {hasMore ? (
            <div ref={sentinel} className="py-4 text-center text-sm text-slate-400">Chargement…</div>
          ) : (
            <p className="py-4 text-center text-xs text-slate-400">{filtered.length} transaction{filtered.length > 1 ? 's' : ''}</p>
          )}
        </div>
      )}
    </div>
  );
}

function Summary({ label, value, className = '' }) {
  return (
    <Card className="px-2 py-3">
      <p className="text-[11px] font-medium text-slate-500 uppercase">{label}</p>
      <p className={`mt-0.5 truncate text-sm font-bold tabular-nums ${className}`}>{formatMoney(value)}</p>
    </Card>
  );
}
