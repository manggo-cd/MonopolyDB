// Standard Chance and Community Chest decks.
//
// Each card is a plain object describing an effect. The engine consumes the
// `kind` discriminator and the relevant fields. We keep these data-only so
// they're easy to localize / tweak / persist.
//
// Effect kinds:
//   { kind: 'advance',     to: <board-index>, collectGo: true|false }
//   { kind: 'advance_to_nearest', target: 'railroad'|'utility',
//                          rentMultiplier: 1|2,        // 1 = normal rent (utility uses 10x dice override)
//                          utilityDiceMultiplier: 10 } // for utility special card
//   { kind: 'go_back',     spaces: number }
//   { kind: 'go_to_jail' }
//   { kind: 'goojf' }      // get out of jail free
//   { kind: 'gain',        amount: number }
//   { kind: 'pay',         amount: number }
//   { kind: 'pay_each',    amount: number }
//   { kind: 'collect_each',amount: number }
//   { kind: 'repairs',     perHouse: number, perHotel: number }

export const CHANCE_DECK = [
  { id: 'ch01', text: 'Advance to GO. Collect $200.',                                      effect: { kind: 'advance', to: 0, collectGo: true } },
  { id: 'ch02', text: 'Advance to Illinois Avenue. If you pass GO, collect $200.',         effect: { kind: 'advance', to: 24, collectGo: true } },
  { id: 'ch03', text: 'Advance to St. Charles Place. If you pass GO, collect $200.',       effect: { kind: 'advance', to: 11, collectGo: true } },
  { id: 'ch04', text: 'Advance to the nearest Utility. Pay 10× dice if owned, otherwise buy from the bank.', effect: { kind: 'advance_to_nearest', target: 'utility', utilityDiceMultiplier: 10 } },
  { id: 'ch05', text: 'Advance to the nearest Railroad. Pay double the regular rent if owned.', effect: { kind: 'advance_to_nearest', target: 'railroad', rentMultiplier: 2 } },
  { id: 'ch06', text: 'Advance to the nearest Railroad. Pay double the regular rent if owned.', effect: { kind: 'advance_to_nearest', target: 'railroad', rentMultiplier: 2 } },
  { id: 'ch07', text: 'Bank pays you a dividend of $50.',                                  effect: { kind: 'gain', amount: 50 } },
  { id: 'ch08', text: 'Get Out of Jail Free. Keep this card until needed.',                effect: { kind: 'goojf' } },
  { id: 'ch09', text: 'Go back 3 spaces.',                                                 effect: { kind: 'go_back', spaces: 3 } },
  { id: 'ch10', text: 'Go directly to Jail. Do not pass GO.',                              effect: { kind: 'go_to_jail' } },
  { id: 'ch11', text: 'Make general repairs on all your property: pay $25 per house and $100 per hotel.', effect: { kind: 'repairs', perHouse: 25, perHotel: 100 } },
  { id: 'ch12', text: 'Speeding fine — pay $15.',                                          effect: { kind: 'pay', amount: 15 } },
  { id: 'ch13', text: 'Take a trip to Reading Railroad. If you pass GO, collect $200.',    effect: { kind: 'advance', to: 5, collectGo: true } },
  { id: 'ch14', text: 'Take a walk on the Boardwalk — advance to Boardwalk.',              effect: { kind: 'advance', to: 39, collectGo: false } },
  { id: 'ch15', text: 'You have been elected Chairman of the Board — pay each player $50.', effect: { kind: 'pay_each', amount: 50 } },
  { id: 'ch16', text: 'Your building loan matures — collect $150.',                        effect: { kind: 'gain', amount: 150 } },
];

export const COMMUNITY_CHEST_DECK = [
  { id: 'cc01', text: 'Advance to GO. Collect $200.',                                      effect: { kind: 'advance', to: 0, collectGo: true } },
  { id: 'cc02', text: 'Bank error in your favor — collect $200.',                          effect: { kind: 'gain', amount: 200 } },
  { id: 'cc03', text: "Doctor's fee — pay $50.",                                            effect: { kind: 'pay', amount: 50 } },
  { id: 'cc04', text: 'From sale of stock you get $50.',                                   effect: { kind: 'gain', amount: 50 } },
  { id: 'cc05', text: 'Get Out of Jail Free. Keep this card until needed.',                effect: { kind: 'goojf' } },
  { id: 'cc06', text: 'Go directly to Jail. Do not pass GO.',                              effect: { kind: 'go_to_jail' } },
  { id: 'cc07', text: 'Holiday fund matures — receive $100.',                              effect: { kind: 'gain', amount: 100 } },
  { id: 'cc08', text: 'Income tax refund — collect $20.',                                  effect: { kind: 'gain', amount: 20 } },
  { id: 'cc09', text: "It is your birthday — collect $10 from each player.",               effect: { kind: 'collect_each', amount: 10 } },
  { id: 'cc10', text: 'Life insurance matures — collect $100.',                            effect: { kind: 'gain', amount: 100 } },
  { id: 'cc11', text: 'Pay hospital fees of $100.',                                        effect: { kind: 'pay', amount: 100 } },
  { id: 'cc12', text: 'Pay school fees of $50.',                                           effect: { kind: 'pay', amount: 50 } },
  { id: 'cc13', text: 'Receive consultancy fee — $25.',                                    effect: { kind: 'gain', amount: 25 } },
  { id: 'cc14', text: 'You are assessed for street repairs — $40 per house, $115 per hotel.', effect: { kind: 'repairs', perHouse: 40, perHotel: 115 } },
  { id: 'cc15', text: 'You have won second prize in a beauty contest — collect $10.',      effect: { kind: 'gain', amount: 10 } },
  { id: 'cc16', text: 'You inherit $100.',                                                 effect: { kind: 'gain', amount: 100 } },
];

export function buildShuffledDeck(deckId, rng = Math.random) {
  const src = deckId === 'chance' ? CHANCE_DECK : COMMUNITY_CHEST_DECK;
  const arr = src.map((c) => c.id);
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function findCard(id) {
  return CHANCE_DECK.find((c) => c.id === id) || COMMUNITY_CHEST_DECK.find((c) => c.id === id) || null;
}
