# Architecture

Poker Finance v0.1 is a client-only single-page app. Everything runs in the player's browser; Vercel only serves static files.

```
┌──────────────────────────── Browser ────────────────────────────┐
│                                                                  │
│  ui/  (React)                                                    │
│   Lobby ─▶ TableView ──▶ Seat, ActionBar, Sidebar, ReportCard    │
│                │                                                 │
│                ▼ useSession (timers for bot turns)               │
│  game/session.ts   stacks · dealer button · bot memory · stats   │
│        │                 │                    │                  │
│        ▼                 ▼                    ▼                  │
│  engine/ (pure)     bots/                currency/               │
│   hand.ts            botBrain.ts           currencies.ts         │
│   pots.ts            archetypes.ts         format.ts             │
│   handEvaluator.ts   firms.ts                                    │
│   equity.ts          deskNotes.ts                                │
│   rng.ts, deck.ts    opponentModel.ts                            │
└──────────────────────────────────────────────────────────────────┘
```

## Layers

### `src/engine/` — the rules of poker

Pure TypeScript with no React, DOM or global randomness.

| File               | Responsibility                                                                              |
| ------------------ | ------------------------------------------------------------------------------------------- |
| `cards.ts`         | Card encoding (integer 0–51), parsing and labels                                            |
| `rng.ts`           | Seeded PRNG (mulberry32), shuffle, helpers                                                  |
| `deck.ts`          | Deck creation and shuffling                                                                 |
| `handEvaluator.ts` | Scores the best 5-card hand from 5–7 cards into one comparable integer; plain-English names |
| `equity.ts`        | Monte Carlo equity and pot odds                                                             |
| `pots.ts`          | Main and side pot construction                                                              |
| `hand.ts`          | The hand state machine: `startHand`, `legalActions`, `applyAction`                          |
| `types.ts`         | Shared types                                                                                |

`applyAction` never mutates its input. It returns a new `HandState`, which keeps React rendering simple and makes every hand replayable in tests.

**Key rules implemented:** heads-up blind order, minimum raise equal to the last full raise, short all-ins that do not reopen raising, side pots built layer by layer, uncalled bets returned, odd chips to the first winner left of the dealer, automatic run-out when betting is closed.

### `src/bots/` — the opponents

| File               | Responsibility                                                                         |
| ------------------ | -------------------------------------------------------------------------------------- |
| `archetypes.ts`    | Six trading styles and their nine-dial `StrategyProfile`                               |
| `firms.ts`         | The 37-firm roster, per-firm tweaks, fictional aliases                                 |
| `botBrain.ts`      | `decide()`: turns equity, pot odds, profile and context into an action plus a `Reason` |
| `deskNotes.ts`     | Maps reasons to educational notes                                                      |
| `opponentModel.ts` | Stats the bots learn about the human player                                            |

See [bot-strategies.md](bot-strategies.md) for the decision logic.

### `src/currency/`

The engine only handles integers in a currency's minor units. `currencies.ts` holds every currency's code, decimals, locale, blinds, starting stack and release. `format.ts` formats money with `Intl.NumberFormat`. See [currencies.md](currencies.md).

### `src/game/session.ts`

A `Session` owns everything that lasts longer than one hand: seats and stacks, the dealer button, bot memory (peak stack, recent results), the opponent model, desk notes, table events (liquidations) and report-card stats. It also replaces busted bots with firms from a shuffled bench.

### `src/ui/`

React 19 function components. `useSession` wraps a `Session`, re-renders on change, and runs bot turns on a short random timer so the table feels human. No router and no state library: the app has two views (lobby and table) and a few modals.

## Data flow for one action

1. `TableView` shows `ActionBar` when `session.isHumanTurn()`.
2. The player clicks Call. `useSession.act()` calls `session.humanAct()`.
3. `Session` records the action in the opponent model, then calls `applyAction()`.
4. If the hand finished, `Session.finishHand()` updates stacks, memory, stats, notes and liquidations.
5. `useSession` bumps a version counter, React re-renders, and the bot-turn effect schedules the next bot.

## Determinism

All randomness (shuffles, bot dice rolls, Monte Carlo trials) comes from one seeded `Rng` per session. Given the same seed and the same human actions, a session replays exactly. This underpins tests and the planned daily challenge.

## Performance

The evaluator uses rank bitmasks and runs well over a million evaluations per second in a modern browser. A bot decision uses 300–400 Monte Carlo trials (a few milliseconds); the player's win-chance display uses 1,500 and is memoised per street.

## Testing

`tests/` uses Vitest:

- `handEvaluator.test.ts` — every category and tie-break
- `equity.test.ts` — known equities (AA ≈ 85% heads-up, 72o ≈ 35%)
- `hand.test.ts` — blinds, raise rules, short all-ins, side pots, split pots, chip conservation
- `bots.test.ts` — roster integrity and archetype behaviour
- `currency.test.ts` — registry and formatting
- `simulation.test.ts` — 600+ full hands end to end, plus archetype play-rate checks

## Where things will go

Planned additions (see [roadmap.md](roadmap.md)) slot into this structure: a `src/api/` folder for leaderboards, `src/game/dailySeed.ts` for daily challenges and a separate `server/` for multiplayer. The engine stays shared and pure.
