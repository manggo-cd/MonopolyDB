// Property card modal with rent table, owner, mortgage state, and (when the
// viewer is the owner) build/sell/mortgage actions.

import { getSquare } from '/js/engine/board.js';
import {
  buildHouse,
  sellHouse,
  mortgageProperty,
  unmortgageProperty,
} from '/js/engine/engine.js';

let _onApply = null;

export function showPropertyModal(rootEl, state, idx, opts = {}) {
  const sq = getSquare(idx);
  const own = state.ownership[idx];
  const owner = own ? state.players.find((p) => p.id === own.ownerId) : null;
  _onApply = opts.onApply || (() => {});

  rootEl.hidden = false;
  rootEl.innerHTML = '';
  const modal = document.createElement('div');
  modal.className = 'modal property-modal';
  modal.style.maxWidth = '420px';

  const accent = colorVar(sq);
  const title = document.createElement('div');
  title.style.cssText = `background:${accent}; color:white; padding:10px 14px; margin:-24px -24px 16px; border-radius:14px 14px 0 0; font-weight:700; letter-spacing:1px; text-transform:uppercase;`;
  title.textContent = sq.name;
  modal.appendChild(title);

  const body = document.createElement('div');
  body.appendChild(propertyDetails(sq, state, idx));

  // Actions only if there's an owner (and we're not in ended state).
  if (owner && state.phase !== 'ended' && opts.actorId === owner.id) {
    const actions = buildActionRow(rootEl, state, idx, sq, own, owner);
    body.appendChild(actions);
  }

  modal.appendChild(body);

  const close = document.createElement('div');
  close.className = 'modal-actions';
  const closeBtn = btn('Close', 'btn', () => {
    rootEl.hidden = true;
    rootEl.innerHTML = '';
  });
  close.appendChild(closeBtn);
  modal.appendChild(close);

  rootEl.appendChild(modal);
}

function propertyDetails(sq, state, idx) {
  const wrap = document.createElement('div');
  if (sq.type === 'property') {
    const tbl = document.createElement('table');
    tbl.style.cssText = 'width:100%; border-collapse: collapse; font-size: 0.9rem;';
    tbl.innerHTML = `
      <tr><td>Rent</td><td style="text-align:right;">$${sq.rents[0]}</td></tr>
      <tr><td>With color group</td><td style="text-align:right;">$${sq.rents[1]}</td></tr>
      <tr><td>1 house</td><td style="text-align:right;">$${sq.rents[2]}</td></tr>
      <tr><td>2 houses</td><td style="text-align:right;">$${sq.rents[3]}</td></tr>
      <tr><td>3 houses</td><td style="text-align:right;">$${sq.rents[4]}</td></tr>
      <tr><td>4 houses</td><td style="text-align:right;">$${sq.rents[5]}</td></tr>
      <tr><td>Hotel</td><td style="text-align:right;">$${sq.rents[6]}</td></tr>
      <tr><td>House cost</td><td style="text-align:right;">$${sq.houseCost} each</td></tr>
      <tr><td>Mortgage</td><td style="text-align:right;">$${sq.mortgage}</td></tr>
    `;
    wrap.appendChild(tbl);
  } else if (sq.type === 'railroad') {
    wrap.innerHTML = `
      <p>Rent depends on the number of railroads owned.</p>
      <table style="width:100%; font-size:0.9rem;">
        <tr><td>1 railroad</td><td style="text-align:right;">$25</td></tr>
        <tr><td>2 railroads</td><td style="text-align:right;">$50</td></tr>
        <tr><td>3 railroads</td><td style="text-align:right;">$100</td></tr>
        <tr><td>4 railroads</td><td style="text-align:right;">$200</td></tr>
        <tr><td>Mortgage</td><td style="text-align:right;">$${sq.mortgage}</td></tr>
      </table>
    `;
  } else if (sq.type === 'utility') {
    wrap.innerHTML = `
      <p>Rent is dice × multiplier.</p>
      <table style="width:100%; font-size:0.9rem;">
        <tr><td>1 utility</td><td style="text-align:right;">4× dice</td></tr>
        <tr><td>2 utilities</td><td style="text-align:right;">10× dice</td></tr>
        <tr><td>Mortgage</td><td style="text-align:right;">$${sq.mortgage}</td></tr>
      </table>
    `;
  }

  const own = state.ownership[idx];
  const status = document.createElement('p');
  status.style.cssText = 'margin-top:12px;';
  if (!own) {
    status.textContent = `Unowned. Buy price $${sq.price}.`;
  } else {
    const owner = state.players.find((p) => p.id === own.ownerId);
    const houses = own.houses || 0;
    status.innerHTML = `
      Owned by <strong>${escape(owner ? owner.name : '?')}</strong>.
      ${houses === 5 ? 'Hotel.' : houses > 0 ? `${houses} house(s).` : ''}
      ${own.mortgaged ? '<em>Mortgaged.</em>' : ''}
    `;
  }
  wrap.appendChild(status);
  return wrap;
}

function buildActionRow(rootEl, state, idx, sq, own, owner) {
  const actions = document.createElement('div');
  actions.className = 'button-row';
  actions.style.marginTop = '14px';

  if (sq.type === 'property') {
    const build = btn('Build house', 'btn success', () => {
      const next = buildHouse(state, idx);
      if (next === state) {
        flash(rootEl, 'Build blocked: own full color group, no mortgages, even build, $ + bank houses.');
        return;
      }
      _onApply(next);
      showPropertyModal(rootEl, next, idx, { onApply: _onApply, actorId: owner.id });
    });
    if ((own.houses || 0) >= 5) build.disabled = true;

    const sell = btn('Sell house', 'btn warn', () => {
      const next = sellHouse(state, idx);
      if (next === state) {
        flash(rootEl, 'Sell blocked: even sell-down only.');
        return;
      }
      _onApply(next);
      showPropertyModal(rootEl, next, idx, { onApply: _onApply, actorId: owner.id });
    });
    if ((own.houses || 0) <= 0) sell.disabled = true;

    actions.append(build, sell);
  }

  const mort = btn(own.mortgaged ? `Unmortgage ($${Math.ceil(sq.mortgage * 1.1)})` : `Mortgage ($${sq.mortgage})`, 'btn', () => {
    const next = own.mortgaged ? unmortgageProperty(state, idx) : mortgageProperty(state, idx);
    if (next === state) {
      flash(rootEl, own.mortgaged ? 'Unmortgage blocked: insufficient cash.' : 'Mortgage blocked: sell houses first.');
      return;
    }
    _onApply(next);
    showPropertyModal(rootEl, next, idx, { onApply: _onApply, actorId: owner.id });
  });
  actions.appendChild(mort);

  return actions;
}

function flash(rootEl, msg) {
  const flash = document.createElement('div');
  flash.className = 'pending-prompt';
  flash.style.cssText = 'margin-top:10px; background:rgba(200,21,45,0.08); border-color:rgba(200,21,45,0.4); color:var(--accent);';
  flash.textContent = msg;
  const modal = rootEl.querySelector('.property-modal');
  if (modal) {
    modal.insertBefore(flash, modal.querySelector('.modal-actions'));
    setTimeout(() => flash.remove(), 4000);
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

function colorVar(sq) {
  if (sq.color === 'railroad') return '#1d1d1f';
  if (sq.color === 'utility') return '#777';
  const map = {
    brown: '#955436', lightBlue: '#aae0fa', pink: '#d93a96', orange: '#f7941d',
    red: '#ed1b24', yellow: '#fef200', green: '#1fb25a', darkBlue: '#0072bb',
  };
  return map[sq.color] || '#666';
}

function escape(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
