// Top-level play screen orchestrator.
// - Loads (or refuses to start without) a saved game from localStorage
// - Wires button handlers to engine actions
// - Re-renders the board / sidebar / action panel after every state change

import {
  rollDice,
  buyProperty,
  declineBuy,
  endTurn,
  payJailFine,
  useJailCard,
} from '/js/engine/engine.js';
import { saveCurrent, loadCurrent, archiveCurrent, clearCurrent } from '/js/engine/persist.js';
import { renderBoard } from '/js/ui/boardView.js';
import { renderPlayers, renderLog } from '/js/ui/sidebar.js';
import { renderActionPanel } from '/js/ui/actionPanel.js';
import { showEndGameModal } from '/js/ui/endGameModal.js';
import { showCardIfNew } from '/js/ui/cardModal.js';
import { showPropertyModal } from '/js/ui/propertyModal.js';
import { showTradeModal } from '/js/ui/tradeModal.js';
import { getSquare } from '/js/engine/board.js';
import * as sfx from '/js/ui/sound.js';

let state = loadCurrent();
if (!state) {
  alert('No game in progress. Returning to setup.');
  window.location.href = '/';
  throw new Error('no game');
}

const $board = document.getElementById('board');
const $players = document.getElementById('players-panel');
const $action = document.getElementById('action-panel');
const $log = document.getElementById('log');
const $turn = document.getElementById('turn-indicator');
const $quit = document.getElementById('btn-quit');
const $sound = document.getElementById('btn-sound');
const $modal = document.getElementById('modal-root');

const handlers = {
  onRoll: () => { sfx.dice(); apply(rollDice(state)); },
  onBuy: () => { sfx.buy(); apply(buyProperty(state)); },
  onDeclineBuy: () => apply(declineBuy(state)),
  onEndTurn: () => apply(endTurn(state)),
  onPayBail: () => apply(payJailFine(state)),
  onUseJailCard: () => apply(useJailCard(state)),
  onOpenTrade: () => showTradeModal($modal, state, { onApply: (next) => apply(next) }),
  onQuit: () => goHome(),
};

$sound.textContent = sfx.isSoundEnabled() ? '🔊' : '🔇';
$sound.addEventListener('click', () => {
  const enabled = sfx.toggleSound();
  $sound.textContent = enabled ? '🔊' : '🔇';
});

function goHome() {
  if (state.phase === 'ended') {
    archiveCurrent(state, `Final — ${new Date(state.createdAt).toLocaleDateString()}`);
    clearCurrent();
  } else {
    saveCurrent(state);
  }
  window.location.href = '/';
}

$quit.addEventListener('click', () => {
  if (state.phase !== 'ended') {
    if (!confirm('Quit to menu? Your current game will be saved and you can resume from the home screen.')) return;
  }
  goHome();
});

function apply(nextState) {
  if (nextState === state) return;
  state = nextState;
  saveCurrent(state);
  render();
}

let _winSoundPlayed = false;

function render() {
  $turn.textContent = `Turn ${state.turnNumber}`;
  renderBoard($board, state, { onTileClick: openPropertyForIndex });
  renderPlayers($players, state, { onPropertyClick: openPropertyForIndex });
  renderActionPanel($action, state, handlers);
  renderLog($log, state);

  // Show the most recently drawn card (if any) before any other modal.
  if (state.lastCard && state.phase !== 'ended') {
    showCardIfNew($modal, state, () => {});
  }

  if (state.phase === 'ended') {
    if (!_winSoundPlayed) { sfx.win(); _winSoundPlayed = true; }
    showEndGameModal($modal, state, () => {
      archiveCurrent(state, `Final — ${new Date(state.createdAt).toLocaleDateString()}`);
      clearCurrent();
      window.location.href = '/';
    });
  }
}

function openPropertyForIndex(idx) {
  const sq = getSquare(idx);
  if (!['property', 'railroad', 'utility'].includes(sq.type)) return;
  const own = state.ownership[idx];
  const cur = state.players[state.currentPlayerIdx];
  // Allow the current player to manage their own properties; everyone can view.
  const actorId = own?.ownerId === cur.id ? cur.id : null;
  showPropertyModal($modal, state, idx, {
    actorId,
    onApply: (next) => apply(next),
  });
}

render();
