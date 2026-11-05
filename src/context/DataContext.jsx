import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { store } from '../lib/store.js';

const DataContext = createContext(null);

const sortTx = (rows) =>
  [...rows].sort((a, b) => b.date.localeCompare(a.date) || (b.created_at ?? '').localeCompare(a.created_at ?? ''));

export function DataProvider({ children }) {
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [error, setError] = useState(null);

  const refresh = useCallback(async (table) => {
    if (!table || table === 'transactions') setTransactions(sortTx(await store.list('transactions')));
    if (!table || table === 'budgets') setBudgets(await store.list('budgets'));
  }, []);

  useEffect(() => {
    let unsubscribe = () => {};
    (async () => {
      try {
        await store.init();
        await refresh();
        setStatus('ready');
        // Temps réel : on recharge la table modifiée (autre onglet / autre appareil)
        unsubscribe = store.subscribe((table) => refresh(table).catch(() => {}));
      } catch (e) {
        console.error(e);
        setError(e.message ?? String(e));
        setStatus('error');
      }
    })();
    return () => unsubscribe();
  }, [refresh]);

  const run = useCallback(async (fn) => {
    try {
      setError(null);
      return await fn();
    } catch (e) {
      setError(e.message ?? String(e));
      throw e;
    }
  }, []);

  const value = useMemo(
    () => ({
      mode: store.mode,
      status,
      error,
      clearError: () => setError(null),
      transactions,
      budgets,

      addTransaction: (tx) =>
        run(async () => {
          const created = await store.insert('transactions', tx);
          setTransactions((rows) => sortTx([created, ...rows]));
          return created;
        }),
      updateTransaction: (id, patch) =>
        run(async () => {
          const updated = await store.update('transactions', id, patch);
          setTransactions((rows) => sortTx(rows.map((r) => (r.id === id ? updated : r))));
        }),
      deleteTransaction: (id) =>
        run(async () => {
          await store.remove('transactions', id);
          setTransactions((rows) => rows.filter((r) => r.id !== id));
        }),

      addBudget: (b) =>
        run(async () => {
          const created = await store.insert('budgets', b);
          setBudgets((rows) => [created, ...rows]);
        }),
      updateBudget: (id, patch) =>
        run(async () => {
          const updated = await store.update('budgets', id, patch);
          setBudgets((rows) => rows.map((r) => (r.id === id ? updated : r)));
        }),
      deleteBudget: (id) =>
        run(async () => {
          await store.remove('budgets', id);
          setBudgets((rows) => rows.filter((r) => r.id !== id));
          // Les transactions liées sont détachées (ON DELETE SET NULL côté Supabase)
          setTransactions((rows) => rows.map((r) => (r.budget_id === id ? { ...r, budget_id: null } : r)));
        }),
    }),
    [status, error, transactions, budgets, run],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData doit être utilisé dans <DataProvider>');
  return ctx;
}
