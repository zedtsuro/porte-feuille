# 👛 Porte-feuille

Portefeuille virtuel et gestion multi-budgets : React + Vite, React Router, Tailwind CSS v4, Recharts, Supabase.

## Démarrer

```bash
npm install
npm run dev
```

`npm run dev:demo` force le mode démo même si Supabase est configuré. `npm run deploy` publie sur GitHub Pages (à lancer depuis PowerShell ou cmd).

Sans configuration, l'app tourne en **mode démo locale** : les données sont dans le `localStorage`, pré-remplies avec deux mois d'exemples, et synchronisées en direct entre les onglets.

## Brancher Supabase (temps réel)

1. Créer un projet sur [supabase.com](https://supabase.com).
2. *Authentication → Providers* : activer **Anonymous sign-ins**.
3. *SQL Editor* : exécuter [`supabase/schema.sql`](supabase/schema.sql) (tables, RLS, publication Realtime).
4. Copier `.env.example` en `.env.local` et renseigner `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`.
5. Relancer `npm run dev` : le badge « démo locale » disparaît.

## Fonctionnalités

- **Tableau de bord** : solde, revenus/dépenses du mois avec évolution vs mois précédent, courbe entrées/sorties sur 30 jours, camembert des dépenses par catégorie, dernières opérations.
- **Transactions** : ajout rapide (bouton + toujours accessible au pouce), édition/suppression, historique groupé par jour avec défilement infini, filtres période / type / catégorie / recherche (conservés dans l'URL).
- **Budgets** :
  - *Objectifs* (ex. Projet Vacances) : progressent avec les transactions qui leur sont liées (« Alimenter »).
  - *Enveloppes* (ex. Courses 400 €/mois) : se consomment avec les dépenses du mois de la catégorie suivie ; passent en rouge en cas de dépassement.
- Responsive : nav basse + bouton « + » au pouce sur smartphone ; barre latérale, grilles multi-colonnes et raccourci clavier `N` sur PC.
- Mode sombre (préférence système par défaut, bascule mémorisée), transitions de route et animations des graphiques.

## Structure

```
src/
  lib/store.js          couche données (Supabase ou localStorage, même interface)
  lib/stats.js          calculs : solde, KPIs, séries, progression des budgets
  context/              DataContext (CRUD + temps réel), ThemeContext
  components/           Layout (nav basse + FAB), Sheet, TransactionForm, ui
  pages/                Dashboard, Transactions, Budgets
supabase/schema.sql     schéma PostgreSQL + RLS + Realtime
```
