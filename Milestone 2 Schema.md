# Assumptions

1. Board positions are fixed across all games, so position uniquely determines (name, icon).
2. There is one global Bank, so banker uniquely determines bank_id.

# Schema

Bank (bank_id: int, balance: int ( 0), banker: int NOT NULL, money_gained: int ( 0))
PK: bank_id
FK: banker REFERENCES Player(player_id)

Player (player_id: int, name: varchar[20] NOT NULL, balance: int ( 0), position: int (1-40))
PK: player_id
FK: N/A

Turn (turn_id: int, dice_roll: int (2-12), player_id: int, time: datetime NOT NULL)
PK: turn_id
FK: player_id REFERENCES Player(player_id)

Game (game_id: int, status: varchar[20] {active, complete}, start_time: datetime NOT NULL, player_count: int (2-4))
PK: game_id
FK: N/A

Property (property_id: int, colour: varchar[20] NOT NULL, cost: int (> 0), rent: int ( 0))
PK: property_id
FK: colour REFERENCES ColourRent(colour)

House (property_id: int, house_id: int (1-4))
PK: (property_id, house_id)
FK: property_id REFERENCES Property(property_id)

Board_Position (position: int (1-40), name: varchar[20] NOT NULL, icon: char[20])
PK: position
FK: N/A

Space (space_id: int, position: int)
PK: space_id
FK: position REFERENCES Board_Position(position)

Tax Space (space_id: int, amount: int (> 0))
PK: space_id
FK: space_id REFERENCES Space(space_id)

Card Space (space_id: int)
PK: space_id
FK: space_id REFERENCES Space(space_id)

Corner Space (space_id: int)
PK: space_id
FK: space_id REFERENCES Space(space_id)

Card (card_id: int, type: varchar[20] {chance, community chest}, description: text, is_reusable: boolean NOT NULL)
PK: card_id
FK: N/A

Effect (effect_id: int, type: varchar[20] NOT NULL, amount: int, description: text)
PK: effect_id
FK: N/A

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

# Normalization

Property
Original Relation: Property(property_id, colour, cost, rent)
FD: 
- property_id → colour, cost, rent
- colour → rent
Key: PK = property_id
Result: BCNF. No decomposition needed.

Space
Original Relation: Space(space_id, position, name, icon)
FD:
- space_id → position, name, icon
- position → name, icon
Key: PK = space_id
Result: position → name, icon. Position is not primary key; violates BCNF.

Decomposition:
R1(space_id, position)
R2(position, name, icon)
Key:
- PK(R1) = space_id
- PK(R2) = position
- FK(R1.position → R2.position)

Tax Space
Original Relation: Tax_Space(space_id, amount)
FD: space_id → amount
Key: PK = space_id
Result: BCNF. No decomposition needed.

Bank
Original Relation: Bank(bank_id, balance, banker, money_gained)
FD:
- bank_id → balance, banker, money_gained
- banker → bank_id 
Key: 
- PK = bank_id
- CK = banker
Result: BCNF (every determinant is a key). No decomposition needed.

Player:
Original Relation: Player(player_id, name, balance, position)
FD: player_id → name, balance, position
Key: PK = player_id
Result: BCNF. No decomposition needed.

Turn
Original Relation: Turn(turn_id, dice_roll, player_id, time)
FD: turn_id → dice_roll, player_id, time
Key: PK = turn_id
Result: BCNF. No decomposition needed.

Game
Original Relation: Game(game_id, status, start_time, player_count)
FD: game_id → status, start_time, player_count
Key: PK = game_id
Result: BCNF. No decomposition needed.

House
Original Relation: House(property_id, house_id)
FD: Only key-based (trivial omitted).
Key: PK = (property_id, house_id)
Result: BCNF. No decomposition needed.

Card Space
Original Relation: Card_Space(space_id)
FD: Only key-based (trivial omitted).
Key: PK = space_id
Result: BCNF. No decomposition needed.

Corner Space	
Original Relation: Corner_Space(space_id)
FD: Only key-based (trivial omitted).
Key: PK = space_id
Result: BCNF. No decomposition needed.

Card
Original Relation: Card(card_id, type, description, is_reusable)
FD: card_id → type, description, is_reusable
Key: PK = card_id
Result: BCNF. No decomposition needed.

Effect
Original Relation: Effect(effect_id, type, amount, description)
FD: effect_id → type, amount, description
Key: PK = effect_id
Result: BCNF. No decomposition needed.