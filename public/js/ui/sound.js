// Tiny sound effects via WebAudio. No assets required. The user can mute via
// localStorage flag 'monopoly:sound' = '0' | '1'.

const KEY = 'monopoly:sound';

let _ctx = null;
let _enabled = readEnabled();

function readEnabled() {
  try {
    return localStorage.getItem(KEY) !== '0';
  } catch {
    return true;
  }
}

export function isSoundEnabled() {
  return _enabled;
}

export function toggleSound() {
  _enabled = !_enabled;
  try { localStorage.setItem(KEY, _enabled ? '1' : '0'); } catch {}
  return _enabled;
}

function ctx() {
  if (!_ctx) {
    try { _ctx = new (window.AudioContext || window.webkitAudioContext)(); }
    catch { _ctx = null; }
  }
  return _ctx;
}

function blip(freq, duration = 0.08, type = 'sine', gain = 0.08) {
  if (!_enabled) return;
  const ac = ctx();
  if (!ac) return;
  // Resuming may be required after a user gesture.
  if (ac.state === 'suspended') ac.resume().catch(() => {});
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.value = gain;
  osc.connect(g).connect(ac.destination);
  osc.start();
  g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + duration);
  osc.stop(ac.currentTime + duration + 0.01);
}

export function dice() { blip(220, 0.06, 'square'); setTimeout(() => blip(180, 0.06, 'square'), 60); }
export function buy() { blip(660, 0.07, 'triangle'); setTimeout(() => blip(880, 0.1, 'triangle'), 70); }
export function rent() { blip(440, 0.08, 'sawtooth', 0.06); }
export function jail() { blip(120, 0.4, 'square', 0.07); }
export function win() {
  blip(523, 0.12);
  setTimeout(() => blip(659, 0.12), 130);
  setTimeout(() => blip(784, 0.18), 260);
}
