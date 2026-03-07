PROMPT Verifying row counts for Milestone 3...

SELECT 'Game' AS table_name, COUNT(*) AS row_count FROM Game;
SELECT 'Effect' AS table_name, COUNT(*) AS row_count FROM Effect;
SELECT 'ColourRent' AS table_name, COUNT(*) AS row_count FROM ColourRent;
SELECT 'Board_Position' AS table_name, COUNT(*) AS row_count FROM Board_Position;
SELECT 'Space' AS table_name, COUNT(*) AS row_count FROM Space;
SELECT 'Property' AS table_name, COUNT(*) AS row_count FROM Property;
SELECT 'Player' AS table_name, COUNT(*) AS row_count FROM Player;
SELECT 'PlayerGame' AS table_name, COUNT(*) AS row_count FROM PlayerGame;
SELECT 'Bank' AS table_name, COUNT(*) AS row_count FROM Bank;
SELECT 'Turn' AS table_name, COUNT(*) AS row_count FROM Turn;
SELECT 'House' AS table_name, COUNT(*) AS row_count FROM House;
SELECT 'Card' AS table_name, COUNT(*) AS row_count FROM Card;
SELECT 'Tax_Space' AS table_name, COUNT(*) AS row_count FROM Tax_Space;
SELECT 'Card_Space' AS table_name, COUNT(*) AS row_count FROM Card_Space;
SELECT 'Corner_Space' AS table_name, COUNT(*) AS row_count FROM Corner_Space;
SELECT 'Owns' AS table_name, COUNT(*) AS row_count FROM Owns;
SELECT 'CardSpaceDraws' AS table_name, COUNT(*) AS row_count FROM CardSpaceDraws;

PROMPT Sample join checks...

SELECT p.name, pr.property_id, pr.colour, pr.cost
FROM Owns o
JOIN Player p ON o.player_id = p.player_id
JOIN Property pr ON o.property_id = pr.property_id
ORDER BY p.player_id;

SELECT t.turn_id, p.name, t.game_id, t.dice_roll, t.time
FROM Turn t
JOIN Player p ON t.player_id = p.player_id
ORDER BY t.turn_id;

PROMPT Verification complete.
