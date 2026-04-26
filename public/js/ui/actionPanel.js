// Action panel: roll, buy/skip, end turn, jail bail / GOOJF, and (later) trade/build/mortgage.

import { getSquare } from '/js/engine/board.js';

export function renderActionPanel(panelEl, state, handlers) {
  panelEl.innerHTML = '';
  const h = document.createElement('h3');
  h.textContent = 'Actions';
  panelEl.appendChild(h);

  if (state.phase === 'ended') {
    const winner = state.players.find((p) => p.id === state.winnerId);
    const banner = document.createElement('div');
    banner.className = 'pending-prompt';
    banner.innerHTML = `<strong>Game over.</strong> ${winner ? `${escape(winner.name)} wins!` : ''}`;
    panelEl.appendChild(banner);

    const row = document.createElement('div');
    row.className = 'button-row';
    const home = btn('Back to menu', 'btn primary', handlers.onQuit);
    row.appendChild(home);
    panelEl.appendChild(row);
    return;
  }

  const cur = state.players[state.currentPlayerIdx];

  // Pending buy decision
  if (state.pendingAction?.type === 'awaiting_buy_decision') {
    const sq = getSquare(state.pendingAction.squareIndex);
    const prompt = document.createElement('div');
    prompt.className = 'pending-prompt';
    prompt.innerHTML = `Buy <strong>${escape(sq.name)}</strong> for <strong>$${sq.price}</strong>?`;
    panelEl.appendChild(prompt);

    const row = document.createElement('div');
    row.className = 'button-row';
    const buy = btn(`Buy ($${sq.price})`, 'btn success', handlers.onBuy);
    if (cur.cash < sq.price) buy.disabled = true;
    const skip = btn('Skip', 'btn', handlers.onDeclineBuy);
    row.append(buy, skip);
    panelEl.appendChild(row);
    return;
  }

  // Jail-time options before rolling
  if (state.phase === 'awaiting_roll' && cur.inJail) {
    const note = document.createElement('div');
    note.className = 'pending-prompt';
    note.innerHTML = `<strong>${escape(cur.name)}</strong> is in Jail (turn ${cur.jailTurns + 1}/3). Pay $50, use a card, or roll for doubles.`;
    panelEl.appendChild(note);

    const row = document.createElement('div');
    row.className = 'button-row';

    const pay = btn('Pay $50 bail', 'btn warn', handlers.onPayBail);
    if (cur.cash < 50) pay.disabled = true;

    const card = btn(`Use card${cur.goojfCards.length ? ` (×${cur.goojfCards.length})` : ''}`, 'btn', handlers.onUseJailCard);
    if (cur.goojfCards.length === 0) card.disabled = true;

    const roll = btn('Roll for doubles', 'btn primary', handlers.onRoll);

    row.append(pay, card, roll);
    panelEl.appendChild(row);

    const end = btn('End turn', 'btn ghost', handlers.onEndTurn);
    end.disabled = true;
    panelEl.appendChild(end);
    return;
  }

  // Standard turn buttons
  const row = document.createElement('div');
  row.className = 'button-row';

  const roll = btn('Roll dice', 'btn primary', handlers.onRoll);
  roll.disabled = state.phase !== 'awaiting_roll';

  const end = btn('End turn', 'btn', handlers.onEndTurn);
  end.disabled = state.phase !== 'resolved';

  const trade = btn('Trade', 'btn', handlers.onOpenTrade);
  // Trading is allowed any time during current player's turn (typically before/after roll, not mid-prompt).
  if (state.players.filter((p) => !p.bankrupt).length < 2 || state.pendingAction) trade.disabled = true;

  row.append(roll, end, trade);
  panelEl.appendChild(row);

  if (state.phase === 'resolved' && state.lastRoll?.doubles && !cur.inJail) {
    const note = document.createElement('div');
    note.className = 'pending-prompt';
    note.textContent = 'Doubles! End turn to roll again.';
    panelEl.appendChild(note);
  }

  if (state.settings.freeParkingJackpot && state.freeParkingPot > 0) {
    const note = document.createElement('div');
    note.className = 'pending-prompt';
    note.textContent = `Free Parking jackpot: $${state.freeParkingPot}`;
    panelEl.appendChild(note);
  }
}

function btn(label, cls, onClick) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = cls;
  b.textContent = label;
  if (onClick) b.addEventListener('click', onClick);
  return b;
}

function escape(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
