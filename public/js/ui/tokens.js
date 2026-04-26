// Shared token registry for the home and play screens.
export const TOKENS = [
  { id: 'top-hat', glyph: '🎩', label: 'Top hat' },
  { id: 'car', glyph: '🚗', label: 'Car' },
  { id: 'dog', glyph: '🐕', label: 'Dog' },
  { id: 'ship', glyph: '⛵', label: 'Ship' },
  { id: 'boot', glyph: '🥾', label: 'Boot' },
  { id: 'cat', glyph: '🐈', label: 'Cat' },
  { id: 'wheelbarrow', glyph: '🛒', label: 'Wheelbarrow' },
  { id: 'rocket', glyph: '🚀', label: 'Rocket' },
];

export function tokenGlyph(id) {
  return TOKENS.find((t) => t.id === id)?.glyph || '🎩';
}

export const PLAYER_COLORS = [
  '#c8152d', // red
  '#1f6feb', // blue
  '#2da44e', // green
  '#bf8700', // gold
  '#a371f7', // purple
  '#fb8500', // orange
  '#0098a3', // teal
  '#d63384', // pink
];

export function playerColor(index) {
  return PLAYER_COLORS[index % PLAYER_COLORS.length];
}
