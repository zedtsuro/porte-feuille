-- Schéma Supabase pour Porte-feuille
-- À exécuter dans Supabase > SQL Editor.
-- Prérequis : Authentication > Providers > activer « Anonymous sign-ins ».

create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  kind text not null check (kind in ('goal', 'envelope')),   -- goal = objectif d'épargne, envelope = plafond mensuel
  target numeric(12, 2) not null check (target > 0),
  category text,                                               -- catégorie suivie (enveloppes)
  color text not null default '#6366f1',
  created_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  type text not null check (type in ('income', 'expense')),
  amount numeric(12, 2) not null check (amount > 0),
  category text not null,
  date date not null default current_date,
  description text not null default '',
  budget_id uuid references public.budgets (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists transactions_user_date_idx on public.transactions (user_id, date desc);

-- Row Level Security : chaque utilisateur ne voit que ses données
alter table public.budgets enable row level security;
alter table public.transactions enable row level security;

drop policy if exists "own budgets" on public.budgets;
create policy "own budgets" on public.budgets
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "own transactions" on public.transactions;
create policy "own transactions" on public.transactions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Temps réel
alter publication supabase_realtime add table public.transactions;
alter publication supabase_realtime add table public.budgets;
