import { useCallback, useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useData } from '../context/DataContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { formatMonth } from '../lib/format.js';
import Sheet from './Sheet.jsx';
import TransactionForm from './TransactionForm.jsx';
import { HomeIcon, ListIcon, MoonIcon, PlusIcon, SunIcon, TargetIcon } from './Icons.jsx';

const NAV = [
  { to: '/', label: 'Accueil', icon: HomeIcon, end: true },
  { to: '/transactions', label: 'Historique', icon: ListIcon },
  { to: '/budgets', label: 'Budgets', icon: TargetIcon },
];

const TITLES = { '/': 'Tableau de bord', '/transactions': 'Transactions', '/budgets': 'Budgets' };

const logoSrc = `${import.meta.env.BASE_URL}logo.svg`;

export default function Layout() {
  const location = useLocation();
  const { dark, toggle } = useTheme();
  const { mode, status, error, clearError } = useData();
  // null = fermé ; {} = création ; {id,…} = édition ; {type,budget_id,…} = création pré-remplie
  const [txForm, setTxForm] = useState(null);

  const openTx = useCallback((initial = {}) => setTxForm(initial), []);
  const closeTx = useCallback(() => setTxForm(null), []);

  // Raccourci clavier « N » : nouvelle transaction (hors champs de saisie)
  const formOpen = txForm !== null;
  useEffect(() => {
    if (formOpen) return;
    const onKey = (e) => {
      if (e.key.toLowerCase() !== 'n' || e.ctrlKey || e.metaKey || e.altKey) return;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName) || e.target.isContentEditable) return;
      e.preventDefault();
      openTx();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [formOpen, openTx]);

  const demoBadge = mode === 'local' && (
    <span className="ml-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">démo locale</span>
  );

  return (
    <div className="min-h-dvh lg:pl-64">
      {/* Barre latérale (PC) */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-slate-200/70 bg-white px-4 py-6 lg:flex dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-3 px-2">
          <img src={logoSrc} alt="" className="h-10 w-10 rounded-xl shadow-md shadow-indigo-600/30" />
          <div>
            <p className="font-bold">Porte-feuille</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{mode === 'local' ? demoBadge : 'Synchronisé'}</p>
          </div>
        </div>
        <button
          onClick={() => openTx()}
          className="mt-8 flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-3 font-semibold text-white shadow-lg shadow-indigo-600/25 transition hover:bg-indigo-500 active:scale-[0.98]"
        >
          <PlusIcon className="h-5 w-5" /> Nouvelle transaction
        </button>
        <nav className="mt-6 space-y-1">
          {NAV.map((n) => <SideNavItem key={n.to} {...n} />)}
        </nav>
        <p className="mt-auto px-2 text-xs text-slate-400">
          Raccourci : <kbd className="rounded border border-slate-300 px-1 dark:border-slate-700">N</kbd> nouvelle transaction
        </p>
      </aside>

      <div className="mx-auto max-w-2xl lg:max-w-6xl">
        <header className="sticky top-0 z-30 flex items-center justify-between bg-slate-50/80 px-4 pt-[max(env(safe-area-inset-top),0.75rem)] pb-3 backdrop-blur-lg lg:px-8 lg:pt-6 lg:pb-4 dark:bg-slate-950/80">
          <div className="flex items-center gap-3">
            <img src={logoSrc} alt="" className="h-10 w-10 shrink-0 rounded-xl shadow-md shadow-indigo-600/30 lg:hidden" />
            <div>
              <p className="text-xs font-medium text-slate-500 lg:hidden dark:text-slate-400">Porte-feuille {demoBadge}</p>
              <p className="hidden text-sm font-medium text-slate-500 capitalize lg:block dark:text-slate-400">{formatMonth(new Date())}</p>
              <h1 className="text-xl font-bold lg:text-3xl">{TITLES[location.pathname] ?? 'Porte-feuille'}</h1>
            </div>
          </div>
          <button
            onClick={toggle}
            className="rounded-full border border-slate-200 bg-white p-2.5 text-slate-600 shadow-sm transition hover:bg-slate-100 active:scale-90 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            aria-label={dark ? 'Passer en mode clair' : 'Passer en mode sombre'}
          >
            {dark ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
          </button>
        </header>

        {error && (
          <div className="mx-4 mb-3 flex items-start justify-between gap-3 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 lg:mx-8 dark:bg-rose-500/10 dark:text-rose-300">
            <span>Erreur : {error}</span>
            <button onClick={clearError} className="font-semibold">OK</button>
          </div>
        )}

        {/* key = pathname : rejoue l'animation d'entrée à chaque changement de route */}
        <main key={location.pathname} className="page-enter px-4 pb-32 lg:px-8 lg:pb-12">
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
      </div>

      {/* Barre de navigation basse + bouton d'ajout à portée de pouce (mobile / tablette) */}
      <nav className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/70 bg-white/90 backdrop-blur-lg lg:hidden dark:border-slate-800 dark:bg-slate-900/90">
        <div className="relative mx-auto grid max-w-2xl grid-cols-4 items-center px-2">
          {NAV.map((n) => <BottomNavItem key={n.to} {...n} />)}
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

function BottomNavItem({ to, label, icon: Icon, end }) {
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

function SideNavItem({ to, label, icon: Icon, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
          isActive
            ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300'
            : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
        }`
      }
    >
      <Icon className="h-5 w-5" />
      {label}
    </NavLink>
  );
}
