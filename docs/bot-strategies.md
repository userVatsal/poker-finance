# Bot strategies

How Poker Finance turns trading styles into poker players.

> These are caricatures built from public, general descriptions of each kind of firm. They are not any firm's real strategy.

## The nine dials

Every bot has a `StrategyProfile` (`src/bots/archetypes.ts`):

| Dial           | Range                            | Meaning                                                                              |
| -------------- | -------------------------------- | ------------------------------------------------------------------------------------ |
| `looseness`    | 0–1                              | Share of hands it is willing to play (poker "VPIP")                                  |
| `aggression`   | 0–1                              | When continuing, how often it raises instead of calling                              |
| `bluff`        | 0–1                              | How often it bets or raises with a weak hand                                         |
| `sizing`       | small / standard / large / kelly | How it sizes bets                                                                    |
| `riskLimit`    | 0–1                              | Max share of its starting stack it risks in one hand without a monster. 1 = no limit |
| `stopLoss`     | 0–1                              | Drawdown from peak that triggers tightening. 1 = never                               |
| `adaptivity`   | 0–1                              | How much it exploits your tendencies                                                 |
| `momentum`     | −1–1                             | Positive: plays bigger after wins, smaller after losses                              |
| `pressureFold` | 0–1                              | Extra willingness to fold to large bets                                              |

Archetypes set defaults; firms apply small tweaks (`src/bots/firms.ts`).

## Archetype defaults

| Archetype          | loose | aggr | bluff | sizing   | risk | stop | adapt | mom | pressure |
| ------------------ | ----- | ---- | ----- | -------- | ---- | ---- | ----- | --- | -------- |
| Market maker / HFT | 0.62  | 0.45 | 0.12  | small    | 0.45 | –    | 0.30  | 0   | 0.75     |
| Quant / stat-arb   | 0.45  | 0.55 | 0.18  | kelly    | –    | –    | 0.90  | 0   | 0.20     |
| Global macro       | 0.05  | 0.85 | 0.22  | large    | –    | –    | 0.30  | 0.1 | 0.10     |
| Multi-strategy     | 0.38  | 0.55 | 0.12  | standard | 0.60 | 0.25 | 0.50  | 0   | 0.40     |
| Trend follower     | 0.42  | 0.50 | 0.12  | standard | –    | –    | 0.20  | 0.8 | 0.30     |
| Investment bank    | 0.32  | 0.30 | 0.04  | standard | 0.30 | 0.50 | 0.20  | 0   | 0.55     |

## Why each mapping

**Market makers** earn the bid–ask spread across huge volume and keep inventory small. In poker: play many hands, raise small, and fold to big bets (large size from someone else looks like informed flow).

**Quant / stat-arb funds** trade any positive expected value and size by edge. In poker: decide on equity versus pot odds, size with half-Kelly, and adapt quickly to the human's patterns.

**Global macro funds** take few, large, high-conviction positions. In poker: very tight, then big bets and overbets with strong hands, rarely backing down.

**Multi-strategy pod shops** run teams under strict drawdown limits. In poker: solid until down 25% from peak, then tighten sharply and almost stop bluffing.

**Trend followers** buy what is rising and cut what is falling. In poker: looser and bigger after recent wins, tighter and smaller after losses.

**Investment banks** trade mostly for clients under capital rules and limits on proprietary trading. In poker: conservative, rarely bluff, and cap how much of their stack they risk in one hand.

## The decision (`decide()` in `src/bots/botBrain.ts`)

1. **Equity.** Monte Carlo win chance against the players still in (300 trials pre-flop, 400 after).
2. **Relative strength.** `rel = equity / (1 / (opponents + 1))`. Above 1 means better than an average hand at this table.
3. **Effective profile.** Start from the firm profile, then apply:
   - **Stop-loss:** if drawdown from peak ≥ `stopLoss`, halve looseness, cut aggression by 30% and bluffing by 75%.
   - **Momentum:** recent net results (last four hands, scaled by starting stack) shift looseness, aggression and bet size by `momentum`.
   - **Adaptivity:** if you fold to more than 55% of bets, bluff frequency rises by `adaptivity × (rate − 0.45)`. If you are aggressive (over 45% of your actions are raises), the bot folds less to your pressure.
4. **Play threshold.** `lerp(1.5, 0.72, looseness)` in relative strength.
5. **Facing no bet:** value-bet strong hands (equity ≥ 58% or rel ≥ 1.6) with probability `0.3 + 0.6 × aggression`; otherwise bluff with probability `bluff` (more heads-up).
6. **Facing a bet:**
   - Pre-flop: continue if `rel ≥ threshold × (1 + pressure)`, where pressure grows with the raise size and `pressureFold`.
   - Post-flop: continue if `equity ≥ pot odds + margin`, where the margin grows with bet size and `pressureFold`.
   - Monsters (equity ≥ 80%, or rel ≥ 2.5 pre-flop) always continue.
   - Strong hands raise with probability `aggression` (+25% for monsters).
   - Otherwise an occasional bluff-raise heads-up, else fold.
7. **Sizing.**
   - Pre-flop opens: 2.2 / 3 / 3.8 / 2.5 big blinds (small / standard / large / kelly) plus one big blind per limper.
   - Post-flop: 40% / 66% / 100% of the pot; kelly scales 35–120% with equity; macro overbets 125% with strong hands.
   - Momentum multiplies size. Anything over 85% of the stack becomes all-in.
8. **Risk checks.**
   - **Capital limit:** committing more than `riskLimit × starting stack` without a monster is downgraded to a call, check or fold.
   - **Half-Kelly cap:** kelly bots commit at most `(2 × equity − 1) / 2` of their stack (between 8% and 50%).
9. **Reason.** Every decision returns a `Reason` used for desk notes.

## Desk notes

`src/bots/deskNotes.ts` maps reasons to short explanations: earning the spread, pot odds, Kelly criterion, high-conviction bets, momentum, inventory risk, capital requirements, drawdown limits, bluffing and fold equity, exploiting a pattern.

To avoid leaking information, notes about bets and calls are **held until the hand ends**. Notes about folds appear immediately. Each firm gets at most one note per hand, and repeated concepts within a hand are skipped.

## Measured behaviour

`npm run simulate` plays hundreds of bot-only hands and prints how often each archetype voluntarily plays pre-flop. Typical results:

| Archetype          | Hands played |
| ------------------ | ------------ |
| Market maker / HFT | ~42%         |
| Trend follower     | ~27%         |
| Quant / stat-arb   | ~25%         |
| Investment bank    | ~23%         |
| Multi-strategy     | ~21%         |
| Global macro       | ~16%         |

The simulation test fails if market makers stop playing more hands than macro funds and banks.

## Tuning a bot

1. Change a dial in `archetypes.ts` (all firms of that type) or a `tweaks` entry in `firms.ts` (one firm).
2. Run `npm run simulate` and compare.
3. Play a few sessions to check it feels right.
4. Open a pull request with the before and after numbers.
