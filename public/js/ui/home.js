// Home / setup screen wiring.
// - Build player rows for the chosen count
// - Validate, then call engine.newGame()
// - Save to localStorage and redirect to /play.html

import { newGame } from '/js/engine/engine.js';
import { saveCurrent, loadCurrent, listSavedGames, deleteSavedGame, clearCurrent } from '/js/engine/persist.js';
import { TOKENS, tokenGlyph } from '/js/ui/tokens.js';

const DEFAULT_NAMES = ['Alex', 'Sam', 'Jordan', 'Riley', 'Casey', 'Morgan', 'Quinn', 'Drew'];

const $count = document.getElementById('player-count');
const $list = document.getElementById('player-list');
const $form = document.getElementById('setup-form');
const $cash = document.getElementById('starting-cash');
const $jackpot = document.getElementById('free-parking-jackpot');
const $savedCard = document.getElementById('saved-games-card');
const $savedList = document.getElementById('saved-games-list');

// Per-player picked tokens, keyed by player index.
const picked = new Array(8).fill(null);

function renderPlayerRows(n) {
  $list.innerHTML = '';
  for (let i = 0; i < n; i += 1) {
    if (!picked[i]) picked[i] = TOKENS[i].id;
    const li = document.createElement('li');
    li.dataset.idx = String(i);

    const num = document.createElement('span');
    num.className = 'player-num';
    num.textContent = `${i + 1}.`;

    const name = document.createElement('input');
    name.type = 'text';
    name.maxLength = 20;
    name.placeholder = `Player ${i + 1}`;
    name.value = DEFAULT_NAMES[i] || `Player ${i + 1}`;
    name.dataset.role = 'name';

    const picker = document.createElement('div');
    picker.className = 'token-picker';
    picker.dataset.role = 'picker';
    for (const tok of TOKENS) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.dataset.token = tok.id;
      btn.textContent = tok.glyph;
      btn.title = tok.label;
      btn.setAttribute('aria-pressed', String(picked[i] === tok.id));
      btn.addEventListener('click', () => {
        picked[i] = tok.id;
        // If another player picked this token, swap them onto the previous one.
        for (let j = 0; j < n; j += 1) {
          if (j !== i && picked[j] === tok.id) {
            picked[j] = nextFreeToken(j);
          }
        }
        renderPlayerRows(n);
      });
      picker.appendChild(btn);
    }
    // Disable tokens picked by other players (visual cue).
    for (const btn of picker.querySelectorAll('button')) {
      const t = btn.dataset.token;
      const usedBy = picked.findIndex((x, j) => j < n && j !== i && x === t);
      if (usedBy !== -1) btn.disabled = true;
    }

    li.append(num, name, picker);
    $list.appendChild(li);
  }
}

function nextFreeToken(forIdx) {
  for (const tok of TOKENS) {
    if (!picked.slice(0, currentN()).some((p, j) => j !== forIdx && p === tok.id)) return tok.id;
  }
  return TOKENS[0].id;
}

function currentN() {
  return parseInt($count.value, 10) || 2;
}

function readForm() {
  const n = currentN();
  const players = [];
  const items = $list.querySelectorAll('li');
  items.forEach((li, i) => {
    const name = li.querySelector('input[data-role="name"]').value.trim() || `Player ${i + 1}`;
    const token = picked[i] || TOKENS[i].id;
    players.push({ name, token });
  });
  return {
    players,
    startingCash: Math.max(500, parseInt($cash.value, 10) || 1500),
    freeParkingJackpot: $jackpot.checked,
  };
}

function handleSubmit(ev) {
  ev.preventDefault();
  const opts = readForm();
  // Ensure unique tokens (defensive: UI prevents this, but double-check).
  const seen = new Set();
  for (const p of opts.players) {
    if (seen.has(p.token)) p.token = TOKENS.find((t) => !seen.has(t.id)).id;
    seen.add(p.token);
  }
  const state = newGame(opts);
  saveCurrent(state);
  window.location.href = '/play.html';
}

function refreshSavedGames() {
  const list = listSavedGames();
  // Show the resume option if a current in-progress game exists.
  const current = loadCurrent();
  const all = [];
  if (current && !current.winnerId) {
    all.push({
      id: current.id,
      label: 'Continue current game',
      savedAt: current.updatedAt,
      state: current,
      isCurrent: true,
    });
  }
  for (const g of list) all.push(g);

  if (all.length === 0) {
    $savedCard.hidden = true;
    return;
  }
  $savedCard.hidden = false;
  $savedList.innerHTML = '';
  for (const g of all) {
    const li = document.createElement('li');
    const meta = document.createElement('div');
    const players = g.state.players.map((p) => `${tokenGlyph(p.token)} ${p.name}`).join(', ');
    meta.innerHTML = `<strong>${escapeHtml(g.label)}</strong><br /><small>${players}</small>`;
    const actions = document.createElement('div');
    const resume = document.createElement('button');
    resume.type = 'button';
    resume.textContent = g.isCurrent ? 'Resume' : 'Load';
    resume.addEventListener('click', () => {
      saveCurrent(g.state);
      window.location.href = '/play.html';
    });
    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'danger';
    del.textContent = g.isCurrent ? 'Discard' : 'Delete';
    del.addEventListener('click', () => {
      if (g.isCurrent) clearCurrent();
      else deleteSavedGame(g.id);
      refreshSavedGames();
    });
    actions.append(resume, del);
    li.append(meta, actions);
    $savedList.appendChild(li);
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

$count.addEventListener('change', () => renderPlayerRows(currentN()));
$form.addEventListener('submit', handleSubmit);

renderPlayerRows(currentN());
refreshSavedGames();
