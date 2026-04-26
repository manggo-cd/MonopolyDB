// Trade modal — hot-seat trading. Two-step flow:
//   1. Setup: current player builds the offer (cash + properties + GOOJF).
//   2. Confirmation: counterparty (same screen) accepts or declines.

import { getSquare } from '/js/engine/board.js';
import { executeTrade } from '/js/engine/engine.js';
import { tokenGlyph } from '/js/ui/tokens.js';

export function showTradeModal(rootEl, state, { onApply }) {
  const cur = state.players[state.currentPlayerIdx];
  const others = state.players.filter((p) => !p.bankrupt && p.id !== cur.id);
  if (others.length === 0) return;

  // Mutable offer scratch state
  let partnerId = others[0].id;
  let fromOffer = { cash: 0, properties: [], goojf: 0 };
  let toOffer = { cash: 0, properties: [], goojf: 0 };
  let phase = 'setup';
  let lastError = null;

  function close() {
    rootEl.hidden = true;
    rootEl.innerHTML = '';
  }

  function refresh() {
    const partner = state.players.find((p) => p.id === partnerId);
    rootEl.hidden = false;
    rootEl.innerHTML = '';
    const modal = document.createElement('div');
    modal.className = 'modal trade-modal';
    modal.style.maxWidth = '720px';
    modal.style.width = '100%';

    if (phase === 'setup') {
      modal.appendChild(renderSetup(cur, partner));
    } else {
      modal.appendChild(renderConfirm(cur, partner));
    }

    rootEl.appendChild(modal);
  }

  function renderSetup(cur, partner) {
    const wrap = document.createElement('div');
    const h = document.createElement('h2');
    h.textContent = 'Propose trade';
    wrap.appendChild(h);

    // Counterparty selector
    const partnerRow = document.createElement('div');
    partnerRow.style.cssText = 'display:flex; align-items:center; gap:10px; margin-bottom: 14px;';
    const lbl = document.createElement('label');
    lbl.textContent = 'Trade with:';
    const sel = document.createElement('select');
    for (const o of others) {
      const opt = document.createElement('option');
      opt.value = o.id;
      opt.textContent = `${tokenGlyph(o.token)} ${o.name}`;
      if (o.id === partnerId) opt.selected = true;
      sel.appendChild(opt);
    }
    sel.addEventListener('change', () => {
      partnerId = sel.value;
      toOffer = { cash: 0, properties: [], goojf: 0 };
      refresh();
    });
    partnerRow.append(lbl, sel);
    wrap.appendChild(partnerRow);

    // Two-column offer panels
    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid; grid-template-columns: 1fr 1fr; gap: 16px;';
    grid.appendChild(offerColumn(cur, fromOffer, (o) => { fromOffer = o; refresh(); }));
    grid.appendChild(offerColumn(partner, toOffer, (o) => { toOffer = o; refresh(); }));
    wrap.appendChild(grid);

    if (lastError) {
      const err = document.createElement('div');
      err.className = 'pending-prompt';
      err.style.background = 'rgba(200,21,45,0.08)';
      err.style.borderColor = 'rgba(200,21,45,0.4)';
      err.style.color = 'var(--accent)';
      err.style.marginTop = '12px';
      err.textContent = lastError;
      wrap.appendChild(err);
    }

    const actions = document.createElement('div');
    actions.className = 'modal-actions';
    actions.append(
      btn('Cancel', 'btn', close),
      btn('Propose →', 'btn primary', () => {
        if (fromOffer.cash === 0 && fromOffer.properties.length === 0 && fromOffer.goojf === 0
          && toOffer.cash === 0 && toOffer.properties.length === 0 && toOffer.goojf === 0) {
          lastError = 'Both sides cannot be empty.';
          refresh();
          return;
        }
        phase = 'confirm';
        lastError = null;
        refresh();
      }),
    );
    wrap.appendChild(actions);
    return wrap;
  }

  function renderConfirm(cur, partner) {
    const wrap = document.createElement('div');
    const h = document.createElement('h2');
    h.textContent = `Trade offer for ${partner.name}`;
    wrap.appendChild(h);

    const offerView = document.createElement('div');
    offerView.style.cssText = 'display:grid; grid-template-columns: 1fr 1fr; gap:16px; margin-bottom:14px;';
    offerView.appendChild(offerSummary(`${cur.name} gives`, fromOffer));
    offerView.appendChild(offerSummary(`${partner.name} gives`, toOffer));
    wrap.appendChild(offerView);

    const note = document.createElement('p');
    note.textContent = `Pass the device to ${partner.name} to accept or decline.`;
    note.style.color = 'var(--muted)';
    wrap.appendChild(note);

    if (lastError) {
      const err = document.createElement('div');
      err.className = 'pending-prompt';
      err.style.background = 'rgba(200,21,45,0.08)';
      err.style.borderColor = 'rgba(200,21,45,0.4)';
      err.style.color = 'var(--accent)';
      err.textContent = lastError;
      wrap.appendChild(err);
    }

    const actions = document.createElement('div');
    actions.className = 'modal-actions';
    actions.append(
      btn('Back', 'btn', () => { phase = 'setup'; refresh(); }),
      btn('Decline', 'btn warn', close),
      btn('Accept', 'btn success', () => {
        const result = executeTrade(state, { fromId: cur.id, toId: partner.id, fromOffer, toOffer });
        if (result.error) {
          lastError = result.error;
          refresh();
          return;
        }
        onApply(result.state);
        close();
      }),
    );
    wrap.appendChild(actions);
    return wrap;
  }

  function offerColumn(player, offer, set) {
    const col = document.createElement('div');
    col.style.cssText = 'border: 1px solid var(--border); border-radius: 10px; padding: 12px;';
    const title = document.createElement('h3');
    title.style.margin = '0 0 8px';
    title.textContent = `${tokenGlyph(player.token)} ${player.name} gives`;
    col.appendChild(title);

    // Cash slider
    const cashRow = document.createElement('label');
    cashRow.style.cssText = 'display:flex; align-items:center; gap:8px; margin-bottom:8px;';
    cashRow.innerHTML = `<span>Cash</span>`;
    const cashInput = document.createElement('input');
    cashInput.type = 'number';
    cashInput.min = '0';
    cashInput.max = String(player.cash);
    cashInput.step = '10';
    cashInput.value = String(offer.cash);
    cashInput.style.cssText = 'flex:1; padding:6px 8px; border-radius:6px; border:1px solid var(--border); background:var(--bg); color:var(--fg);';
    cashInput.addEventListener('change', () => {
      const v = Math.max(0, Math.min(player.cash, parseInt(cashInput.value, 10) || 0));
      set({ ...offer, cash: v });
    });
    cashRow.appendChild(cashInput);
    col.appendChild(cashRow);

    const cashHint = document.createElement('div');
    cashHint.style.cssText = 'font-size:0.8rem; color: var(--muted); margin-bottom:10px;';
    cashHint.textContent = `(of $${player.cash})`;
    col.appendChild(cashHint);

    // GOOJF
    if (player.goojfCards.length > 0) {
      const goojf = document.createElement('label');
      goojf.style.cssText = 'display:flex; align-items:center; gap:8px; margin-bottom:8px;';
      goojf.innerHTML = `<span>GOOJF cards</span>`;
      const sel = document.createElement('select');
      for (let i = 0; i <= player.goojfCards.length; i += 1) {
        const opt = document.createElement('option');
        opt.value = String(i);
        opt.textContent = String(i);
        if (i === offer.goojf) opt.selected = true;
        sel.appendChild(opt);
      }
      sel.addEventListener('change', () => set({ ...offer, goojf: parseInt(sel.value, 10) || 0 }));
      goojf.appendChild(sel);
      col.appendChild(goojf);
    }

    // Properties
    const props = document.createElement('div');
    props.style.cssText = 'max-height: 220px; overflow:auto; margin-top:8px;';
    if (player.properties.length === 0) {
      const empty = document.createElement('div');
      empty.style.color = 'var(--muted)';
      empty.style.fontSize = '0.85rem';
      empty.textContent = 'No properties to trade.';
      props.appendChild(empty);
    }
    for (const idx of player.properties) {
      const sq = getSquare(idx);
      const lbl = document.createElement('label');
      lbl.style.cssText = 'display:flex; gap:8px; align-items:center; padding:4px 0;';
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = offer.properties.includes(idx);
      cb.addEventListener('change', () => {
        const props = cb.checked ? [...offer.properties, idx] : offer.properties.filter((i) => i !== idx);
        set({ ...offer, properties: props });
      });
      lbl.append(cb, document.createTextNode(sq.name));
      props.appendChild(lbl);
    }
    col.appendChild(props);

    return col;
  }

  function offerSummary(label, offer) {
    const col = document.createElement('div');
    col.style.cssText = 'border: 1px solid var(--border); border-radius: 10px; padding: 12px;';
    const h = document.createElement('strong');
    h.textContent = label;
    col.appendChild(h);
    const ul = document.createElement('ul');
    ul.style.paddingLeft = '18px';
    if (offer.cash > 0) ul.appendChild(li(`$${offer.cash}`));
    for (const idx of offer.properties) ul.appendChild(li(getSquare(idx).name));
    if (offer.goojf > 0) ul.appendChild(li(`${offer.goojf} GOOJF card${offer.goojf > 1 ? 's' : ''}`));
    if (ul.children.length === 0) ul.appendChild(li('Nothing'));
    col.appendChild(ul);
    return col;
  }

  function li(text) {
    const el = document.createElement('li');
    el.textContent = text;
    return el;
  }

  function btn(label, cls, onClick) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = cls;
    b.textContent = label;
    if (onClick) b.addEventListener('click', onClick);
    return b;
  }

  refresh();
}
