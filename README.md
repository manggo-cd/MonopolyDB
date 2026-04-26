# Monopoly

A browser-based, single-device hot-seat Monopoly game. Pure static site — no backend, no database.

- 2–8 players, classic 40-square US board
- Full ruleset: dice + doubles, jail, Chance & Community Chest, taxes, rent, monopolies, even build/sell, mortgage with 10% interest, trading, bankruptcy, win condition
- Hot-seat: pass the device between players
- Persists in `localStorage`; resume from the home screen, archive finished games

## Run locally

```bash
npm run dev
```

Then open http://localhost:3000.

`npm run dev` is just a convenience for `npx serve public -l 3000` — any static file server (or even just opening `public/index.html`) works, but using a server avoids browser quirks with ES modules over `file://`.

## Deploy to Vercel

This repo ships ready to deploy as a static site:

- `vercel.json` declares `outputDirectory: public` and no build command.
- `public/` is a self-contained static site.

To deploy:

1. Push this repo to GitHub (it lives at `manggo-cd/MonopolyDB`).
2. Go to https://vercel.com/new and import the repo.
3. Accept the auto-detected settings — Vercel will pick up `vercel.json` automatically.
4. Click Deploy. Subsequent pushes to `main` redeploy automatically.

## Project layout

```
public/
  index.html          home / setup screen
  play.html           game screen (board, sidebar, action panel)
  css/
    home.css          setup styles
    board.css         board grid + tiles + animations
    components.css    sidebar / panels / modals
  js/
    engine/           pure game logic (no DOM, no storage)
      board.js        40-square board data, prices, rents
      cards.js        Chance + Community Chest decks
      state.js        GameState factory
      rules.js        rent, monopoly, jail, doubles, bankruptcy helpers
      engine.js       public API (newGame, rollDice, buyProperty, ...)
      persist.js      localStorage save/load
    ui/
      tokens.js       shared token registry
      home.js         setup form
      play.js         game-screen orchestrator
      boardView.js    11×11 grid renderer
      sidebar.js      players + log
      actionPanel.js  roll / buy / end-turn / jail / trade buttons
      propertyModal.js property card + build/sell/mortgage actions
      tradeModal.js   two-step trade flow
      cardModal.js    Chance / Community Chest draw modal
      endGameModal.js winner banner + standings
      sound.js        WebAudio blips
  archive/            old CPSC 304 milestone pages (no longer functional, kept for posterity)
```

## Game rules implemented

- Movement, dice doubles (extra turn, third double goes to jail).
- Buying unowned properties / railroads / utilities; pay rent if owned (incl. mortgage = no rent).
- Color-group monopoly rent doubling.
- Railroad rent: $25/$50/$100/$200 by count owned.
- Utility rent: 4× or 10× dice (or 10× when triggered by Chance card).
- Houses & hotels with even-build & even-sell uniformity, bank inventory of 32 houses / 12 hotels.
- Mortgage 50% list, unmortgage at 10% interest (rounded up).
- Chance + Community Chest full standard decks; Get Out of Jail Free cards stay with the player and return to the deck on use.
- Jail: pay $50 / use card / roll for doubles, 3-turn limit; "Go To Jail" square; speeding (3 doubles).
- Income Tax ($200) and Luxury Tax ($100). Optional Free Parking jackpot house rule.
- Trading: cash + properties + GOOJF cards both directions; rejects trading properties from improved color groups.
- Bankruptcy: assets transfer to the creditor (or revert to the bank if owed to the bank).
- Win condition: last solvent player.

## Future hooks (not implemented yet)

- Auctions on decline-to-buy.
- Networked multiplayer. The engine is intentionally pure (every action takes a `GameState` and returns a new one), so a Vercel serverless route or a small relay could call the same engine for multi-device play.
- AI opponents.

## License

MIT
