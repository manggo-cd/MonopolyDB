PROMPT Creating Monopoly schema tables...

-- Game
CREATE TABLE Game (
    game_id NUMBER PRIMARY KEY,
    status VARCHAR2(20) NOT NULL CHECK (status IN ('active', 'complete')),
    start_time TIMESTAMP NOT NULL,
    player_count NUMBER NOT NULL CHECK (player_count BETWEEN 2 AND 4)
);

-- Effect
CREATE TABLE Effect (
    effect_id NUMBER PRIMARY KEY,
    type VARCHAR2(20) NOT NULL,
    amount NUMBER,
    description CLOB
);

-- ColourRent
CREATE TABLE ColourRent (
    colour VARCHAR2(20) PRIMARY KEY,
    rent NUMBER NOT NULL CHECK (rent >= 0)
);

-- Board_Position
CREATE TABLE Board_Position (
    position NUMBER PRIMARY KEY CHECK (position BETWEEN 1 AND 40),
    name VARCHAR2(20) NOT NULL,
    icon VARCHAR2(20)
);

-- Space
CREATE TABLE Space (
    space_id NUMBER PRIMARY KEY,
    position NUMBER NOT NULL UNIQUE,
    CONSTRAINT fk_space_position
        FOREIGN KEY (position)
        REFERENCES Board_Position(position)
        ON DELETE CASCADE
);

-- Property
CREATE TABLE Property (
    property_id NUMBER PRIMARY KEY,
    colour VARCHAR2(20) NOT NULL,
    cost NUMBER NOT NULL CHECK (cost > 0),
    CONSTRAINT fk_property_colour
        FOREIGN KEY (colour)
        REFERENCES ColourRent(colour)
);

-- Player
CREATE TABLE Player (
    player_id NUMBER PRIMARY KEY,
    name VARCHAR2(20) NOT NULL,
    balance NUMBER NOT NULL CHECK (balance >= 0),
    position NUMBER NOT NULL,
    CONSTRAINT fk_player_position
        FOREIGN KEY (position)
        REFERENCES Board_Position(position)
);

-- PlayerGame
CREATE TABLE PlayerGame (
    player_id NUMBER NOT NULL,
    game_id NUMBER NOT NULL,
    CONSTRAINT pk_playergame PRIMARY KEY (player_id, game_id),
    CONSTRAINT fk_pg_player
        FOREIGN KEY (player_id)
        REFERENCES Player(player_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_pg_game
        FOREIGN KEY (game_id)
        REFERENCES Game(game_id)
        ON DELETE CASCADE
);

-- Bank
CREATE TABLE Bank (
    bank_id NUMBER PRIMARY KEY,
    balance NUMBER NOT NULL CHECK (balance >= 0),
    banker NUMBER UNIQUE,
    money_gained NUMBER NOT NULL CHECK (money_gained >= 0),
    CONSTRAINT fk_bank_banker
        FOREIGN KEY (banker)
        REFERENCES Player(player_id)
        ON DELETE SET NULL
);

-- Turn
CREATE TABLE Turn (
    turn_id NUMBER PRIMARY KEY,
    player_id NUMBER NOT NULL,
    game_id NUMBER NOT NULL,
    dice_roll NUMBER NOT NULL CHECK (dice_roll BETWEEN 2 AND 12),
    time TIMESTAMP NOT NULL,
    CONSTRAINT fk_turn_pg
        FOREIGN KEY (player_id, game_id)
        REFERENCES PlayerGame(player_id, game_id)
        ON DELETE CASCADE
);

-- House
CREATE TABLE House (
    property_id NUMBER NOT NULL,
    house_id NUMBER NOT NULL CHECK (house_id BETWEEN 1 AND 4),
    CONSTRAINT pk_house PRIMARY KEY (property_id, house_id),
    CONSTRAINT fk_house_property
        FOREIGN KEY (property_id)
        REFERENCES Property(property_id)
        ON DELETE CASCADE
);

-- Card
CREATE TABLE Card (
    card_id NUMBER PRIMARY KEY,
    type VARCHAR2(20) NOT NULL CHECK (type IN ('chance', 'community chest')),
    description CLOB,
    is_reusable CHAR(1) NOT NULL CHECK (is_reusable IN ('Y', 'N')),
    effect_id NUMBER NOT NULL,
    CONSTRAINT fk_card_effect
        FOREIGN KEY (effect_id)
        REFERENCES Effect(effect_id)
        ON DELETE CASCADE
);

-- Tax_Space
CREATE TABLE Tax_Space (
    space_id NUMBER PRIMARY KEY,
    amount NUMBER NOT NULL CHECK (amount > 0),
    CONSTRAINT fk_tax_space
        FOREIGN KEY (space_id)
        REFERENCES Space(space_id)
        ON DELETE CASCADE
);

-- Card_Space
CREATE TABLE Card_Space (
    space_id NUMBER PRIMARY KEY,
    CONSTRAINT fk_card_space
        FOREIGN KEY (space_id)
        REFERENCES Space(space_id)
        ON DELETE CASCADE
);

-- Corner_Space
CREATE TABLE Corner_Space (
    space_id NUMBER PRIMARY KEY,
    CONSTRAINT fk_corner_space
        FOREIGN KEY (space_id)
        REFERENCES Space(space_id)
        ON DELETE CASCADE
);

-- Owns
CREATE TABLE Owns (
    property_id NUMBER PRIMARY KEY,
    player_id NUMBER NOT NULL,
    CONSTRAINT fk_owns_property
        FOREIGN KEY (property_id)
        REFERENCES Property(property_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_owns_player
        FOREIGN KEY (player_id)
        REFERENCES Player(player_id)
        ON DELETE CASCADE
);

-- CardSpaceDraws
CREATE TABLE CardSpaceDraws (
    space_id NUMBER NOT NULL,
    card_id NUMBER NOT NULL,
    CONSTRAINT pk_cardspacedraws PRIMARY KEY (space_id, card_id),
    CONSTRAINT fk_csd_space
        FOREIGN KEY (space_id)
        REFERENCES Card_Space(space_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_csd_card
        FOREIGN KEY (card_id)
        REFERENCES Card(card_id)
        ON DELETE CASCADE
);

PROMPT Schema creation complete.
