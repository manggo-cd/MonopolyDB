// Game state factory and pure helpers.
//
// GameState shape:
// {
//   id: string,
//   createdAt: number,                   // epoch ms
//   updatedAt: number,
//   settings: {
//     startingCash: number,
//     freeParkingJackpot: boolean,       // optional house rule: taxes/fees go to Free Parking pot
//   },
//   players: [
//     {
//       id: string,                      // 'p1', 'p2', ...
//       name: string,
//       token: string,                   // token id (e.g. 'top-hat')
//       cash: number,
//       position: number,                // 0..39
//       inJail: boolean,
//       jailTurns: number,               // # turns spent in jail (0..3)
//       goojfCards: { deckId: 'chance'|'communityChest' }[],
//       bankrupt: boolean,
//       properties: number[],            // board indices owned
//     }
//   ],
//   currentPlayerIdx: number,
//   doublesCount: number,
//   ownership: {
//     // map from board-index -> { ownerId, houses (0..5; 5 = hotel), mortgaged: boolean }
//   },
//   decks: {
//     chance:         { drawPile: string[], discardPile: string[] },
//     communityChest: { drawPile: string[], discardPile: string[] }
//   },
//   freeParkingPot: number,
//   pendingAction: null | { type: string, ... },
//   lastCard: null | { deckId, id, text },  // most recently drawn card (UI hint)
//   log: { ts: number, text: string }[],
//   phase: 'awaiting_roll' | 'resolved' | 'ended',
//   winnerId: string | null,
//   turnNumber: number,
// }

import { buildShuffledDeck } from './cards.js';

let _id = 0;
function uid(prefix) {
  _id += 1;
  return `${prefix}${_id.toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export function createGameState({ players, startingCash = 1500, freeParkingJackpot = false, rng = Math.random }) {
  if (!Array.isArray(players) || players.length < 2 || players.length > 8) {
    throw new Error('Monopoly requires 2 to 8 players.');
  }

  const now = Date.now();
  return {
    id: uid('g_'),
    createdAt: now,
    updatedAt: now,
    settings: {
      startingCash,
      freeParkingJackpot: Boolean(freeParkingJackpot),
    },
    players: players.map((p, i) => ({
      id: `p${i + 1}`,
      name: String(p.name || `Player ${i + 1}`),
      token: String(p.token || defaultToken(i)),
      cash: startingCash,
      position: 0,
      inJail: false,
      jailTurns: 0,
      goojfCards: [],
      bankrupt: false,
      properties: [],
    })),
    currentPlayerIdx: 0,
    doublesCount: 0,
    ownership: {},
    decks: {
      chance: { drawPile: buildShuffledDeck('chance', rng), discardPile: [] },
      communityChest: { drawPile: buildShuffledDeck('communityChest', rng), discardPile: [] },
    },
    bank: {
      houses: 32,
      hotels: 12,
    },
    freeParkingPot: 0,
    pendingAction: null,
    lastCard: null,
    log: [{ ts: now, text: 'Game started.' }],
    phase: 'awaiting_roll',
    winnerId: null,
    turnNumber: 1,
  };
}

const DEFAULT_TOKENS = [
  'top-hat',
  'car',
  'dog',
  'ship',
  'boot',
  'cat',
  'wheelbarrow',
  'rocket',
];

export function defaultToken(i) {
  return DEFAULT_TOKENS[i % DEFAULT_TOKENS.length];
}

export const TOKENS = DEFAULT_TOKENS.slice();

export function getCurrentPlayer(state) {
  return state.players[state.currentPlayerIdx];
}

export function getActivePlayers(state) {
  return state.players.filter((p) => !p.bankrupt);
}

export function findPlayerById(state, id) {
  return state.players.find((p) => p.id === id) || null;
}

export function findOwnerOf(state, squareIndex) {
  const o = state.ownership[squareIndex];
  if (!o) return null;
  return findPlayerById(state, o.ownerId);
}
