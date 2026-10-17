# Roadmap

Target: a polished public game live well before the DMU Quant Society launch in February 2027.

## v0.1 — Launch build (October 2026) ✅

- No-Limit Hold'em engine with side pots
- 37 firm bots across 6 archetypes
- Desk notes, firm profiles, how-to-play, report card, LinkedIn sharing
- USD
- Vercel hosting, CI, documentation

## v0.2 — First currency wave (November 2026)

- EUR, GBP, JPY, CNY, INR tables
- Currency picker enabled in the lobby
- Remember the player's last currency
- Files: `src/currency/currencies.ts`, `src/ui/Lobby.tsx`, `tests/currency.test.ts`, `docs/currencies.md`

## v0.3 — All major currencies (December 2026)

- CHF, CAD, AUD, NZD, HKD, SGD, KRW, SEK, NOK, AED, SAR, BRL, MXN, ZAR
- Optional FX table with reference rates
- Files: `src/currency/fxRates.ts`, `src/ui/FxTable.tsx`

## v0.4 — Learn mode (January 2027)

- Hints before each decision ("a market maker would fold here because…")
- Hand replayer with equity at every street
- Firm encyclopedia page with archetype deep-dives
- Files: `src/ui/LearnMode.tsx`, `src/ui/HandReplay.tsx`, `src/ui/Encyclopedia.tsx`, more notes in `src/bots/deskNotes.ts`

## v0.5 — Leaderboard (February 2027, launch month)

- Optional accounts and a global leaderboard (Supabase)
- Society members' leaderboard for the launch event
- Privacy notice and updated security policy
- Files: `src/api/`, `docs/privacy.md`, `docs/adr/0007-leaderboard-backend.md`

## v0.6 — Daily challenge

- Same seeded deck for everyone each day; compare results
- Files: `src/game/dailySeed.ts`, `src/ui/DailyChallenge.tsx`

## v1.0 — Multiplayer

- Live tables for society socials and events, humans and bots mixed
- Files: `server/` (WebSocket game server reusing `src/engine/`), `docs/adr/0008-multiplayer.md`

## Ongoing

- New firms proposed by members via the "New firm bot" issue template
- Tournament mode for society events
- Accessibility improvements (screen reader announcements for each action)
- Translations alongside currency rollout (Hindi, Gujarati, Mandarin, Japanese, Spanish, French, German)

## Ideas backlog

- Options-pricing mini-game between hands
- "Regime" events that change every bot's behaviour (rate hike, flash crash)
- Bot vs bot spectator mode with commentary
- Export a session as a CSV for analysis in Python
