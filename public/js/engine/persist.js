// Thin wrapper around localStorage for game persistence.
// Designed so a future swap to a remote KV (Vercel KV / Supabase / Upstash)
// is a single-file change.

const CURRENT_KEY = 'monopoly:current';
const SAVED_KEY = 'monopoly:saved';
const SCHEMA_VERSION = 1;

function safeStorage() {
  try {
    if (typeof localStorage === 'undefined') return null;
    const probe = '__monopoly_probe__';
    localStorage.setItem(probe, '1');
    localStorage.removeItem(probe);
    return localStorage;
  } catch {
    return null;
  }
}

function envelope(state) {
  return JSON.stringify({ v: SCHEMA_VERSION, state });
}

function unwrap(raw) {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    if (parsed.v !== SCHEMA_VERSION) return null;
    return parsed.state || null;
  } catch {
    return null;
  }
}

export function saveCurrent(state) {
  const s = safeStorage();
  if (!s) return false;
  s.setItem(CURRENT_KEY, envelope(state));
  return true;
}

export function loadCurrent() {
  const s = safeStorage();
  if (!s) return null;
  return unwrap(s.getItem(CURRENT_KEY));
}

export function clearCurrent() {
  const s = safeStorage();
  if (!s) return false;
  s.removeItem(CURRENT_KEY);
  return true;
}

export function listSavedGames() {
  const s = safeStorage();
  if (!s) return [];
  const raw = s.getItem(SAVED_KEY);
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeSavedGames(list) {
  const s = safeStorage();
  if (!s) return false;
  s.setItem(SAVED_KEY, JSON.stringify(list));
  return true;
}

export function archiveCurrent(state, label) {
  if (!state) return false;
  const list = listSavedGames();
  list.unshift({
    id: state.id,
    label: label || `Game ${new Date(state.createdAt).toLocaleString()}`,
    savedAt: Date.now(),
    state,
  });
  return writeSavedGames(list.slice(0, 25));
}

export function deleteSavedGame(id) {
  const list = listSavedGames().filter((g) => g.id !== id);
  return writeSavedGames(list);
}

export function loadSavedGame(id) {
  const entry = listSavedGames().find((g) => g.id === id);
  return entry ? entry.state : null;
}
