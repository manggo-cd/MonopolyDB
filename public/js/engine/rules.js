// Pure rule helpers operating on a GameState. None of these mutate the state
// passed in — they always return a new state (or a value derived from it).
// Larger orchestration (turn loop, pending actions) lives in engine.js.

import {
  BOARD,
  BOARD_SIZE,
  GO_INDEX,
  GO_SALARY,
  JAIL_INDEX,
  getSquare,
  getColorGroupIndices,
} from './board.js';
import { findPlayerById } from './state.js';

export function clone(state) {
  // Cheap deep clone via JSON; GameState contains only plain data.
  return JSON.parse(JSON.stringify(state));
}

export function log(state, text) {
  state.log.push({ ts: Date.now(), text });
  if (state.log.length > 500) state.log.splice(0, state.log.length - 500);
}

export function rollTwoD6(rng = Math.random) {
  const d1 = 1 + Math.floor(rng() * 6);
  const d2 = 1 + Math.floor(rng() * 6);
  return { d1, d2, total: d1 + d2, doubles: d1 === d2 };
}

export function ownerIdOf(state, squareIndex) {
  const o = state.ownership[squareIndex];
  return o ? o.ownerId : null;
}

export function isMortgaged(state, squareIndex) {
  return Boolean(state.ownership[squareIndex]?.mortgaged);
}

export function housesOn(state, squareIndex) {
  return state.ownership[squareIndex]?.houses || 0;
}

export function ownsFullColorGroup(state, playerId, color) {
  const indices = getColorGroupIndices(color);
  if (indices.length === 0) return false;
  return indices.every((idx) => state.ownership[idx]?.ownerId === playerId);
}

export function countRailroadsOwned(state, playerId) {
  return BOARD.filter(
    (s) => s.type === 'railroad' && state.ownership[s.index]?.ownerId === playerId,
  ).length;
}

export function countUtilitiesOwned(state, playerId) {
  return BOARD.filter(
    (s) => s.type === 'utility' && state.ownership[s.index]?.ownerId === playerId,
  ).length;
}

// Compute rent owed when `payer` lands on `squareIndex` with the given dice total.
// Returns 0 if the square is unowned, mortgaged, or owned by the payer themselves.
export function rentDue(state, squareIndex, payerId, diceTotal) {
  const sq = getSquare(squareIndex);
  const o = state.ownership[squareIndex];
  if (!o) return 0;
  if (o.mortgaged) return 0;
  if (o.ownerId === payerId) return 0;

  if (sq.type === 'property') {
    const houses = o.houses || 0;
    if (houses >= 1) {
      // 1..5 maps to rents[2..6]; rents[1] is the monopoly rate (no houses)
      return sq.rents[1 + houses];
    }
    if (ownsFullColorGroup(state, o.ownerId, sq.color)) {
      return sq.rents[1];
    }
    return sq.rents[0];
  }

  if (sq.type === 'railroad') {
    const n = countRailroadsOwned(state, o.ownerId);
    return sq.rents[Math.max(0, n - 1)] || 0;
  }

  if (sq.type === 'utility') {
    const n = countUtilitiesOwned(state, o.ownerId);
    const mult = sq.multipliers[Math.max(0, n - 1)] || sq.multipliers[0];
    return mult * (diceTotal || 0);
  }

  return 0;
}

// Move a player by `steps` squares (positive only). Handles passing GO.
// Mutates `state.players[playerIdx]` in place; logs salary if applicable.
export function advancePlayer(state, playerIdx, steps) {
  const p = state.players[playerIdx];
  const before = p.position;
  const after = (before + steps) % BOARD_SIZE;
  if (after < before || steps >= BOARD_SIZE) {
    p.cash += GO_SALARY;
    log(state, `${p.name} passed GO and collected $${GO_SALARY}.`);
  }
  p.position = after;
  return after;
}

// Teleport a player to a specific square. If `collectGoIfPassed` is true and
// the move walks past GO (forward direction), pay the salary.
export function teleportPlayer(state, playerIdx, targetIndex, { collectGoIfPassed = true } = {}) {
  const p = state.players[playerIdx];
  const before = p.position;
  if (collectGoIfPassed && targetIndex < before && targetIndex !== JAIL_INDEX) {
    // Wrapped past GO going forward.
    p.cash += GO_SALARY;
    log(state, `${p.name} passed GO and collected $${GO_SALARY}.`);
  }
  p.position = targetIndex;
}

// Send a player to jail (board index 10, inJail flag on).
export function sendToJail(state, playerIdx) {
  const p = state.players[playerIdx];
  p.position = JAIL_INDEX;
  p.inJail = true;
  p.jailTurns = 0;
  log(state, `${p.name} was sent to Jail.`);
}

// Returns the *active* (non-bankrupt) player ids in turn order.
export function activeOrder(state) {
  return state.players.filter((p) => !p.bankrupt).map((p) => p.id);
}

// Mark a player bankrupt and (optionally) transfer their assets to a creditor.
// If creditor is null, properties revert to the bank (and houses are sold back
// at half price as cash, which since the player is bankrupt is moot).
export function bankruptPlayer(state, debtorId, creditorId) {
  const debtor = findPlayerById(state, debtorId);
  if (!debtor || debtor.bankrupt) return;
  debtor.bankrupt = true;
  log(state, `${debtor.name} went bankrupt.`);

  const creditor = creditorId ? findPlayerById(state, creditorId) : null;

  for (const idx of debtor.properties.slice()) {
    const o = state.ownership[idx];
    if (!o) continue;
    if (creditor) {
      o.ownerId = creditor.id;
      creditor.properties.push(idx);
      // Mortgaged properties stay mortgaged in the recipient's hands.
    } else {
      delete state.ownership[idx];
    }
  }
  debtor.properties = [];
  // Pass GOOJF cards to creditor; otherwise return them to their decks.
  if (creditor) {
    creditor.goojfCards.push(...debtor.goojfCards);
  } else {
    for (const card of debtor.goojfCards) {
      const deck = state.decks?.[card.deckId];
      if (deck) deck.discardPile.push(deck === state.decks.chance ? 'ch08' : 'cc05');
    }
  }
  debtor.goojfCards = [];
  debtor.cash = 0;
}

// Returns true if the color group is fully owned by `playerId` and none of the
// group's properties are mortgaged (a precondition for building houses).
export function canImproveColor(state, playerId, color) {
  const indices = getColorGroupIndices(color);
  if (indices.length === 0) return false;
  return indices.every((idx) => {
    const o = state.ownership[idx];
    return o && o.ownerId === playerId && !o.mortgaged;
  });
}

// Compute houses on each property in a color group, plus the min/max counts.
export function colorGroupBuildState(state, color) {
  const indices = getColorGroupIndices(color);
  const counts = indices.map((idx) => state.ownership[idx]?.houses || 0);
  return {
    indices,
    counts,
    min: counts.length ? Math.min(...counts) : 0,
    max: counts.length ? Math.max(...counts) : 0,
  };
}

// Win condition: only one non-bankrupt player remains.
export function checkWinCondition(state) {
  const alive = state.players.filter((p) => !p.bankrupt);
  if (alive.length === 1 && state.players.length > 1) {
    state.phase = 'ended';
    state.winnerId = alive[0].id;
    log(state, `${alive[0].name} wins the game!`);
  }
}
