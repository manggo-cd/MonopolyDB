// Renders the 11x11 grid Monopoly board into a target element.
//
// The 40 squares wrap clockwise (in board-index order) starting at GO,
// which is at the bottom-right corner. The CSS grid is 11 columns by 11
// rows; corners take up the four corner cells, and the 36 edge tiles fill
// the remaining outer ring. The 9x9 center is one big slot used as the
// dice / table area.

import { BOARD } from '/js/engine/board.js';
import { tokenGlyph, playerColor } from '/js/ui/tokens.js';

// Map a board index 0..39 to grid (row, col, edge).
// Returns { row, col, edge: 'corner-br' | 'corner-bl' | 'corner-tl' | 'corner-tr'
//                       | 'bottom' | 'left' | 'top' | 'right' }
export function indexToGrid(index) {
  if (index === 0) return { row: 11, col: 11, edge: 'corner-br' };
  if (index >= 1 && index <= 9) return { row: 11, col: 11 - index, edge: 'bottom' };
  if (index === 10) return { row: 11, col: 1, edge: 'corner-bl' };
  if (index >= 11 && index <= 19) return { row: 11 - (index - 10), col: 1, edge: 'left' };
  if (index === 20) return { row: 1, col: 1, edge: 'corner-tl' };
  if (index >= 21 && index <= 29) return { row: 1, col: 1 + (index - 20), edge: 'top' };
  if (index === 30) return { row: 1, col: 11, edge: 'corner-tr' };
  if (index >= 31 && index <= 39) return { row: 1 + (index - 30), col: 11, edge: 'right' };
  return null;
}

const TYPE_ICONS = {
  chance: '?',
  community_chest: '📦',
  tax: '💰',
  railroad: '🚂',
  utility: { 12: '💡', 28: '🚰' },
  go: '⬅︎ GO',
  go_to_jail: '🚓',
  free_parking: '🅿️',
  jail: '⛓️',
};

function tileTypeIcon(sq) {
  if (sq.type === 'utility') return TYPE_ICONS.utility[sq.index] || '💡';
  if (typeof TYPE_ICONS[sq.type] === 'string') return TYPE_ICONS[sq.type];
  return '';
}

function buildTileEl(sq) {
  const grid = indexToGrid(sq.index);
  const el = document.createElement('div');
  el.className = `tile edge-${grid.edge.replace('corner-', '')}`;
  el.dataset.index = String(sq.index);
  el.style.gridRow = String(grid.row);
  el.style.gridColumn = String(grid.col);

  if (grid.edge.startsWith('corner')) {
    el.classList.add('corner');
    const icon = document.createElement('div');
    icon.className = 'corner-icon';
    icon.textContent = cornerIcon(sq);
    const label = document.createElement('div');
    label.className = 'corner-label';
    label.textContent = sq.name;
    el.append(icon, label);
    return el;
  }

  if (sq.type === 'property') el.classList.add(`color-${sq.color}`);

  // Color band only on properties.
  if (sq.type === 'property') {
    const band = document.createElement('div');
    band.className = 'color-band';
    el.appendChild(band);
  }

  const body = document.createElement('div');
  body.className = 'tile-body';

  if (sq.type === 'chance' || sq.type === 'community_chest' || sq.type === 'tax' || sq.type === 'railroad' || sq.type === 'utility') {
    const icon = document.createElement('div');
    icon.className = 'tile-icon';
    icon.textContent = tileTypeIcon(sq);
    body.appendChild(icon);
  }

  const name = document.createElement('div');
  name.className = 'tile-name';
  name.textContent = displayName(sq);
  body.appendChild(name);

  if (sq.type === 'property' || sq.type === 'railroad' || sq.type === 'utility') {
    const price = document.createElement('div');
    price.className = 'tile-price';
    price.textContent = `$${sq.price}`;
    body.appendChild(price);
  } else if (sq.type === 'tax') {
    const price = document.createElement('div');
    price.className = 'tile-price';
    price.textContent = `Pay $${sq.amount}`;
    body.appendChild(price);
  }

  el.appendChild(body);
  return el;
}

function cornerIcon(sq) {
  switch (sq.type) {
    case 'go': return '⬅︎';
    case 'jail': return '⛓️';
    case 'free_parking': return '🅿️';
    case 'go_to_jail': return '🚓';
    default: return '';
  }
}

function displayName(sq) {
  // Trim well-known long names so the tile fits.
  return sq.name
    .replace('Railroad', 'RR')
    .replace('Avenue', 'Ave.')
    .replace('Place', 'Pl.')
    .replace('Gardens', 'Gdns');
}

let _built = false;

// Renders (or re-renders) the board into `boardEl`.
// Idempotent: tile DOM is built once on first call; subsequent calls only
// update overlay state (current-tile highlight, ownership chips, tokens).
export function renderBoard(boardEl, state, opts = {}) {
  if (!_built) {
    boardEl.innerHTML = '';
    for (const sq of BOARD) {
      const tile = buildTileEl(sq);
      if (['property', 'railroad', 'utility'].includes(sq.type)) {
        tile.style.cursor = 'pointer';
        tile.addEventListener('click', () => {
          if (opts.onTileClick) opts.onTileClick(sq.index);
        });
      }
      boardEl.appendChild(tile);
    }
    // Center area
    const center = document.createElement('div');
    center.className = 'center-area';
    center.id = 'center-area';
    center.innerHTML = `
      <div>
        <div class="center-title">Monopoly</div>
        <div class="center-sub" id="center-sub">Roll the dice to begin.</div>
        <div class="dice" id="center-dice">- -</div>
      </div>`;
    boardEl.appendChild(center);
    _built = true;
  }

  // Update center-area dice
  const dice = boardEl.querySelector('#center-dice');
  const sub = boardEl.querySelector('#center-sub');
  const newDice = state.lastRoll ? `${diceFace(state.lastRoll.d1)} ${diceFace(state.lastRoll.d2)}` : '· ·';
  if (state.lastRoll && dice.textContent !== newDice) {
    dice.classList.remove('rolling');
    void dice.offsetWidth; // reflow → restart animation
    dice.classList.add('rolling');
  }
  dice.textContent = newDice;
  sub.textContent = state.lastRoll
    ? (state.lastRoll.doubles ? 'Doubles!' : `Rolled ${state.lastRoll.total}`)
    : 'Roll the dice to begin.';

  // Tile state
  const cur = state.players[state.currentPlayerIdx];
  for (const tile of boardEl.querySelectorAll('.tile')) {
    const idx = Number(tile.dataset.index);
    const wasCurrent = tile.classList.contains('tile-current');
    const isCurrent = cur && cur.position === idx;
    if (isCurrent && !wasCurrent) {
      tile.classList.remove('tile-just-landed');
      void tile.offsetWidth;
      tile.classList.add('tile-just-landed');
      setTimeout(() => tile.classList.remove('tile-just-landed'), 800);
    }
    tile.classList.toggle('tile-current', isCurrent);
    const own = state.ownership[idx];
    tile.classList.toggle('tile-owned', !!own);
    tile.classList.toggle('tile-mortgaged', !!own?.mortgaged);
    if (own) {
      const ownerIdx = state.players.findIndex((p) => p.id === own.ownerId);
      tile.style.setProperty('--owner-color', playerColor(ownerIdx));
    } else {
      tile.style.removeProperty('--owner-color');
    }
    // Clear and rebuild token stack
    let stack = tile.querySelector('.token-stack');
    if (stack) stack.remove();
    // Clear and rebuild house indicators
    let houses = tile.querySelector('.house-row');
    if (houses) houses.remove();
    const houseCount = own?.houses || 0;
    if (houseCount > 0) {
      houses = document.createElement('div');
      houses.className = 'house-row';
      if (houseCount === 5) {
        houses.innerHTML = '<span class="hotel-pip" title="Hotel">🏨</span>';
      } else {
        houses.innerHTML = '🏠'.repeat(houseCount);
      }
      tile.appendChild(houses);
    }
  }

  // Place tokens
  for (let i = 0; i < state.players.length; i += 1) {
    const p = state.players[i];
    if (p.bankrupt) continue;
    const tile = boardEl.querySelector(`.tile[data-index="${p.position}"]`);
    if (!tile) continue;
    let stack = tile.querySelector('.token-stack');
    if (!stack) {
      stack = document.createElement('div');
      stack.className = 'token-stack';
      tile.appendChild(stack);
    }
    const pip = document.createElement('div');
    pip.className = 'token-pip';
    pip.style.setProperty('--owner-color', playerColor(i));
    pip.title = p.name;
    pip.textContent = tokenGlyph(p.token);
    stack.appendChild(pip);
  }
}

const FACES = ['·', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
function diceFace(n) { return FACES[n] || '?'; }
