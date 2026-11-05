import { useMemo, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useData } from '../context/DataContext.jsx';
import { categoryMeta } from '../lib/categories.js';
import { formatMoney, formatMoneyShort, formatMonth, formatPercent, formatShortDate, toISODate } from '../lib/format.js';
import { balance, dailySeries, expensesByCategory, monthlyKpis } from '../lib/stats.js';
import { Card, SectionTitle, Skeleton } from '../components/ui.jsx';
import TransactionItem from '../components/TransactionItem.jsx';
import { ArrowDownIcon, ArrowUpIcon } from '../components/Icons.jsx';

const INCOME = '#10b981';
const EXPENSE = '#f43f5e';

export default function Dashboard() {
  const { transactions, budgets, status } = useData();
  const { openTx } = useOutletContext();

  const stats = useMemo(() => {
    const now = new Date();
    return {
      balance: balance(transactions),
      kpis: monthlyKpis(transactions, now),
      series: dailySeries(transactions, 30, now),
      byCategory: expensesByCategory(transactions, toISODate(now).slice(0, 7)),
    };
  }, [transactions]);

  if (status === 'loading') return <DashboardSkeleton />;

  const budgetName = (id) => budgets.find((b) => b.id === id)?.name;

  return (
    <div className="space-y-4">
      {/* Solde */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-600 p-6 text-white shadow-xl shadow-indigo-600/20">
        <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <p className="text-sm font-medium text-indigo-100">Solde disponible</p>
        <p className="mt-1 text-4xl font-bold tracking-tight tabular-nums sm:text-5xl">{formatMoney(stats.balance)}</p>
        <p className="mt-3 text-sm text-indigo-100 capitalize">{formatMonth(new Date())}</p>
      </section>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3">
        <Kpi label="Revenus du mois" value={stats.kpis.income} change={stats.kpis.incomeChange} positiveIsGood color={INCOME} icon={ArrowDownIcon} />
        <Kpi label="Dépenses du mois" value={stats.kpis.expense} change={stats.kpis.expenseChange} color={EXPENSE} icon={ArrowUpIcon} />
      </div>

      {/* Évolution 30 jours */}
      <Card>
        <SectionTitle
          action={
            <div className="flex gap-3 text-xs font-medium">
              <Legend color={INCOME} label="Entrées" />
              <Legend color={EXPENSE} label="Sorties" />
            </div>
          }
        >
          30 derniers jours
        </SectionTitle>
        <div className="-ml-2 h-56 text-slate-400">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats.series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={INCOME} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={INCOME} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={EXPENSE} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={EXPENSE} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="currentColor" strokeOpacity={0.15} />
              <XAxis dataKey="date" tickFormatter={formatShortDate} tick={{ fill: 'currentColor', fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={28} />
              <YAxis tickFormatter={formatMoneyShort} tick={{ fill: 'currentColor', fontSize: 11 }} tickLine={false} axisLine={false} width={64} />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'currentColor', strokeOpacity: 0.3 }} />
              <Area type="monotone" dataKey="income" name="Entrées" stroke={INCOME} strokeWidth={2} fill="url(#gIncome)" animationDuration={900} />
              <Area type="monotone" dataKey="expense" name="Sorties" stroke={EXPENSE} strokeWidth={2} fill="url(#gExpense)" animationDuration={900} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Répartition par catégorie */}
      <Card>
        <SectionTitle>Dépenses par catégorie</SectionTitle>
        {stats.byCategory.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">Aucune dépense ce mois-ci.</p>
        ) : (
          <CategoryBreakdown data={stats.byCategory} total={stats.kpis.expense} />
        )}
      </Card>

      {/* Dernières opérations */}
      <Card>
        <SectionTitle action={<Link to="/transactions" className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">Tout voir</Link>}>
          Récemment
        </SectionTitle>
        {transactions.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">Aucune transaction. Appuyez sur + pour commencer.</p>
        ) : (
          <div className="-mx-2">
            {transactions.slice(0, 5).map((t) => (
              <TransactionItem key={t.id} tx={t} budgetName={budgetName(t.budget_id)} onClick={() => openTx(t)} />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function Kpi({ label, value, change, color, icon: Icon, positiveIsGood = false }) {
  const good = change === null || change === 0 ? null : positiveIsGood ? change > 0 : change < 0;
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-xl" style={{ backgroundColor: `${color}1f`, color }}>
          <Icon className="h-4 w-4" />
        </span>
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</span>
      </div>
      <p className="mt-3 text-xl font-bold tabular-nums sm:text-2xl">{formatMoney(value)}</p>
      <p className="mt-1 text-xs">
        <span
          className={`rounded-full px-1.5 py-0.5 font-semibold ${
            good === null
              ? 'bg-slate-100 text-slate-500 dark:bg-slate-800'
              : good
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
                : 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400'
          }`}
        >
          {formatPercent(change)}
        </span>
        <span className="ml-1 text-slate-400">vs mois dernier</span>
      </p>
    </Card>
  );
}

function CategoryBreakdown({ data, total }) {
  const [active, setActive] = useState(null);
  const shown = active !== null ? data[active] : null;

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="relative h-48 w-48 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="62%"
              outerRadius="100%"
              paddingAngle={2}
              stroke="none"
              animationDuration={900}
              onMouseEnter={(_, i) => setActive(i)}
              onMouseLeave={() => setActive(null)}
              onClick={(_, i) => setActive((a) => (a === i ? null : i))}
            >
              {data.map((d, i) => (
                <Cell key={d.name} fill={categoryMeta(d.name).color} opacity={active === null || active === i ? 1 : 0.35} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="text-xs text-slate-500">{shown ? shown.name : 'Total'}</p>
            <p className="text-lg font-bold tabular-nums">{formatMoney(shown ? shown.value : total)}</p>
          </div>
        </div>
      </div>
      <ul className="w-full space-y-1.5">
        {data.map((d, i) => {
          const meta = categoryMeta(d.name);
          return (
            <li
              key={d.name}
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive(null)}
              className={`flex items-center gap-2 rounded-xl px-2 py-1 text-sm transition ${active === i ? 'bg-slate-100 dark:bg-slate-800' : ''}`}
            >
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: meta.color }} />
              <span className="flex-1 truncate">
                {meta.icon} {d.name}
              </span>
              <span className="text-xs text-slate-400 tabular-nums">{total > 0 ? Math.round((d.value / total) * 100) : 0} %</span>
              <span className="w-24 text-right font-medium tabular-nums">{formatMoney(d.value)}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg dark:border-slate-700 dark:bg-slate-800">
      <p className="mb-1 font-semibold text-slate-700 dark:text-slate-200">{formatShortDate(label)}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.stroke }} />
          {p.name} : <span className="font-semibold tabular-nums">{formatMoney(p.value)}</span>
        </p>
      ))}
    </div>
  );
}

function Legend({ color, label }) {
  return (
    <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-36 rounded-3xl" />
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-28 rounded-3xl" />
        <Skeleton className="h-28 rounded-3xl" />
      </div>
      <Skeleton className="h-64 rounded-3xl" />
      <Skeleton className="h-64 rounded-3xl" />
    </div>
  );
}
