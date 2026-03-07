University of British Columbia, Vancouver  
Department of Computer Science  

---

# CPSC 304 Project Cover Page

**Milestone:** 2  
**Date:** February 25th, 2026  
**Group Number:** 119  

| Name | Student # | CS Alias | Preferred Email |
|-----|-----|-----|-----|
| Katrina Wei | 11890225 | p6c6v | katrinawei05@gmail.com |
| Kevin Xu | 55195432 | c1a6u | xukevin2005@gmail.com |
| Daniel Zhou | 11504941 | n6e8p | danielzhou.nc@gmail.com |

By typing our names and student numbers in the above table, we certify that the work in the attached assignment was performed solely by those whose names and student IDs are included above.

In addition, we indicate that we are fully aware of the rules and consequences of plagiarism, as set forth by the Department of Computer Science and the University of British Columbia.

---

# Project Summary

Our project models a complete game session of Monopoly, tracking players, turns, board spaces, property ownership, and financial transactions to accurately reflect Monopoly rules and gameplay. It stores the current game state and historical events, allowing a game session to be tracked and reviewed.

---

# Database and Programming Language

We will use the department-provided Oracle database and implement the application using JavaScript with React for the frontend and Node.js for the server.

---

# ER Diagram

![ER Diagram](er_diagram.png)

*House_id should be dash underlined*

---

# Schema

Bank (bank_id: int, balance: int (≥ 0), banker: int, money_gained: int (≥ 0))

- banker NOT NULL  
- PK: bank_id  
- FK: banker REFERENCES Player(player_id)

Player (player_id: int, name: char[20], balance: int (≥ 0), position: int (1-40))

- name NOT NULL  
- PK: player_id

Turn (turn_id: int, dice_roll: int (2-12), player_id: int, time: datetime)

- time NOT NULL  
- PK: turn_id  
- FK: player_id REFERENCES Player(player_id)

Game (game_id: int, status: char[20], start_time: datetime, player_count: int (2-4))

- start_time NOT NULL  
- status NOT NULL  
- status ∈ {active, complete}  
- PK: game_id

Property (property_id: int, colour: char[20], cost: int (> 0), rent: int (≥ 0))

- colour NOT NULL  
- PK: property_id  
- FK: colour REFERENCES ColourRent(colour)

House (property_id: int, house_id: int (1-4))

- PK: (property_id, house_id)  
- FK: property_id REFERENCES Property(property_id)

Board_Position (position: int (1-40), name: char[20], icon: char[20])

- name NOT NULL  
- PK: position

Space (space_id: int, position: int)

- PK: space_id  
- FK: position REFERENCES Board_Position(position)

Tax Space (space_id: int, amount: int (> 0))

- PK: space_id  
- FK: space_id REFERENCES Space(space_id)

Card Space (space_id: int)

- PK: space_id  
- FK: space_id REFERENCES Space(space_id)

Corner Space (space_id: int)

- PK: space_id  
- FK: space_id REFERENCES Space(space_id)

Card (card_id: int, type: char[20], description: text, is_reusable: boolean)

- type NOT NULL  
- type ∈ {chance, community chest}  
- is_reusable NOT NULL  
- PK: card_id

Effect (effect_id: int, type: char[20], amount: int, description: text)

- type NOT NULL  
- PK: effect_id

---

# Assumptions

A1) Board positions are fixed across all games, so position uniquely determines (name, icon).  
A2) There is one global Bank, so banker uniquely determines bank_id.

---

# Functional Dependencies

bank_id → balance, banker, money_gained  
banker → bank_id  
player_id → name, balance, position  
turn_id → dice_roll, player_id, time  
property_id → colour, cost, rent  
space_id → position, name, icon  
position → name, icon  
space_id → amount  
card_id → type, description, is_reusable  
effect_id → type, amount, description  

---

# Normalization

## 1. Property

Original Relation: Property(property_id, colour, cost, rent)

FDs:  
property_id → colour, cost, rent  
colour → rent  

Key: PK = property_id  

Result: BCNF. No decomposition needed.

---

## 2. Space

Original Relation: Space(space_id, position, name, icon)

FDs:  
space_id → position, name, icon  
position → name, icon  

Key: PK = space_id  

Violation: position → name, icon (not a key)

Decomposition:

R1(space_id, position)  
R2(position, name, icon)

Keys:

PK(R1) = space_id  
PK(R2) = position  
FK(R1.position → R2.position)

---

## 3. Tax Space

Original Relation: Tax_Space(space_id, amount)

FD:  
space_id → amount

Key: PK = space_id

Result: BCNF. No decomposition needed.

---

## 4. Bank

Original Relation: Bank(bank_id, balance, banker, money_gained)

FDs:  
bank_id → balance, banker, money_gained  
banker → bank_id  

Keys: PK = bank_id, CK = banker  

Result: BCNF. No decomposition needed.

---

## 5. Player

Original Relation: Player(player_id, name, balance, position)

FDs:  
player_id → name, balance, position  

Key: PK = player_id

Result: BCNF. No decomposition needed.

---

## 6. Turn

Original Relation: Turn(turn_id, dice_roll, player_id, time)

FDs:  
turn_id → dice_roll, player_id, time  

Key: PK = turn_id

Result: BCNF. No decomposition needed.

---

## 7. Game

Original Relation: Game(game_id, status, start_time, player_count)

FDs:  
game_id → status, start_time, player_count  

Key: PK = game_id

Result: BCNF. No decomposition needed.

---

## 8. House

Original Relation: House(property_id, house_id)

FDs: key-based only

Key: PK = (property_id, house_id)

Result: BCNF. No decomposition needed.

---

## 9. Card Space

Original Relation: Card_Space(space_id)

FDs: key-based only

Key: PK = space_id

Result: BCNF. No decomposition needed.

---

## 10. Corner Space

Original Relation: Corner_Space(space_id)

FDs: key-based only

Key: PK = space_id

Result: BCNF. No decomposition needed.

---

## 11. Card

Original Relation: Card(card_id, type, description, is_reusable)

FDs:  
card_id → type, description, is_reusable  

Key: PK = card_id

Result: BCNF. No decomposition needed.

---

## 12. Effect

Original Relation: Effect(effect_id, type, amount, description)

FDs:  
effect_id → type, amount, description  

Key: PK = effect_id

Result: BCNF. No decomposition needed.

---

# SQL DDL

```sql
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

```

(continue the rest of your SQL exactly as written in your document)

---

# AI Acknowledgement

No AI was used for the making assignment. Some was used to help understand concepts and reinforce ideas. We used chatgpt.

https://chatgpt.com/share/69a11bc9-5c8c-8005-a2d2-353cc251743c