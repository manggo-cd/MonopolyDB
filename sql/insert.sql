PROMPT Inserting seed data...

-- Game (5)
INSERT INTO Game (game_id, status, start_time, player_count) VALUES (1, 'active',   TIMESTAMP '2026-03-01 10:00:00', 4);
INSERT INTO Game (game_id, status, start_time, player_count) VALUES (2, 'complete', TIMESTAMP '2026-03-01 11:30:00', 3);
INSERT INTO Game (game_id, status, start_time, player_count) VALUES (3, 'active',   TIMESTAMP '2026-03-02 09:15:00', 2);
INSERT INTO Game (game_id, status, start_time, player_count) VALUES (4, 'complete', TIMESTAMP '2026-03-03 15:45:00', 4);
INSERT INTO Game (game_id, status, start_time, player_count) VALUES (5, 'active',   TIMESTAMP '2026-03-04 18:20:00', 3);

-- Effect (5)
INSERT INTO Effect (effect_id, type, amount, description) VALUES (1, 'money_gain', 200, 'Collect 200 from bank');
INSERT INTO Effect (effect_id, type, amount, description) VALUES (2, 'money_loss',  50, 'Pay 50 tax');
INSERT INTO Effect (effect_id, type, amount, description) VALUES (3, 'move',        NULL, 'Advance to Go');
INSERT INTO Effect (effect_id, type, amount, description) VALUES (4, 'jail',        NULL, 'Go directly to Jail');
INSERT INTO Effect (effect_id, type, amount, description) VALUES (5, 'repair',      40, 'Pay 40 per house');

-- ColourRent (5)
INSERT INTO ColourRent (colour, rent) VALUES ('Brown',      2);
INSERT INTO ColourRent (colour, rent) VALUES ('LightBlue',  6);
INSERT INTO ColourRent (colour, rent) VALUES ('Pink',      14);
INSERT INTO ColourRent (colour, rent) VALUES ('Orange',    18);
INSERT INTO ColourRent (colour, rent) VALUES ('Red',       26);

-- Board_Position (15)
INSERT INTO Board_Position (position, name, icon) VALUES (1,  'Go',            'GO');
INSERT INTO Board_Position (position, name, icon) VALUES (2,  'Mediterranean', 'PROP');
INSERT INTO Board_Position (position, name, icon) VALUES (3,  'Community',     'CC');
INSERT INTO Board_Position (position, name, icon) VALUES (4,  'Baltic',        'PROP');
INSERT INTO Board_Position (position, name, icon) VALUES (5,  'Income Tax',    'TAX');
INSERT INTO Board_Position (position, name, icon) VALUES (6,  'Reading RR',    'RAIL');
INSERT INTO Board_Position (position, name, icon) VALUES (7,  'Chance',        'CH');
INSERT INTO Board_Position (position, name, icon) VALUES (8,  'Vermont',       'PROP');
INSERT INTO Board_Position (position, name, icon) VALUES (9,  'Connecticut',   'PROP');
INSERT INTO Board_Position (position, name, icon) VALUES (10, 'Jail',          'JAIL');
INSERT INTO Board_Position (position, name, icon) VALUES (11, 'St Charles',    'PROP');
INSERT INTO Board_Position (position, name, icon) VALUES (12, 'Electric Co',   'UTIL');
INSERT INTO Board_Position (position, name, icon) VALUES (13, 'States Ave',    'PROP');
INSERT INTO Board_Position (position, name, icon) VALUES (14, 'Virginia Ave',  'PROP');
INSERT INTO Board_Position (position, name, icon) VALUES (15, 'Penn RR',       'RAIL');

-- Space (15)
INSERT INTO Space (space_id, position) VALUES (1, 1);
INSERT INTO Space (space_id, position) VALUES (2, 2);
INSERT INTO Space (space_id, position) VALUES (3, 3);
INSERT INTO Space (space_id, position) VALUES (4, 4);
INSERT INTO Space (space_id, position) VALUES (5, 5);
INSERT INTO Space (space_id, position) VALUES (6, 6);
INSERT INTO Space (space_id, position) VALUES (7, 7);
INSERT INTO Space (space_id, position) VALUES (8, 8);
INSERT INTO Space (space_id, position) VALUES (9, 9);
INSERT INTO Space (space_id, position) VALUES (10, 10);
INSERT INTO Space (space_id, position) VALUES (11, 11);
INSERT INTO Space (space_id, position) VALUES (12, 12);
INSERT INTO Space (space_id, position) VALUES (13, 13);
INSERT INTO Space (space_id, position) VALUES (14, 14);
INSERT INTO Space (space_id, position) VALUES (15, 15);

-- Property (5)
INSERT INTO Property (property_id, colour, cost) VALUES (101, 'Brown',      60);
INSERT INTO Property (property_id, colour, cost) VALUES (102, 'LightBlue', 100);
INSERT INTO Property (property_id, colour, cost) VALUES (103, 'Pink',      140);
INSERT INTO Property (property_id, colour, cost) VALUES (104, 'Orange',    180);
INSERT INTO Property (property_id, colour, cost) VALUES (105, 'Red',       220);

-- Player (5)
INSERT INTO Player (player_id, name, balance, position) VALUES (1, 'Alex',  1500, 1);
INSERT INTO Player (player_id, name, balance, position) VALUES (2, 'Blair', 1450, 5);
INSERT INTO Player (player_id, name, balance, position) VALUES (3, 'Casey', 1320, 8);
INSERT INTO Player (player_id, name, balance, position) VALUES (4, 'Drew',  1250, 10);
INSERT INTO Player (player_id, name, balance, position) VALUES (5, 'Evan',  1600, 3);

-- PlayerGame (5)
INSERT INTO PlayerGame (player_id, game_id) VALUES (1, 1);
INSERT INTO PlayerGame (player_id, game_id) VALUES (2, 1);
INSERT INTO PlayerGame (player_id, game_id) VALUES (3, 2);
INSERT INTO PlayerGame (player_id, game_id) VALUES (4, 2);
INSERT INTO PlayerGame (player_id, game_id) VALUES (5, 3);

-- Bank (5)
INSERT INTO Bank (bank_id, balance, banker, money_gained) VALUES (1, 20580, 1, 420);
INSERT INTO Bank (bank_id, balance, banker, money_gained) VALUES (2, 19820, 2, 380);
INSERT INTO Bank (bank_id, balance, banker, money_gained) VALUES (3, 21050, 3, 510);
INSERT INTO Bank (bank_id, balance, banker, money_gained) VALUES (4, 20210, 4, 330);
INSERT INTO Bank (bank_id, balance, banker, money_gained) VALUES (5, 20700, 5, 470);

-- Turn (5)
INSERT INTO Turn (turn_id, player_id, game_id, dice_roll, time) VALUES (1, 1, 1, 7, TIMESTAMP '2026-03-01 10:05:00');
INSERT INTO Turn (turn_id, player_id, game_id, dice_roll, time) VALUES (2, 2, 1, 5, TIMESTAMP '2026-03-01 10:07:00');
INSERT INTO Turn (turn_id, player_id, game_id, dice_roll, time) VALUES (3, 3, 2, 9, TIMESTAMP '2026-03-01 11:35:00');
INSERT INTO Turn (turn_id, player_id, game_id, dice_roll, time) VALUES (4, 4, 2, 6, TIMESTAMP '2026-03-01 11:38:00');
INSERT INTO Turn (turn_id, player_id, game_id, dice_roll, time) VALUES (5, 5, 3, 8, TIMESTAMP '2026-03-02 09:20:00');

-- House (5)
INSERT INTO House (property_id, house_id) VALUES (101, 1);
INSERT INTO House (property_id, house_id) VALUES (102, 1);
INSERT INTO House (property_id, house_id) VALUES (103, 1);
INSERT INTO House (property_id, house_id) VALUES (104, 1);
INSERT INTO House (property_id, house_id) VALUES (105, 1);

-- Card (5)
INSERT INTO Card (card_id, type, description, is_reusable, effect_id) VALUES (1, 'chance',         'Advance to Go',                 'Y', 3);
INSERT INTO Card (card_id, type, description, is_reusable, effect_id) VALUES (2, 'chance',         'Bank pays dividend of 50',     'Y', 1);
INSERT INTO Card (card_id, type, description, is_reusable, effect_id) VALUES (3, 'community chest','Doctor fee pay 50',            'N', 2);
INSERT INTO Card (card_id, type, description, is_reusable, effect_id) VALUES (4, 'chance',         'Go directly to Jail',          'N', 4);
INSERT INTO Card (card_id, type, description, is_reusable, effect_id) VALUES (5, 'community chest','Pay 40 per house for repairs', 'N', 5);

-- Tax_Space (5)
INSERT INTO Tax_Space (space_id, amount) VALUES (1, 200);
INSERT INTO Tax_Space (space_id, amount) VALUES (2, 100);
INSERT INTO Tax_Space (space_id, amount) VALUES (3, 150);
INSERT INTO Tax_Space (space_id, amount) VALUES (4,  75);
INSERT INTO Tax_Space (space_id, amount) VALUES (5, 125);

-- Card_Space (5)
INSERT INTO Card_Space (space_id) VALUES (6);
INSERT INTO Card_Space (space_id) VALUES (7);
INSERT INTO Card_Space (space_id) VALUES (8);
INSERT INTO Card_Space (space_id) VALUES (9);
INSERT INTO Card_Space (space_id) VALUES (10);

-- Corner_Space (5)
INSERT INTO Corner_Space (space_id) VALUES (11);
INSERT INTO Corner_Space (space_id) VALUES (12);
INSERT INTO Corner_Space (space_id) VALUES (13);
INSERT INTO Corner_Space (space_id) VALUES (14);
INSERT INTO Corner_Space (space_id) VALUES (15);

-- Owns (5)
INSERT INTO Owns (property_id, player_id) VALUES (101, 1);
INSERT INTO Owns (property_id, player_id) VALUES (102, 2);
INSERT INTO Owns (property_id, player_id) VALUES (103, 3);
INSERT INTO Owns (property_id, player_id) VALUES (104, 4);
INSERT INTO Owns (property_id, player_id) VALUES (105, 5);

-- CardSpaceDraws (5)
INSERT INTO CardSpaceDraws (space_id, card_id) VALUES (6, 1);
INSERT INTO CardSpaceDraws (space_id, card_id) VALUES (7, 2);
INSERT INTO CardSpaceDraws (space_id, card_id) VALUES (8, 3);
INSERT INTO CardSpaceDraws (space_id, card_id) VALUES (9, 4);
INSERT INTO CardSpaceDraws (space_id, card_id) VALUES (10, 5);

-- Additional properties (multiple per colour for meaningful aggregation/division)
INSERT INTO Property (property_id, colour, cost) VALUES (106, 'Brown',     65);
INSERT INTO Property (property_id, colour, cost) VALUES (107, 'LightBlue', 110);
INSERT INTO Property (property_id, colour, cost) VALUES (108, 'Pink',      150);
INSERT INTO Property (property_id, colour, cost) VALUES (109, 'Orange',    190);
INSERT INTO Property (property_id, colour, cost) VALUES (110, 'Red',       230);
INSERT INTO Property (property_id, colour, cost) VALUES (111, 'Brown',     55);
INSERT INTO Property (property_id, colour, cost) VALUES (112, 'LightBlue', 95);

-- Additional ownership (Alex owns all 5 colour groups; others partial)
INSERT INTO Owns (property_id, player_id) VALUES (107, 1);
INSERT INTO Owns (property_id, player_id) VALUES (108, 1);
INSERT INTO Owns (property_id, player_id) VALUES (109, 1);
INSERT INTO Owns (property_id, player_id) VALUES (110, 1);
INSERT INTO Owns (property_id, player_id) VALUES (106, 2);
INSERT INTO Owns (property_id, player_id) VALUES (111, 3);
INSERT INTO Owns (property_id, player_id) VALUES (112, 4);

-- Additional houses
INSERT INTO House (property_id, house_id) VALUES (106, 1);
INSERT INTO House (property_id, house_id) VALUES (107, 1);
INSERT INTO House (property_id, house_id) VALUES (101, 2);

-- Additional turns (multiple per game for meaningful averages)
INSERT INTO Turn (turn_id, player_id, game_id, dice_roll, time) VALUES (6,  1, 1, 10, TIMESTAMP '2026-03-01 10:10:00');
INSERT INTO Turn (turn_id, player_id, game_id, dice_roll, time) VALUES (7,  2, 1, 4,  TIMESTAMP '2026-03-01 10:12:00');
INSERT INTO Turn (turn_id, player_id, game_id, dice_roll, time) VALUES (8,  3, 2, 11, TIMESTAMP '2026-03-01 11:40:00');
INSERT INTO Turn (turn_id, player_id, game_id, dice_roll, time) VALUES (9,  4, 2, 3,  TIMESTAMP '2026-03-01 11:42:00');
INSERT INTO Turn (turn_id, player_id, game_id, dice_roll, time) VALUES (10, 5, 3, 6,  TIMESTAMP '2026-03-02 09:25:00');

COMMIT;

PROMPT Seed data insertion complete.
