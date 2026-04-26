// Public engine API.
//
// Convention: every mutating function takes a GameState and returns a *new*
// GameState (cloned). UI callers replace their state reference with the
// returned value, then re-render. Rule helpers in rules.js mutate in place
// only after we've already cloned at the entry point here.

import { BOARD, BOARD_SIZE, GO_TO_JAIL_INDEX, getSquare, JAIL_FINE, JAIL_INDEX } from './board.js';
import { createGameState, getCurrentPlayer } from './state.js';
import { findCard } from './cards.js';
import {
  advancePlayer,
  bankruptPlayer,
  canImproveColor,
  checkWinCondition,
  clone,
  colorGroupBuildState,
  housesOn,
  log,
  ownerIdOf,
  rentDue,
  rollTwoD6,
  sendToJail,
  teleportPlayer,
} from './rules.js';

export { getCurrentPlayer };

// Create a brand-new game.
export function newGame(opts) {
  return createGameState(opts);
}

// Step 1 of a turn: roll the dice. Sets state.phase = 'rolled' and stores the
// dice on state.lastRoll. Handles jail logic (can't move if still jailed,
// requires doubles or paying $50/using card to leave). Handles three-doubles
// rule (third double in a row sends the player to jail).
export function rollDice(state, rng = Math.random) {
  if (state.phase === 'ended') return state;
  if (state.phase !== 'awaiting_roll') return state;

  const next = clone(state);
  const player = getCurrentPlayer(next);
  if (player.bankrupt) {
    return endTurn(next);
  }

  const roll = rollTwoD6(rng);
  next.lastRoll = roll;
  log(next, `${player.name} rolled ${roll.d1} + ${roll.d2} = ${roll.total}${roll.doubles ? ' (doubles!)' : ''}.`);

  // --- Jail handling ---
  if (player.inJail) {
    if (roll.doubles) {
      log(next, `${player.name} rolled doubles and got out of Jail.`);
      player.inJail = false;
      player.jailTurns = 0;
      next.doublesCount = 0; // doubles to escape don't grant another roll
      moveAndResolve(next, roll.total, roll);
    } else {
      player.jailTurns += 1;
      if (player.jailTurns >= 3) {
        // Must pay $50 and move (rule: on 3rd failed roll, post bail and move).
        if (player.cash >= JAIL_FINE) {
          player.cash -= JAIL_FINE;
          if (next.settings.freeParkingJackpot) next.freeParkingPot += JAIL_FINE;
          log(next, `${player.name} paid $${JAIL_FINE} bail after 3 turns in Jail.`);
          player.inJail = false;
          player.jailTurns = 0;
          moveAndResolve(next, roll.total, roll);
        } else {
          // Bankrupt due to inability to post bail.
          log(next, `${player.name} cannot pay $${JAIL_FINE} bail.`);
          bankruptPlayer(next, player.id, null);
          checkWinCondition(next);
          next.phase = 'resolved';
        }
      } else {
        log(next, `${player.name} stays in Jail (turn ${player.jailTurns}/3).`);
        next.phase = 'resolved';
      }
    }
    next.updatedAt = Date.now();
    return next;
  }

  // --- Normal roll: doubles tracking ---
  if (roll.doubles) {
    next.doublesCount += 1;
    if (next.doublesCount >= 3) {
      log(next, `${player.name} rolled doubles three times in a row — go directly to Jail!`);
      sendToJail(next, next.currentPlayerIdx);
      next.doublesCount = 0;
      next.phase = 'resolved';
      next.updatedAt = Date.now();
      return next;
    }
  } else {
    next.doublesCount = 0;
  }

  moveAndResolve(next, roll.total, roll);
  next.updatedAt = Date.now();
  return next;
}

// Move the current player by `steps` and resolve whatever they land on.
function moveAndResolve(state, steps, roll) {
  const player = getCurrentPlayer(state);
  advancePlayer(state, state.currentPlayerIdx, steps);
  resolveLanding(state, roll);
}

// Resolve the square the current player just landed on. Mutates `state` in
// place (callers have already cloned). Sets state.phase appropriately.
function resolveLanding(state, roll) {
  const player = getCurrentPlayer(state);
  const sq = getSquare(player.position);
  log(state, `${player.name} landed on ${sq.name}.`);

  switch (sq.type) {
    case 'go':
    case 'free_parking':
    case 'jail':
      // No action. Free Parking jackpot collection happens in Phase 4 with the toggle.
      if (sq.type === 'free_parking' && state.settings.freeParkingJackpot && state.freeParkingPot > 0) {
        log(state, `${player.name} scooped $${state.freeParkingPot} from Free Parking.`);
        player.cash += state.freeParkingPot;
        state.freeParkingPot = 0;
      }
      state.phase = 'resolved';
      break;

    case 'go_to_jail':
      sendToJail(state, state.currentPlayerIdx);
      state.doublesCount = 0;
      state.phase = 'resolved';
      break;

    case 'tax': {
      const amount = sq.amount;
      log(state, `${player.name} owes $${amount} in tax.`);
      collectFromPlayer(state, state.currentPlayerIdx, amount, /*creditorIdx*/ null);
      state.phase = 'resolved';
      break;
    }

    case 'chance':
    case 'community_chest': {
      const deckId = sq.type === 'chance' ? 'chance' : 'communityChest';
      const card = drawCard(state, deckId);
      state.lastCard = { deckId, id: card.id, text: card.text };
      log(state, `${player.name} drew: ${card.text}`);
      applyCardEffect(state, card);
      // Returns: maybe still resolved, maybe phase ended (bankrupt).
      break;
    }

    case 'property':
    case 'railroad':
    case 'utility': {
      const ownerId = ownerIdOf(state, sq.index);
      if (!ownerId) {
        // Offer to buy.
        if (player.cash >= sq.price) {
          state.pendingAction = { type: 'awaiting_buy_decision', squareIndex: sq.index };
          state.phase = 'resolved';
          log(state, `${sq.name} is unowned. Buy for $${sq.price}?`);
        } else {
          log(state, `${player.name} can't afford ${sq.name} ($${sq.price}).`);
          state.phase = 'resolved';
        }
      } else if (ownerId === player.id) {
        log(state, `${player.name} owns ${sq.name}.`);
        state.phase = 'resolved';
      } else {
        const owner = state.players.find((pp) => pp.id === ownerId);
        if (state.ownership[sq.index].mortgaged) {
          log(state, `${sq.name} is mortgaged — no rent due.`);
          state.phase = 'resolved';
          break;
        }
        const rent = rentDue(state, sq.index, player.id, roll?.total || 0);
        if (rent > 0) {
          log(state, `${player.name} owes $${rent} rent to ${owner.name}.`);
          const ownerIdx = state.players.findIndex((pp) => pp.id === ownerId);
          collectFromPlayer(state, state.currentPlayerIdx, rent, ownerIdx);
        }
        state.phase = 'resolved';
      }
      break;
    }

    default:
      state.phase = 'resolved';
  }

  checkWinCondition(state);
}

// Collect `amount` from a player. If `creditorIdx` is null, money goes to the
// bank (or to the Free Parking pot under that house rule). If the payer can't
// cover it, they go bankrupt and (if there's a creditor) hand assets over.
function collectFromPlayer(state, payerIdx, amount, creditorIdx) {
  const payer = state.players[payerIdx];
  if (payer.cash >= amount) {
    payer.cash -= amount;
    if (creditorIdx == null) {
      if (state.settings.freeParkingJackpot) state.freeParkingPot += amount;
    } else {
      state.players[creditorIdx].cash += amount;
    }
    return;
  }
  // Can't pay — bankrupt. (Phase 5 will offer mortgage/sell-houses first.)
  log(state, `${payer.name} cannot pay $${amount}.`);
  bankruptPlayer(state, payer.id, creditorIdx == null ? null : state.players[creditorIdx].id);
}

// The current player decides to buy the square they just landed on. Only
// valid when state.pendingAction is the buy prompt.
export function buyProperty(state) {
  if (state.phase === 'ended') return state;
  if (!state.pendingAction || state.pendingAction.type !== 'awaiting_buy_decision') return state;
  const next = clone(state);
  const player = getCurrentPlayer(next);
  const idx = next.pendingAction.squareIndex;
  const sq = getSquare(idx);
  if (player.cash < sq.price) {
    log(next, `${player.name} can't afford ${sq.name} ($${sq.price}).`);
    next.pendingAction = null;
    next.updatedAt = Date.now();
    return next;
  }
  player.cash -= sq.price;
  player.properties.push(idx);
  next.ownership[idx] = { ownerId: player.id, houses: 0, mortgaged: false };
  log(next, `${player.name} bought ${sq.name} for $${sq.price}.`);
  next.pendingAction = null;
  next.updatedAt = Date.now();
  return next;
}

// Decline to buy. (Phase 7+: trigger an auction. For now: bank keeps it.)
export function declineBuy(state) {
  if (!state.pendingAction || state.pendingAction.type !== 'awaiting_buy_decision') return state;
  const next = clone(state);
  const sq = getSquare(next.pendingAction.squareIndex);
  log(next, `Nobody bought ${sq.name}.`);
  next.pendingAction = null;
  next.updatedAt = Date.now();
  return next;
}

// End the current player's turn and advance to the next non-bankrupt player.
// If the player rolled doubles (and isn't in jail), they get another roll
// instead of advancing.
export function endTurn(state) {
  if (state.phase === 'ended') return state;

  const next = clone(state);
  const player = getCurrentPlayer(next);

  // Doubles → same player rolls again (already validated for ≤3 in rollDice).
  const wasDoubles = next.lastRoll?.doubles && !player.inJail && !player.bankrupt;
  if (wasDoubles && next.phase === 'resolved' && !next.pendingAction) {
    next.phase = 'awaiting_roll';
    log(next, `${player.name} rolled doubles — roll again.`);
    next.updatedAt = Date.now();
    return next;
  }

  // Otherwise: advance to next non-bankrupt player.
  next.doublesCount = 0;
  next.lastRoll = null;
  next.lastCard = null;
  next.pendingAction = null;
  let safety = next.players.length + 1;
  do {
    next.currentPlayerIdx = (next.currentPlayerIdx + 1) % next.players.length;
    safety -= 1;
  } while (next.players[next.currentPlayerIdx].bankrupt && safety > 0);
  next.phase = 'awaiting_roll';
  next.turnNumber += 1;
  next.updatedAt = Date.now();
  log(next, `It's ${getCurrentPlayer(next).name}'s turn.`);
  checkWinCondition(next);
  return next;
}

// ---------------------------------------------------------------------------
// Cards
// ---------------------------------------------------------------------------

function drawCard(state, deckId) {
  const deck = state.decks[deckId];
  if (deck.drawPile.length === 0) {
    // Reshuffle discard pile back into draw pile.
    deck.drawPile = deck.discardPile.slice();
    deck.discardPile = [];
    // Simple LCG-free shuffle using Math.random; fine for game UX.
    for (let i = deck.drawPile.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck.drawPile[i], deck.drawPile[j]] = [deck.drawPile[j], deck.drawPile[i]];
    }
  }
  const id = deck.drawPile.shift();
  const card = findCard(id);
  // GOOJF stays with the player (popped here, returned on use); other cards go to discard.
  if (card.effect.kind !== 'goojf') {
    deck.discardPile.push(id);
  }
  return card;
}

function applyCardEffect(state, card) {
  const player = getCurrentPlayer(state);
  const playerIdx = state.currentPlayerIdx;
  const eff = card.effect;
  const deckId = card.id.startsWith('ch') ? 'chance' : 'communityChest';

  switch (eff.kind) {
    case 'advance':
      teleportPlayer(state, playerIdx, eff.to, { collectGoIfPassed: eff.collectGo });
      // Now resolve the new square.
      resolveLanding(state, state.lastRoll || null);
      return;

    case 'advance_to_nearest': {
      const nearest = nearestOf(player.position, eff.target);
      teleportPlayer(state, playerIdx, nearest, { collectGoIfPassed: true });
      // Custom landing: rent uses multiplier (or dice multiplier for utility).
      handleAdvanceToNearestLanding(state, eff);
      return;
    }

    case 'go_back': {
      const newPos = ((player.position - eff.spaces) % BOARD_SIZE + BOARD_SIZE) % BOARD_SIZE;
      // Going backward never collects GO.
      teleportPlayer(state, playerIdx, newPos, { collectGoIfPassed: false });
      resolveLanding(state, state.lastRoll || null);
      return;
    }

    case 'go_to_jail':
      sendToJail(state, playerIdx);
      state.doublesCount = 0;
      state.phase = 'resolved';
      return;

    case 'goojf':
      player.goojfCards.push({ deckId });
      log(state, `${player.name} keeps a Get Out of Jail Free card.`);
      state.phase = 'resolved';
      return;

    case 'gain':
      player.cash += eff.amount;
      log(state, `${player.name} received $${eff.amount}.`);
      state.phase = 'resolved';
      return;

    case 'pay':
      collectFromPlayer(state, playerIdx, eff.amount, null);
      state.phase = 'resolved';
      return;

    case 'pay_each': {
      let total = 0;
      const others = state.players.filter((p, i) => i !== playerIdx && !p.bankrupt);
      for (const other of others) {
        const amt = Math.min(eff.amount, player.cash);
        if (amt <= 0) break;
        // Pay each player individually so partial-payment / bankruptcy works per-creditor.
        const otherIdx = state.players.findIndex((p) => p.id === other.id);
        collectFromPlayer(state, playerIdx, eff.amount, otherIdx);
        total += eff.amount;
        if (player.bankrupt) break;
      }
      log(state, `${player.name} paid $${total} to other players.`);
      state.phase = 'resolved';
      return;
    }

    case 'collect_each': {
      let total = 0;
      for (let i = 0; i < state.players.length; i += 1) {
        if (i === playerIdx) continue;
        const other = state.players[i];
        if (other.bankrupt) continue;
        // Other player owes; if they can't, they go bankrupt to current player.
        collectFromPlayer(state, i, eff.amount, playerIdx);
        total += eff.amount;
      }
      log(state, `${player.name} collected $${total} from other players.`);
      state.phase = 'resolved';
      return;
    }

    case 'repairs': {
      let cost = 0;
      for (const idx of player.properties) {
        const o = state.ownership[idx];
        if (!o) continue;
        const h = o.houses || 0;
        if (h === 5) cost += eff.perHotel;
        else cost += h * eff.perHouse;
      }
      if (cost > 0) {
        log(state, `${player.name} owes $${cost} for repairs.`);
        collectFromPlayer(state, playerIdx, cost, null);
      }
      state.phase = 'resolved';
      return;
    }

    default:
      state.phase = 'resolved';
  }
}

const RAILROAD_INDICES = BOARD.filter((s) => s.type === 'railroad').map((s) => s.index);
const UTILITY_INDICES = BOARD.filter((s) => s.type === 'utility').map((s) => s.index);

function nearestOf(fromIndex, target) {
  const list = target === 'railroad' ? RAILROAD_INDICES : UTILITY_INDICES;
  // First index strictly greater than fromIndex (wrapping).
  for (const idx of list) if (idx > fromIndex) return idx;
  return list[0];
}

function handleAdvanceToNearestLanding(state, eff) {
  const player = getCurrentPlayer(state);
  const sq = getSquare(player.position);
  log(state, `${player.name} landed on ${sq.name}.`);

  const ownerId = ownerIdOf(state, sq.index);
  if (!ownerId) {
    if (player.cash >= sq.price) {
      state.pendingAction = { type: 'awaiting_buy_decision', squareIndex: sq.index };
      log(state, `${sq.name} is unowned. Buy for $${sq.price}?`);
    } else {
      log(state, `${player.name} can't afford ${sq.name} ($${sq.price}).`);
    }
    state.phase = 'resolved';
    return;
  }
  if (ownerId === player.id) {
    log(state, `${player.name} owns ${sq.name}.`);
    state.phase = 'resolved';
    return;
  }
  if (state.ownership[sq.index].mortgaged) {
    log(state, `${sq.name} is mortgaged — no rent due.`);
    state.phase = 'resolved';
    return;
  }
  let rent;
  if (sq.type === 'utility') {
    // Card guarantees 10x dice regardless of single/double utility ownership.
    const total = state.lastRoll?.total || rollOneTotal();
    rent = (eff.utilityDiceMultiplier || 10) * total;
  } else {
    // Railroad: rent times multiplier.
    const baseRent = rentDue(state, sq.index, player.id, state.lastRoll?.total || 0);
    rent = baseRent * (eff.rentMultiplier || 1);
  }
  if (rent > 0) {
    const ownerIdx = state.players.findIndex((pp) => pp.id === ownerId);
    log(state, `${player.name} owes $${rent} rent.`);
    collectFromPlayer(state, state.currentPlayerIdx, rent, ownerIdx);
  }
  state.phase = 'resolved';
}

function rollOneTotal() {
  return 2 + Math.floor(Math.random() * 11); // 2..12
}

// ---------------------------------------------------------------------------
// Jail actions
// ---------------------------------------------------------------------------

// Pay $50 bail before rolling. Player is freed (still uses their roll this turn).
export function payJailFine(state) {
  if (state.phase !== 'awaiting_roll') return state;
  const next = clone(state);
  const player = getCurrentPlayer(next);
  if (!player.inJail) return state;
  if (player.cash < JAIL_FINE) {
    log(next, `${player.name} can't afford the $${JAIL_FINE} bail.`);
    return next;
  }
  player.cash -= JAIL_FINE;
  if (next.settings.freeParkingJackpot) next.freeParkingPot += JAIL_FINE;
  player.inJail = false;
  player.jailTurns = 0;
  log(next, `${player.name} paid $${JAIL_FINE} bail.`);
  next.updatedAt = Date.now();
  return next;
}

// Use a Get Out of Jail Free card. Returns it to its deck's discard pile.
export function useJailCard(state) {
  if (state.phase !== 'awaiting_roll') return state;
  const next = clone(state);
  const player = getCurrentPlayer(next);
  if (!player.inJail || player.goojfCards.length === 0) return state;
  const card = player.goojfCards.shift();
  const deck = next.decks[card.deckId];
  if (deck) {
    const cardId = card.deckId === 'chance' ? 'ch08' : 'cc05';
    deck.discardPile.push(cardId);
  }
  player.inJail = false;
  player.jailTurns = 0;
  log(next, `${player.name} used a Get Out of Jail Free card.`);
  next.updatedAt = Date.now();
  return next;
}

// ---------------------------------------------------------------------------
// Houses, hotels, mortgage
// ---------------------------------------------------------------------------

// Build one house (or upgrade to hotel at 5 houses) on the property at `idx`.
// Returns a new state, or the same state if the action is invalid.
export function buildHouse(state, idx) {
  if (state.phase === 'ended') return state;
  const sq = getSquare(idx);
  if (sq.type !== 'property') return state;

  const o = state.ownership[idx];
  if (!o) return state;
  const player = state.players.find((p) => p.id === o.ownerId);
  if (!player) return state;
  if (!canImproveColor(state, player.id, sq.color)) return state;

  const h = o.houses || 0;
  if (h >= 5) return state;

  // Uniformity: must build evenly. New count must be ≤ min(others) + 1.
  const group = colorGroupBuildState(state, sq.color);
  if (h >= group.min + 1) return state; // building here would create uneven group
  // Note: when h === group.min, h+1 === group.min+1, allowed only if every
  //  property in the group is at this level OR lower (auto-satisfied).
  // When h > group.min (already higher), we'd be making it worse → blocked.
  if (h > group.min) return state;

  if (player.cash < sq.houseCost) return state;

  // Bank inventory check.
  const next = clone(state);
  if (h === 4) {
    if (next.bank.hotels <= 0) return state;
    // Trading 4 houses + cash for a hotel. Houses go back to bank.
    next.bank.houses += 4;
    next.bank.hotels -= 1;
  } else {
    if (next.bank.houses <= 0) return state;
    next.bank.houses -= 1;
  }
  const playerN = next.players.find((p) => p.id === player.id);
  playerN.cash -= sq.houseCost;
  next.ownership[idx].houses = h + 1;
  log(next, `${playerN.name} built ${h + 1 === 5 ? 'a hotel' : `house #${h + 1}`} on ${sq.name}.`);
  next.updatedAt = Date.now();
  return next;
}

// Sell one house (or downgrade hotel) at half its build cost.
export function sellHouse(state, idx) {
  if (state.phase === 'ended') return state;
  const sq = getSquare(idx);
  if (sq.type !== 'property') return state;

  const o = state.ownership[idx];
  if (!o) return state;
  const h = o.houses || 0;
  if (h <= 0) return state;

  const group = colorGroupBuildState(state, sq.color);
  // Uniformity: new count must be ≥ max(others) - 1.
  if (h - 1 < group.max - 1) return state;
  if (h < group.max) return state; // already lower than peers; selling more is illegal

  const next = clone(state);
  const player = next.players.find((p) => p.id === o.ownerId);
  if (!player) return state;
  const refund = Math.floor(sq.houseCost / 2);

  if (h === 5) {
    // Selling a hotel returns 4 houses (or fewer if bank is short → auction; we just allow).
    if (next.bank.houses < 4) {
      // Per official rules, hotels can only be sold back if 4 houses available.
      log(next, `Bank doesn't have 4 houses to break the hotel on ${sq.name}.`);
      return state;
    }
    next.bank.houses -= 4;
    next.bank.hotels += 1;
    next.ownership[idx].houses = 4;
  } else {
    next.bank.houses += 1;
    next.ownership[idx].houses = h - 1;
  }
  player.cash += refund;
  log(next, `${player.name} sold a building on ${sq.name} for $${refund}.`);
  next.updatedAt = Date.now();
  return next;
}

// Mortgage a property. Receive its mortgage value in cash. Cannot mortgage
// if there are houses on any property in the color group.
export function mortgageProperty(state, idx) {
  if (state.phase === 'ended') return state;
  const sq = getSquare(idx);
  if (!['property', 'railroad', 'utility'].includes(sq.type)) return state;
  const o = state.ownership[idx];
  if (!o || o.mortgaged) return state;

  // For colored properties, the entire color group must have no houses.
  if (sq.type === 'property') {
    const group = colorGroupBuildState(state, sq.color);
    if (group.max > 0) return state; // sell houses first
  }

  const next = clone(state);
  const player = next.players.find((p) => p.id === o.ownerId);
  if (!player) return state;
  next.ownership[idx].mortgaged = true;
  player.cash += sq.mortgage;
  log(next, `${player.name} mortgaged ${sq.name} for $${sq.mortgage}.`);
  next.updatedAt = Date.now();
  return next;
}

// Unmortgage a property: pay mortgage value + 10% interest (rounded up).
export function unmortgageProperty(state, idx) {
  if (state.phase === 'ended') return state;
  const sq = getSquare(idx);
  if (!['property', 'railroad', 'utility'].includes(sq.type)) return state;
  const o = state.ownership[idx];
  if (!o || !o.mortgaged) return state;
  const cost = Math.ceil(sq.mortgage * 1.1);

  const next = clone(state);
  const player = next.players.find((p) => p.id === o.ownerId);
  if (!player || player.cash < cost) return state;
  player.cash -= cost;
  next.ownership[idx].mortgaged = false;
  log(next, `${player.name} paid $${cost} to lift the mortgage on ${sq.name}.`);
  next.updatedAt = Date.now();
  return next;
}

// ---------------------------------------------------------------------------
// Trading
// ---------------------------------------------------------------------------

// Validate and execute a trade between two players.
//
// Offer shape: { cash: number, properties: number[], goojf: number }
//
// Returns:
//   { state }          on success
//   { state, error }   on validation failure (state unchanged)
export function executeTrade(state, { fromId, toId, fromOffer, toOffer }) {
  if (state.phase === 'ended') return { state, error: 'Game has ended.' };
  const from = state.players.find((p) => p.id === fromId);
  const to = state.players.find((p) => p.id === toId);
  if (!from || !to) return { state, error: 'Unknown player.' };
  if (from.bankrupt || to.bankrupt) return { state, error: 'Cannot trade with a bankrupt player.' };
  if (fromId === toId) return { state, error: 'Cannot trade with yourself.' };

  const err = validateTradeOffer(state, from, fromOffer);
  if (err) return { state, error: `${from.name}: ${err}` };
  const err2 = validateTradeOffer(state, to, toOffer);
  if (err2) return { state, error: `${to.name}: ${err2}` };

  const next = clone(state);
  const f = next.players.find((p) => p.id === fromId);
  const t = next.players.find((p) => p.id === toId);

  // Cash
  f.cash -= fromOffer.cash;
  t.cash += fromOffer.cash;
  t.cash -= toOffer.cash;
  f.cash += toOffer.cash;

  // Properties (transfer ownership)
  for (const idx of fromOffer.properties) {
    next.ownership[idx].ownerId = t.id;
    f.properties = f.properties.filter((i) => i !== idx);
    t.properties.push(idx);
  }
  for (const idx of toOffer.properties) {
    next.ownership[idx].ownerId = f.id;
    t.properties = t.properties.filter((i) => i !== idx);
    f.properties.push(idx);
  }

  // GOOJF cards (transfer top N cards from each pile)
  for (let i = 0; i < fromOffer.goojf; i += 1) {
    const card = f.goojfCards.shift();
    if (card) t.goojfCards.push(card);
  }
  for (let i = 0; i < toOffer.goojf; i += 1) {
    const card = t.goojfCards.shift();
    if (card) f.goojfCards.push(card);
  }

  log(next, `${f.name} ↔ ${t.name} traded${describeOffer(state, fromOffer)} for${describeOffer(state, toOffer)}.`);
  next.updatedAt = Date.now();
  return { state: next };
}

function validateTradeOffer(state, player, offer) {
  if (!offer) return 'Missing offer.';
  if (typeof offer.cash !== 'number' || offer.cash < 0) return 'Invalid cash amount.';
  if (offer.cash > player.cash) return 'Insufficient cash.';
  if (!Array.isArray(offer.properties)) return 'Invalid properties.';
  for (const idx of offer.properties) {
    const sq = getSquare(idx);
    if (!sq) return `Bad property index ${idx}.`;
    const o = state.ownership[idx];
    if (!o || o.ownerId !== player.id) return `Doesn't own ${sq.name}.`;
    if (sq.type === 'property') {
      // Can't trade property whose color group has any houses.
      const group = colorGroupBuildState(state, sq.color);
      if (group.max > 0) return `Sell houses on the ${sq.color} group before trading ${sq.name}.`;
    }
  }
  if (typeof offer.goojf !== 'number' || offer.goojf < 0) return 'Invalid GOOJF count.';
  if (offer.goojf > player.goojfCards.length) return 'Not enough Get Out of Jail Free cards.';
  return null;
}

function describeOffer(state, offer) {
  const parts = [];
  if (offer.cash > 0) parts.push(` $${offer.cash}`);
  if (offer.properties.length > 0) {
    parts.push(' ' + offer.properties.map((i) => getSquare(i).name).join(', '));
  }
  if (offer.goojf > 0) parts.push(` ${offer.goojf} GOOJF`);
  return parts.length ? parts.join(' +') : ' nothing';
}

// Convenience for tests / console: list players' positions and cash.
export function describe(state) {
  return state.players.map((p) => ({
    name: p.name,
    cash: p.cash,
    position: p.position,
    on: BOARD[p.position]?.name,
    inJail: p.inJail,
    bankrupt: p.bankrupt,
    properties: p.properties.length,
  }));
}
