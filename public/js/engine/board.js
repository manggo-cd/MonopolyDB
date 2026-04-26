// Standard US Monopoly board: 40 squares, indexed 0..39 starting at GO.
//
// Square shapes:
//   { index, name, type: 'go' | 'corner' | 'jail' | 'free_parking' | 'go_to_jail'
//                       | 'property' | 'railroad' | 'utility'
//                       | 'tax' | 'chance' | 'community_chest' }
//
// Property squares additionally have:
//   { color, price, rents: [base, monopoly, 1h, 2h, 3h, 4h, hotel],
//     mortgage, houseCost }
//
// Railroad squares additionally have:
//   { price, rents: [1RR, 2RR, 3RR, 4RR], mortgage }
//
// Utility squares additionally have:
//   { price, multipliers: [1U, 2U], mortgage }
//
// Tax squares additionally have:
//   { amount }   // flat amount; income tax is treated as a flat $200
//
// Color groups (for monopoly checks) and the railroad/utility groups are
// derived from the `color` field on property squares; railroads share the
// pseudo-color 'railroad'; utilities share the pseudo-color 'utility'.

export const COLOR_GROUPS = {
  brown: { houseCost: 50 },
  lightBlue: { houseCost: 50 },
  pink: { houseCost: 100 },
  orange: { houseCost: 100 },
  red: { houseCost: 150 },
  yellow: { houseCost: 150 },
  green: { houseCost: 200 },
  darkBlue: { houseCost: 200 },
};

function prop(index, name, color, price, rents, mortgage) {
  return {
    index,
    name,
    type: 'property',
    color,
    price,
    rents,
    mortgage,
    houseCost: COLOR_GROUPS[color].houseCost,
  };
}

function railroad(index, name) {
  return {
    index,
    name,
    type: 'railroad',
    color: 'railroad',
    price: 200,
    rents: [25, 50, 100, 200],
    mortgage: 100,
  };
}

function utility(index, name) {
  return {
    index,
    name,
    type: 'utility',
    color: 'utility',
    price: 150,
    multipliers: [4, 10],
    mortgage: 75,
  };
}

export const BOARD = [
  { index: 0, name: 'GO', type: 'go' },
  prop(1, 'Mediterranean Avenue', 'brown', 60, [2, 4, 10, 30, 90, 160, 250], 30),
  { index: 2, name: 'Community Chest', type: 'community_chest' },
  prop(3, 'Baltic Avenue', 'brown', 60, [4, 8, 20, 60, 180, 320, 450], 30),
  { index: 4, name: 'Income Tax', type: 'tax', amount: 200 },
  railroad(5, 'Reading Railroad'),
  prop(6, 'Oriental Avenue', 'lightBlue', 100, [6, 12, 30, 90, 270, 400, 550], 50),
  { index: 7, name: 'Chance', type: 'chance' },
  prop(8, 'Vermont Avenue', 'lightBlue', 100, [6, 12, 30, 90, 270, 400, 550], 50),
  prop(9, 'Connecticut Avenue', 'lightBlue', 120, [8, 16, 40, 100, 300, 450, 600], 60),
  { index: 10, name: 'Jail / Just Visiting', type: 'jail' },
  prop(11, 'St. Charles Place', 'pink', 140, [10, 20, 50, 150, 450, 625, 750], 70),
  utility(12, 'Electric Company'),
  prop(13, 'States Avenue', 'pink', 140, [10, 20, 50, 150, 450, 625, 750], 70),
  prop(14, 'Virginia Avenue', 'pink', 160, [12, 24, 60, 180, 500, 700, 900], 80),
  railroad(15, 'Pennsylvania Railroad'),
  prop(16, 'St. James Place', 'orange', 180, [14, 28, 70, 200, 550, 750, 950], 90),
  { index: 17, name: 'Community Chest', type: 'community_chest' },
  prop(18, 'Tennessee Avenue', 'orange', 180, [14, 28, 70, 200, 550, 750, 950], 90),
  prop(19, 'New York Avenue', 'orange', 200, [16, 32, 80, 220, 600, 800, 1000], 100),
  { index: 20, name: 'Free Parking', type: 'free_parking' },
  prop(21, 'Kentucky Avenue', 'red', 220, [18, 36, 90, 250, 700, 875, 1050], 110),
  { index: 22, name: 'Chance', type: 'chance' },
  prop(23, 'Indiana Avenue', 'red', 220, [18, 36, 90, 250, 700, 875, 1050], 110),
  prop(24, 'Illinois Avenue', 'red', 240, [20, 40, 100, 300, 750, 925, 1100], 120),
  railroad(25, 'B. & O. Railroad'),
  prop(26, 'Atlantic Avenue', 'yellow', 260, [22, 44, 110, 330, 800, 975, 1150], 130),
  prop(27, 'Ventnor Avenue', 'yellow', 260, [22, 44, 110, 330, 800, 975, 1150], 130),
  utility(28, 'Water Works'),
  prop(29, 'Marvin Gardens', 'yellow', 280, [24, 48, 120, 360, 850, 1025, 1200], 140),
  { index: 30, name: 'Go To Jail', type: 'go_to_jail' },
  prop(31, 'Pacific Avenue', 'green', 300, [26, 52, 130, 390, 900, 1100, 1275], 150),
  prop(32, 'North Carolina Avenue', 'green', 300, [26, 52, 130, 390, 900, 1100, 1275], 150),
  { index: 33, name: 'Community Chest', type: 'community_chest' },
  prop(34, 'Pennsylvania Avenue', 'green', 320, [28, 56, 150, 450, 1000, 1200, 1400], 160),
  railroad(35, 'Short Line'),
  { index: 36, name: 'Chance', type: 'chance' },
  prop(37, 'Park Place', 'darkBlue', 350, [35, 70, 175, 500, 1100, 1300, 1500], 175),
  { index: 38, name: 'Luxury Tax', type: 'tax', amount: 100 },
  prop(39, 'Boardwalk', 'darkBlue', 400, [50, 100, 200, 600, 1400, 1700, 2000], 200),
];

export const JAIL_INDEX = 10;
export const GO_TO_JAIL_INDEX = 30;
export const GO_INDEX = 0;
export const GO_SALARY = 200;
export const JAIL_FINE = 50;
export const BOARD_SIZE = BOARD.length;

export function getSquare(index) {
  return BOARD[((index % BOARD_SIZE) + BOARD_SIZE) % BOARD_SIZE];
}

export function getColorGroupSize(color) {
  return BOARD.filter((s) => s.color === color).length;
}

export function getColorGroupIndices(color) {
  return BOARD.filter((s) => s.color === color).map((s) => s.index);
}
