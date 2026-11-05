import { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useData } from '../context/DataContext.jsx';
import { BUDGET_COLORS, EXPENSE_CATEGORIES } from '../lib/categories.js';
import { formatMoney } from '../lib/format.js';
import { budgetProgress } from '../lib/stats.js';
import { Card, Field, ProgressBar, SectionTitle, Segmented, Skeleton, inputCls } from '../components/ui.jsx';
import Sheet from '../components/Sheet.jsx';
import { PencilIcon, PlusIcon, TrashIcon } from '../components/Icons.jsx';

export default function Budgets() {
  const { budgets, transactions, status } = useData();
  const { openTx } = useOutletContext();
  const [form, setForm] = useState(null); // null | {} | budget

  const items = useMemo(
    () => budgets.map((b) => ({ ...b, ...budgetProgress(b, transactions) })),
    [budgets, transactions],
  );
  const goals = items.filter((b) => b.kind === 'goal');
  const envelopes = items.filter((b) => b.kind === 'envelope');

  if (status === 'loading') return <Skeleton className="h-96 rounded-3xl" />;

  return (
    <div className="space-y-6">
      <button
        onClick={() => setForm({})}
        className="flex w-full items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-slate-300 py-4 font-semibold text-slate-500 transition hover:border-indigo-500 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-400"
      >
        <PlusIcon className="h-5 w-5" /> Nouveau budget
      </button>

      <section>
        <SectionTitle>Objectifs d'épargne</SectionTitle>
        {goals.length === 0 ? (
          <Empty text="Créez un objectif (ex : Projet Vacances) et alimentez-le depuis vos transactions." />
        ) : (
          <div className="space-y-3">
            {goals.map((b) => (
              <BudgetCard
                key={b.id}
                b={b}
                onEdit={() => setForm(b)}
                action={{
                  label: 'Alimenter',
                  onClick: () => openTx({ type: 'expense', category: 'Épargne', budget_id: b.id, description: b.name }),
                }}
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionTitle>Enveloppes mensuelles</SectionTitle>
        {envelopes.length === 0 ? (
          <Empty text="Fixez un plafond mensuel par catégorie (ex : 400 € d'Alimentation)." />
        ) : (
          <div className="space-y-3">
            {envelopes.map((b) => (
              <BudgetCard
                key={b.id}
                b={b}
                onEdit={() => setForm(b)}
                action={{
                  label: 'Dépense',
                  onClick: () => openTx({ type: 'expense', category: b.category ?? 'Autre', budget_id: b.id }),
                }}
              />
            ))}
          </div>
        )}
      </section>

      <Sheet open={form !== null} onClose={() => setForm(null)} title={form?.id ? 'Modifier le budget' : 'Nouveau budget'}>
        {form !== null && <BudgetForm key={form.id ?? 'new'} initial={form} onDone={() => setForm(null)} />}
      </Sheet>
    </div>
  );
}

function BudgetCard({ b, onEdit, action }) {
  const goal = b.kind === 'goal';
  const over = !goal && b.percent > 100;
  const remaining = b.target - b.amount;

  return (
    <Card>
      <div className="flex items-start gap-3">
        <span className="mt-1 h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: b.color }} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate font-semibold">{b.name}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">{goal ? 'Objectif' : `Enveloppe · ${b.category ?? 'Toutes'} · ce mois`}</p>
            </div>
            <button onClick={onEdit} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label={`Modifier ${b.name}`}>
              <PencilIcon className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-3 flex items-baseline justify-between">
            <p className="font-bold tabular-nums">
              {formatMoney(b.amount)} <span className="text-sm font-normal text-slate-400">/ {formatMoney(b.target)}</span>
            </p>
            <p className={`text-sm font-semibold tabular-nums ${over ? 'text-rose-600 dark:text-rose-400' : ''}`}>{Math.round(b.percent)} %</p>
          </div>
          <div className="mt-2">
            <ProgressBar value={b.percent} color={b.color} over={over} />
          </div>

          <div className="mt-3 flex items-center justify-between">
            <p className={`text-xs ${over ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'}`}>
              {goal
                ? remaining > 0
                  ? `Encore ${formatMoney(remaining)} à épargner`
                  : '🎉 Objectif atteint !'
                : over
                  ? `Dépassement de ${formatMoney(-remaining)}`
                  : `Reste ${formatMoney(remaining)}`}
            </p>
            <button
              onClick={action.onClick}
              className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold transition active:scale-95 dark:bg-slate-800"
            >
              + {action.label}
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}

function BudgetForm({ initial, onDone }) {
  const { addBudget, updateBudget, deleteBudget } = useData();
  const editing = Boolean(initial.id);
  const [kind, setKind] = useState(initial.kind ?? 'goal');
  const [name, setName] = useState(initial.name ?? '');
  const [target, setTarget] = useState(initial.target != null ? String(initial.target).replace('.', ',') : '');
  const [category, setCategory] = useState(initial.category ?? EXPENSE_CATEGORIES[0].id);
  const [color, setColor] = useState(initial.color ?? BUDGET_COLORS[0]);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const parsed = Number(target.replace(/\s/g, '').replace(',', '.'));
  const valid = name.trim() && parsed > 0;

  const submit = async (e) => {
    e.preventDefault();
    if (!valid) return;
    setSaving(true);
    const payload = { kind, name: name.trim(), target: Math.round(parsed * 100) / 100, category: kind === 'envelope' ? category : null, color };
    try {
      if (editing) await updateBudget(initial.id, payload);
      else await addBudget(payload);
      onDone();
    } catch {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!confirmDelete) return setConfirmDelete(true);
    setSaving(true);
    try {
      await deleteBudget(initial.id);
      onDone();
    } catch {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Segmented
        value={kind}
        onChange={setKind}
        options={[
          { value: 'goal', label: 'Objectif' },
          { value: 'envelope', label: 'Enveloppe' },
        ]}
      />
      <p className="text-xs text-slate-500 dark:text-slate-400">
        {kind === 'goal'
          ? 'Un montant à atteindre. Il progresse avec les transactions liées à ce budget.'
          : 'Un plafond mensuel. Il se consomme avec les dépenses de la catégorie choisie.'}
      </p>
      <Field label="Nom">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder={kind === 'goal' ? 'Projet Vacances' : 'Courses du mois'} className={inputCls} maxLength={40} autoFocus={!editing} />
      </Field>
      <Field label={kind === 'goal' ? 'Montant cible (€)' : 'Plafond mensuel (€)'}>
        <input inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value.replace(/[^\d.,\s]/g, ''))} placeholder="0,00" className={inputCls} />
      </Field>
      {kind === 'envelope' && (
        <Field label="Catégorie suivie">
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls}>
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon} {c.id}
              </option>
            ))}
          </select>
        </Field>
      )}
      <div>
        <span className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-300">Couleur</span>
        <div className="flex gap-2">
          {BUDGET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`h-9 w-9 rounded-full transition ${color === c ? 'ring-4 ring-offset-2 ring-offset-white dark:ring-offset-slate-900' : ''}`}
              style={{ backgroundColor: c, '--tw-ring-color': `${c}66` }}
              aria-label={`Couleur ${c}`}
            />
          ))}
        </div>
      </div>
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
          {saving ? 'Enregistrement…' : editing ? 'Enregistrer' : 'Créer'}
        </button>
      </div>
    </form>
  );
}

function Empty({ text }) {
  return <Card className="py-8 text-center text-sm text-slate-500">{text}</Card>;
}
