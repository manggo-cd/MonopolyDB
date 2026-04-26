// End-of-game modal with winner banner and per-player stats.

import { BOARD } from '/js/engine/board.js';
import { tokenGlyph, playerColor } from '/js/ui/tokens.js';

let _shown = false;

export function showEndGameModal(rootEl, state, onClose) {
  if (_shown) return;
  _shown = true;
  const winner = state.players.find((p) => p.id === state.winnerId);

  const sorted = state.players
    .map((p, i) => ({ p, i, netWorth: computeNetWorth(state, p) }))
    .sort((a, b) => {
      if (a.p.id === state.winnerId) return -1;
      if (b.p.id === state.winnerId) return 1;
      return b.netWorth - a.netWorth;
    });

  rootEl.hidden = false;
  rootEl.innerHTML = '';
  const modal = document.createElement('div');
  modal.className = 'modal end-game';
  modal.style.maxWidth = '520px';

  modal.innerHTML = `
    <div style="text-align:center; padding-bottom: 8px;">
      <div style="font-size: 2.4rem;">🏆</div>
      <h2 style="margin: 8px 0 4px;">${winner ? `${escape(winner.name)} wins!` : 'Game over'}</h2>
      <p style="color: var(--muted); margin: 0;">${state.turnNumber} turns played</p>
    </div>
    <hr style="border:none; border-top:1px solid var(--border); margin: 14px 0;" />
    <h3 style="margin-top: 0; color: var(--muted); text-transform: uppercase; letter-spacing: 1px; font-size: 0.85rem;">Final standings</h3>
    <ol style="list-style:none; padding:0; margin: 0; display:grid; gap:8px;">
      ${sorted.map((s, rank) => standingRow(s, rank)).join('')}
    </ol>
    <div class="modal-actions" style="margin-top: 18px;">
      <button type="button" class="btn primary" id="end-close">Back to menu</button>
    </div>
  `;
  rootEl.appendChild(modal);
  modal.querySelector('#end-close').addEventListener('click', () => {
    rootEl.hidden = true;
    rootEl.innerHTML = '';
    _shown = false;
    if (onClose) onClose();
  });
}

function standingRow({ p, i, netWorth }, rank) {
  const color = playerColor(i);
  const medal = rank === 0 ? '🥇' : rank === 1 ? '🥈' : rank === 2 ? '🥉' : `#${rank + 1}`;
  return `
    <li style="display:grid; grid-template-columns: 32px 36px 1fr auto; gap:10px; align-items:center; padding:8px 10px; border:1px solid var(--border); border-radius:8px; ${p.bankrupt ? 'opacity:0.55;' : ''}">
      <div style="font-size:1.2rem;">${medal}</div>
      <div style="width:30px; height:30px; border-radius:50%; background:var(--bg); border:2px solid ${color}; display:grid; place-items:center; font-size:1.1rem;">
        ${tokenGlyph(p.token)}
      </div>
      <div>
        <div style="font-weight:600;">${escape(p.name)}${p.bankrupt ? ' <small style="color:var(--accent);">(bankrupt)</small>' : ''}</div>
        <div style="font-size:0.8rem; color: var(--muted);">${p.properties.length} properties · $${p.cash} cash</div>
      </div>
      <div style="font-variant-numeric: tabular-nums; font-weight:600;">$${netWorth}</div>
    </li>
  `;
}

function computeNetWorth(state, player) {
  let total = player.cash;
  for (const idx of player.properties) {
    const own = state.ownership[idx];
    if (!own) continue;
    const sq = BOARD[idx];
    if (!sq) continue;
    if (own.mortgaged) continue; // count mortgaged as $0 (rough liability)
    total += sq.price || 0;
    const houses = own.houses || 0;
    total += houses * (sq.houseCost || 0);
  }
  return total;
}

function escape(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
