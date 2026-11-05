import { addDays, toISODate } from './format.js';

const monthKey = (d) => toISODate(d).slice(0, 7); // YYYY-MM

export function balance(transactions) {
  return transactions.reduce((s, t) => s + (t.type === 'income' ? t.amount : -t.amount), 0);
}

function totals(transactions, key) {
  let income = 0;
  let expense = 0;
  for (const t of transactions) {
    if (t.date.slice(0, 7) !== key) continue;
    if (t.type === 'income') income += t.amount;
    else expense += t.amount;
  }
  return { income, expense };
}

const change = (cur, prev) => (prev === 0 ? (cur === 0 ? 0 : null) : ((cur - prev) / prev) * 100);

/** Totaux du mois en cours vs mois précédent, avec % d'évolution. */
export function monthlyKpis(transactions, now = new Date()) {
  const cur = totals(transactions, monthKey(now));
  const prev = totals(transactions, monthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1)));
  return {
    income: cur.income,
    expense: cur.expense,
    prevIncome: prev.income,
    prevExpense: prev.expense,
    incomeChange: change(cur.income, prev.income),
    expenseChange: change(cur.expense, prev.expense),
  };
}

/** Série quotidienne entrées / sorties sur les `days` derniers jours. */
export function dailySeries(transactions, days = 30, now = new Date()) {
  const start = addDays(now, -(days - 1));
  const map = new Map();
  for (let i = 0; i < days; i++) {
    const iso = toISODate(addDays(start, i));
    map.set(iso, { date: iso, income: 0, expense: 0 });
  }
  for (const t of transactions) {
    const row = map.get(t.date);
    if (row) row[t.type] += t.amount;
  }
  return [...map.values()];
}

/** Dépenses par catégorie (période donnée par un préfixe de date, ex. "2026-11"). */
export function expensesByCategory(transactions, prefix) {
  const map = new Map();
  for (const t of transactions) {
    if (t.type !== 'expense' || !t.date.startsWith(prefix)) continue;
    map.set(t.category, (map.get(t.category) ?? 0) + t.amount);
  }
  return [...map.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
}

/**
 * Progression d'un budget.
 * - goal     : somme des transactions liées (sorties = mises de côté, entrées = retraits).
 * - envelope : dépenses du mois en cours dans la catégorie suivie ou liées au budget.
 */
export function budgetProgress(budget, transactions, now = new Date()) {
  let amount = 0;
  if (budget.kind === 'goal') {
    for (const t of transactions) {
      if (t.budget_id === budget.id) amount += t.type === 'expense' ? t.amount : -t.amount;
    }
    amount = Math.max(0, amount);
  } else {
    const key = monthKey(now);
    for (const t of transactions) {
      if (t.type !== 'expense' || t.date.slice(0, 7) !== key) continue;
      if (t.budget_id === budget.id || (budget.category && t.category === budget.category)) amount += t.amount;
    }
  }
  return { amount, percent: budget.target > 0 ? (amount / budget.target) * 100 : 0 };
}
