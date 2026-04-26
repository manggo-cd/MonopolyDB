// Sidebar panels: players list and event log.

import { tokenGlyph, playerColor } from '/js/ui/tokens.js';
import { getSquare } from '/js/engine/board.js';

export function renderPlayers(panelEl, state, opts = {}) {
  panelEl.innerHTML = '';
  const h = document.createElement('h3');
  h.textContent = 'Players';
  panelEl.appendChild(h);

  state.players.forEach((p, i) => {
    const row = document.createElement('div');
    row.className = 'player-row';
    if (i === state.currentPlayerIdx && !p.bankrupt) row.classList.add('is-current');
    row.style.setProperty('--owner-color', playerColor(i));

    const tok = document.createElement('div');
    tok.className = 'pr-token';
    tok.textContent = tokenGlyph(p.token);

    const meta = document.createElement('div');
    const name = document.createElement('div');
    name.className = 'pr-name';
    name.textContent = p.name;
    const tags = document.createElement('div');
    tags.className = 'pr-tags';
    tags.append(makeTag(`${p.properties.length} props`, ''));
    if (p.inJail) tags.append(makeTag(`Jail (${p.jailTurns}/3)`, 'tag-jail'));
    if ((p.goojfCards?.length || 0) > 0) tags.append(makeTag(`GOOJF×${p.goojfCards.length}`, ''));
    if (p.bankrupt) tags.append(makeTag('Bankrupt', 'tag-bankrupt'));
    meta.append(name, tags);

    // Property chips
    if (p.properties.length > 0) {
      const chipRow = document.createElement('div');
      chipRow.className = 'pr-chips';
      for (const idx of p.properties) {
        const sq = getSquare(idx);
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'chip';
        chip.title = sq.name;
        chip.dataset.idx = String(idx);
        chip.style.background = chipColor(sq);
        chip.textContent = chipLabel(sq);
        const own = state.ownership[idx];
        if (own?.mortgaged) chip.classList.add('mortgaged');
        if ((own?.houses || 0) === 5) chip.classList.add('hotel');
        else if ((own?.houses || 0) > 0) {
          chip.classList.add('housed');
          chip.dataset.houses = String(own.houses);
        }
        if (opts.onPropertyClick) {
          chip.addEventListener('click', (e) => { e.stopPropagation(); opts.onPropertyClick(idx, p.id); });
        }
        chipRow.appendChild(chip);
      }
      meta.appendChild(chipRow);
    }

    const cash = document.createElement('div');
    cash.className = 'pr-cash';
    cash.textContent = `$${p.cash}`;

    row.append(tok, meta, cash);
    panelEl.appendChild(row);
  });
}

function chipColor(sq) {
  if (sq.color === 'railroad') return '#1d1d1f';
  if (sq.color === 'utility') return '#666';
  const map = {
    brown: '#955436', lightBlue: '#aae0fa', pink: '#d93a96', orange: '#f7941d',
    red: '#ed1b24', yellow: '#fef200', green: '#1fb25a', darkBlue: '#0072bb',
  };
  return map[sq.color] || '#999';
}

function chipLabel(sq) {
  if (sq.type === 'railroad') return 'RR';
  if (sq.type === 'utility') return sq.index === 12 ? '💡' : '🚰';
  // Use first letter of name for color properties.
  return sq.name[0];
}

function makeTag(text, cls) {
  const el = document.createElement('span');
  el.className = `tag ${cls}`.trim();
  el.textContent = text;
  return el;
}

export function renderLog(logEl, state) {
  // Use newest-first by reversing into the DOM order.
  // (CSS uses flex column-reverse so we still append in chronological order.)
  logEl.innerHTML = '';
  const recent = state.log.slice(-50);
  for (const entry of recent) {
    const li = document.createElement('li');
    li.textContent = entry.text;
    logEl.appendChild(li);
  }
}
