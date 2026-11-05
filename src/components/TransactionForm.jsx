import { useState } from 'react';
import { useData } from '../context/DataContext.jsx';
import { categoriesFor } from '../lib/categories.js';
import { toISODate } from '../lib/format.js';
import { Field, Segmented, inputCls } from './ui.jsx';
import { TrashIcon } from './Icons.jsx';

/**
 * Formulaire de création / édition.
 * `initial` : transaction existante (édition) ou valeurs par défaut (création).
 */
export default function TransactionForm({ initial, onDone }) {
  const { addTransaction, updateTransaction, deleteTransaction, budgets } = useData();
  const editing = Boolean(initial?.id);

  const [type, setType] = useState(initial?.type ?? 'expense');
  const [amount, setAmount] = useState(initial?.amount != null ? String(initial.amount).replace('.', ',') : '');
  const [category, setCategory] = useState(initial?.category ?? categoriesFor(initial?.type ?? 'expense')[0].id);
  const [date, setDate] = useState(initial?.date ?? toISODate());
  const [description, setDescription] = useState(initial?.description ?? '');
  const [budgetId, setBudgetId] = useState(initial?.budget_id ?? '');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const categories = categoriesFor(type);
  const parsed = Number(amount.replace(/\s/g, '').replace(',', '.'));
  const valid = parsed > 0 && category && date;

  const changeType = (t) => {
    setType(t);
    if (!categoriesFor(t).some((c) => c.id === category)) setCategory(categoriesFor(t)[0].id);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!valid) return;
    setSaving(true);
    const payload = {
      type,
      amount: Math.round(parsed * 100) / 100,
      category,
      date,
      description: description.trim(),
      budget_id: budgetId || null,
    };
    try {
      if (editing) await updateTransaction(initial.id, payload);
      else await addTransaction(payload);
      onDone();
    } catch {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!confirmDelete) return setConfirmDelete(true);
    setSaving(true);
    try {
      await deleteTransaction(initial.id);
      onDone();
    } catch {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Segmented
        value={type}
        onChange={changeType}
        options={[
          { value: 'expense', label: 'Sortie', activeClass: 'text-rose-600 dark:text-rose-400' },
          { value: 'income', label: 'Entrée', activeClass: 'text-emerald-600 dark:text-emerald-400' },
        ]}
      />

      <div className="relative">
        <input
          autoFocus={!editing}
          inputMode="decimal"
          placeholder="0,00"
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^\d.,\s]/g, ''))}
          aria-label="Montant"
          className={`${inputCls} py-4 pr-12 text-center text-3xl font-bold tabular-nums`}
        />
        <span className="pointer-events-none absolute top-1/2 right-5 -translate-y-1/2 text-2xl font-semibold text-slate-400">€</span>
      </div>

      <div>
        <span className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-300">Catégorie</span>
        <div className="grid grid-cols-3 gap-2">
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategory(c.id)}
              className={`flex flex-col items-center gap-1 rounded-2xl border px-2 py-2.5 text-xs font-medium transition active:scale-95 ${
                category === c.id
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300'
                  : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              <span className="text-xl">{c.icon}</span>
              <span className="truncate">{c.id}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Date">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} required />
        </Field>
        <Field label="Budget lié">
          <select value={budgetId} onChange={(e) => setBudgetId(e.target.value)} className={inputCls}>
            <option value="">Aucun</option>
            {budgets.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Description">
        <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex : Courses, Loyer…" className={inputCls} maxLength={80} />
      </Field>

      <div className="flex gap-3 pt-1">
        {editing && (
          <button
            type="button"
            onClick={remove}
            disabled={saving}
            className={`flex items-center justify-center gap-2 rounded-2xl px-4 py-3.5 font-semibold transition ${
              confirmDelete ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400'
            }`}
          >
            <TrashIcon className="h-5 w-5" />
            {confirmDelete ? 'Confirmer' : ''}
          </button>
        )}
        <button
          type="submit"
          disabled={!valid || saving}
          className="flex-1 rounded-2xl bg-indigo-600 py-3.5 font-semibold text-white shadow-lg shadow-indigo-600/25 transition hover:bg-indigo-500 active:scale-[0.98] disabled:opacity-40 disabled:shadow-none"
        >
          {saving ? 'Enregistrement…' : editing ? 'Enregistrer' : 'Ajouter'}
        </button>
      </div>
    </form>
  );
}
