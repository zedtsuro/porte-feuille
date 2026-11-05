export const EXPENSE_CATEGORIES = [
  { id: 'Alimentation', icon: '🛒', color: '#f97316' },
  { id: 'Logement', icon: '🏠', color: '#6366f1' },
  { id: 'Transports', icon: '🚆', color: '#0ea5e9' },
  { id: 'Loisirs', icon: '🎬', color: '#ec4899' },
  { id: 'Santé', icon: '💊', color: '#14b8a6' },
  { id: 'Shopping', icon: '🛍️', color: '#a855f7' },
  { id: 'Factures', icon: '🧾', color: '#eab308' },
  { id: 'Épargne', icon: '🐷', color: '#22c55e' },
  { id: 'Autre', icon: '📦', color: '#64748b' },
];

export const INCOME_CATEGORIES = [
  { id: 'Salaire', icon: '💼', color: '#10b981' },
  { id: 'Freelance', icon: '💻', color: '#06b6d4' },
  { id: 'Remboursement', icon: '↩️', color: '#84cc16' },
  { id: 'Cadeau', icon: '🎁', color: '#f43f5e' },
  { id: 'Autre revenu', icon: '✨', color: '#64748b' },
];

const ALL = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

export function categoryMeta(id) {
  return ALL.find((c) => c.id === id) ?? { id, icon: '•', color: '#64748b' };
}

export function categoriesFor(type) {
  return type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
}

export const BUDGET_COLORS = ['#6366f1', '#10b981', '#f97316', '#ec4899', '#0ea5e9', '#eab308', '#a855f7'];
