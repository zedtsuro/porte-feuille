import { useCallback, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useData } from '../context/DataContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import Sheet from './Sheet.jsx';
import TransactionForm from './TransactionForm.jsx';
import { HomeIcon, ListIcon, MoonIcon, PlusIcon, SunIcon, TargetIcon } from './Icons.jsx';

const NAV = [
  { to: '/', label: 'Accueil', icon: HomeIcon, end: true },
  { to: '/transactions', label: 'Historique', icon: ListIcon },
  { to: '/budgets', label: 'Budgets', icon: TargetIcon },
];

const TITLES = { '/': 'Tableau de bord', '/transactions': 'Transactions', '/budgets': 'Budgets' };

export default function Layout() {
  const location = useLocation();
  const { dark, toggle } = useTheme();
  const { mode, status, error, clearError } = useData();
  // null = fermé ; {} = création ; {id,…} = édition ; {type,budget_id,…} = création pré-remplie
  const [txForm, setTxForm] = useState(null);

  const openTx = useCallback((initial = {}) => setTxForm(initial), []);
  const closeTx = useCallback(() => setTxForm(null), []);

  return (
    <div className="mx-auto min-h-dvh max-w-2xl">
      <header className="sticky top-0 z-30 flex items-center justify-between bg-slate-50/80 px-4 pt-[max(env(safe-area-inset-top),0.75rem)] pb-3 backdrop-blur-lg dark:bg-slate-950/80">
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            👛 Porte-feuille {mode === 'local' && <span className="ml-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">démo locale</span>}
          </p>
          <h1 className="text-xl font-bold">{TITLES[location.pathname] ?? 'Porte-feuille'}</h1>
        </div>
        <button
          onClick={toggle}
          className="rounded-full border border-slate-200 bg-white p-2.5 text-slate-600 shadow-sm transition active:scale-90 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
          aria-label={dark ? 'Passer en mode clair' : 'Passer en mode sombre'}
        >
          {dark ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
        </button>
      </header>

      {error && (
        <div className="mx-4 mb-3 flex items-start justify-between gap-3 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
          <span>Erreur : {error}</span>
          <button onClick={clearError} className="font-semibold">OK</button>
        </div>
      )}

      {/* key = pathname : rejoue l'animation d'entrée à chaque changement de route */}
      <main key={location.pathname} className="page-enter px-4 pb-32">
        {status === 'error' ? (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
            <p className="text-lg font-semibold">Connexion impossible</p>
            <p className="mt-1 text-sm">Les données n'ont pas pu être chargées. Vérifiez la configuration Supabase (voir le README).</p>
            <button onClick={() => window.location.reload()} className="mt-4 rounded-2xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white">
              Réessayer
            </button>
          </div>
        ) : (
          <Outlet context={{ openTx }} />
        )}
      </main>

      {/* Barre de navigation basse + bouton d'ajout à portée de pouce */}
      <nav className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/70 bg-white/90 backdrop-blur-lg dark:border-slate-800 dark:bg-slate-900/90">
        <div className="relative mx-auto grid max-w-2xl grid-cols-4 items-center px-2">
          {NAV.map((n) => <NavItem key={n.to} {...n} />)}
          <div className="flex justify-center py-2">
            <button
              onClick={() => openTx()}
              className="grid h-14 w-14 place-items-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/40 transition hover:bg-indigo-500 active:scale-90"
              aria-label="Ajouter une transaction"
            >
              <PlusIcon className="h-7 w-7" />
            </button>
          </div>
        </div>
      </nav>

      <Sheet open={txForm !== null} onClose={closeTx} title={txForm?.id ? 'Modifier la transaction' : 'Nouvelle transaction'}>
        {txForm !== null && <TransactionForm key={txForm.id ?? 'new'} initial={txForm} onDone={closeTx} />}
      </Sheet>
    </div>
  );
}

function NavItem({ to, label, icon: Icon, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex flex-col items-center gap-0.5 py-3 text-[11px] font-medium transition ${
          isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
        }`
      }
    >
      <Icon className="h-6 w-6" />
      {label}
    </NavLink>
  );
}
