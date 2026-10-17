# Currencies

## Design

- The engine only works with **integers in minor units** (cents, pence, paise; yen and won have none). Floating-point money is never used.
- Each currency is one entry in `src/currency/currencies.ts`: ISO code, name, symbol, decimals, formatting locale, blinds, starting stack, status and release.
- Every table starts at **100 big blinds**, so the game plays the same in every currency. A test enforces this.
- Formatting uses the browser's `Intl.NumberFormat`. Whole amounts drop decimals ("$12"), fractional ones keep them ("$12.50").

Turning a currency on is a one-line change: set `status: 'live'`.

## Rollout

| Release | Currencies                                                           | Status                  |
| ------- | -------------------------------------------------------------------- | ----------------------- |
| v0.1    | USD                                                                  | Live                    |
| v0.2    | EUR, GBP, JPY, CNY, INR                                              | Configured, not enabled |
| v0.3    | CHF, CAD, AUD, NZD, HKD, SGD, KRW, SEK, NOK, AED, SAR, BRL, MXN, ZAR | Configured, not enabled |

## Stakes

| Code                    | Blinds          | Starting stack |
| ----------------------- | --------------- | -------------- |
| USD                     | $1 / $2         | $200           |
| EUR                     | €1 / €2         | €200           |
| GBP                     | £1 / £2         | £200           |
| JPY                     | ¥100 / ¥200     | ¥20,000        |
| CNY                     | ¥5 / ¥10        | ¥1,000         |
| INR                     | ₹50 / ₹100      | ₹10,000        |
| CHF, CAD, AUD, NZD, SGD | 1 / 2           | 200            |
| HKD, SEK, NOK           | 10 / 20         | 2,000          |
| KRW                     | ₩1,000 / ₩2,000 | ₩200,000       |
| AED, SAR, BRL           | 5 / 10          | 1,000          |
| MXN, ZAR                | 20 / 40         | 4,000          |

Stakes are chosen to be round, familiar numbers in each currency, not exact FX conversions.

## Checklist for enabling a currency

1. Set `status: 'live'` in `currencies.ts`.
2. Check blinds and stack read naturally to a local player.
3. Update the "v0.1 ships USD only" test in `tests/currency.test.ts`.
4. Play a session and check formatting on desktop and mobile.
5. Add a `CHANGELOG.md` entry.

## Later: FX tables (v0.3)

An optional table where players buy in with different currencies and chips convert at reference rates. That needs:

- `src/currency/fxRates.ts` with dated reference rates (static at first; a live feed would need a backend).
- A leaderboard normalised to USD.
- Clear labelling that rates are illustrative.
