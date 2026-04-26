// Chance / Community Chest card draw modal.
// Shows the most recently drawn card, dismissed by clicking OK.

let _shownCardKey = null;

export function showCardIfNew(rootEl, state, onDismiss) {
  const lc = state.lastCard;
  const key = lc ? `${state.id}-${state.turnNumber}-${lc.id}-${state.players[state.currentPlayerIdx]?.id}-${lc.text}` : null;
  if (!lc || _shownCardKey === key) return;
  _shownCardKey = key;

  rootEl.hidden = false;
  rootEl.innerHTML = '';
  const modal = document.createElement('div');
  modal.className = 'modal';
  const title = lc.deckId === 'chance' ? 'Chance' : 'Community Chest';
  const accent = lc.deckId === 'chance' ? '#f0b323' : '#0072bb';
  modal.style.borderTop = `6px solid ${accent}`;
  modal.innerHTML = `
    <h2 style="color: ${accent};">${title}</h2>
    <p style="font-size: 1.05rem; color: var(--fg);">${escape(lc.text)}</p>
    <div class="modal-actions">
      <button type="button" class="btn primary" id="card-ok">OK</button>
    </div>
  `;
  rootEl.appendChild(modal);
  modal.querySelector('#card-ok').addEventListener('click', () => {
    rootEl.hidden = true;
    rootEl.innerHTML = '';
    if (onDismiss) onDismiss();
  });
}

export function resetCardModal() {
  _shownCardKey = null;
}

function escape(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
