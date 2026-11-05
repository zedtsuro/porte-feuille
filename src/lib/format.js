const eur = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });
const eurShort = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

export const formatMoney = (n) => eur.format(n || 0);
export const formatMoneyShort = (n) => eurShort.format(n || 0);

export function formatPercent(n) {
  if (n === null || !Number.isFinite(n)) return '—';
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toFixed(1).replace('.', ',')} %`;
}

/** Date locale au format YYYY-MM-DD (sans décalage UTC). */
export function toISODate(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseISODate(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(d, n) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

const dayFmt = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
const shortFmt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' });
const monthFmt = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' });

export function formatDayLabel(iso) {
  const today = toISODate();
  const yesterday = toISODate(addDays(new Date(), -1));
  if (iso === today) return "Aujourd'hui";
  if (iso === yesterday) return 'Hier';
  return dayFmt.format(parseISODate(iso));
}

export const formatShortDate = (iso) => shortFmt.format(parseISODate(iso));
export const formatMonth = (d) => monthFmt.format(d);
