/**
 * Couche d'accès aux données.
 * - Mode "supabase" : PostgreSQL + Realtime (si VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY sont définis).
 * - Mode "local"    : localStorage, synchronisé entre onglets, avec données de démonstration.
 * Les deux exposent la même interface : init, list, insert, update, remove, subscribe.
 */
import { supabase } from './supabase.js';
import { addDays, toISODate } from './format.js';

export const TABLES = ['transactions', 'budgets'];

const uid = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);

/* ----------------------------- Supabase ----------------------------- */

let initPromise = null;

const supabaseStore = {
  mode: 'supabase',

  // Mémorisé : évite deux connexions anonymes concurrentes (StrictMode monte les effets deux fois).
  init() {
    initPromise ??= (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        // Connexion anonyme : chaque appareil a son propre portefeuille, protégé par RLS.
        const { error } = await supabase.auth.signInAnonymously();
        if (error) throw error;
      }
    })().catch((e) => {
      initPromise = null; // autorise une nouvelle tentative
      throw e;
    });
    return initPromise;
  },

  async list(table) {
    const order = table === 'transactions' ? 'date' : 'created_at';
    const { data, error } = await supabase.from(table).select('*').order(order, { ascending: false });
    if (error) throw error;
    return data.map(normalize);
  },

  async insert(table, row) {
    const { data, error } = await supabase.from(table).insert(row).select().single();
    if (error) throw error;
    return normalize(data);
  },

  async update(table, id, patch) {
    const { data, error } = await supabase.from(table).update(patch).eq('id', id).select().single();
    if (error) throw error;
    return normalize(data);
  },

  async remove(table, id) {
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) throw error;
  },

  subscribe(onChange) {
    const channel = supabase.channel('wallet-changes');
    for (const table of TABLES) {
      channel.on('postgres_changes', { event: '*', schema: 'public', table }, () => onChange(table));
    }
    channel.subscribe();
    return () => supabase.removeChannel(channel);
  },
};

// Les colonnes numeric arrivent parfois en chaîne depuis PostgREST.
function normalize(row) {
  const r = { ...row };
  if (r.amount != null) r.amount = Number(r.amount);
  if (r.target != null) r.target = Number(r.target);
  return r;
}

/* ------------------------------ Local ------------------------------- */

const LS_PREFIX = 'wallet:';
const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('wallet') : null;

function read(table) {
  try {
    return JSON.parse(localStorage.getItem(LS_PREFIX + table)) ?? [];
  } catch {
    return [];
  }
}

function write(table, rows) {
  localStorage.setItem(LS_PREFIX + table, JSON.stringify(rows));
  channel?.postMessage(table);
}

const localStore = {
  mode: 'local',

  async init() {
    if (localStorage.getItem(LS_PREFIX + 'seeded')) return;
    const { transactions, budgets } = demoData();
    write('budgets', budgets);
    write('transactions', transactions);
    localStorage.setItem(LS_PREFIX + 'seeded', '1');
  },

  async list(table) {
    return read(table);
  },

  async insert(table, row) {
    const created = { id: uid(), created_at: new Date().toISOString(), ...row };
    write(table, [created, ...read(table)]);
    return created;
  },

  async update(table, id, patch) {
    let updated;
    write(
      table,
      read(table).map((r) => (r.id === id ? (updated = { ...r, ...patch }) : r)),
    );
    return updated;
  },

  async remove(table, id) {
    write(table, read(table).filter((r) => r.id !== id));
  },

  subscribe(onChange) {
    if (!channel) return () => {};
    const handler = (e) => onChange(e.data);
    channel.addEventListener('message', handler);
    return () => channel.removeEventListener('message', handler);
  },
};

export const store = supabase ? supabaseStore : localStore;

/* ------------------------- Données de démo -------------------------- */

function demoData() {
  const now = new Date();
  const vacId = uid();
  const safetyId = uid();
  const budgets = [
    { id: vacId, name: 'Projet Vacances', kind: 'goal', target: 1500, category: null, color: '#0ea5e9', created_at: now.toISOString() },
    { id: safetyId, name: 'Épargne de précaution', kind: 'goal', target: 5000, category: null, color: '#10b981', created_at: now.toISOString() },
    { id: uid(), name: 'Courses du mois', kind: 'envelope', target: 400, category: 'Alimentation', color: '#f97316', created_at: now.toISOString() },
    { id: uid(), name: 'Sorties', kind: 'envelope', target: 150, category: 'Loisirs', color: '#ec4899', created_at: now.toISOString() },
  ];

  const tx = [];
  const add = (daysAgo, type, amount, category, description, budget_id = null) => {
    const d = addDays(now, -daysAgo);
    tx.push({ id: uid(), type, amount, category, date: toISODate(d), description, budget_id, created_at: d.toISOString() });
  };

  // Deux mois glissants de données réalistes
  for (let m = 0; m < 2; m++) {
    const base = m * 30;
    add(base + 2, 'income', 2450, 'Salaire', 'Salaire mensuel');
    add(base + 3, 'expense', 780, 'Logement', 'Loyer');
    add(base + 5, 'expense', 62.4, 'Factures', 'Électricité');
    add(base + 6, 'expense', 19.99, 'Factures', 'Forfait mobile');
    add(base + 8, 'expense', 75, 'Transports', 'Pass Navigo');
    add(base + 4, 'expense', 200, 'Épargne', 'Virement épargne', safetyId);
    add(base + 10, 'expense', 120, 'Épargne', 'Mise de côté vacances', vacId);
  }
  add(14, 'income', 380, 'Freelance', 'Mission logo');
  add(40, 'income', 520, 'Freelance', 'Site vitrine');
  add(22, 'income', 45, 'Remboursement', 'Mutuelle');

  const groceries = ['Supermarché', 'Marché', 'Boulangerie', 'Épicerie bio'];
  const fun = ['Cinéma', 'Restaurant', 'Concert', 'Bar entre amis', 'Streaming'];
  for (let d = 0; d < 60; d++) {
    if (d % 3 === 0) add(d, 'expense', round(18 + ((d * 37) % 55)), 'Alimentation', groceries[d % groceries.length]);
    if (d % 7 === 1) add(d, 'expense', round(12 + ((d * 13) % 40)), 'Loisirs', fun[d % fun.length]);
    if (d % 11 === 4) add(d, 'expense', round(25 + ((d * 17) % 70)), 'Shopping', 'Vêtements');
    if (d % 13 === 6) add(d, 'expense', round(8 + ((d * 7) % 30)), 'Santé', 'Pharmacie');
    if (d % 9 === 2) add(d, 'expense', round(4 + ((d * 3) % 15)), 'Transports', 'Ticket / VTC');
  }

  tx.sort((a, b) => b.date.localeCompare(a.date));
  return { transactions: tx, budgets };
}

const round = (n) => Math.round(n * 100) / 100;
