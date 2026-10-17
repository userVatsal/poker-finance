# 0005. Integer minor units for all money

- Status: Accepted
- Date: 2026-10-17

## Context

The game will support 20 currencies with different decimal places (USD 2, JPY 0). Floating-point arithmetic produces errors like `0.1 + 0.2 = 0.30000000000000004`, which would break pot splitting and chip conservation.

## Decision

The engine stores every amount as an integer in the currency's minor units (cents, pence, paise, yen). Conversion to and from display amounts happens only in `src/currency/`. Bets are rounded to the small blind.

## Consequences

- Chip totals are exact; tests assert conservation across hundreds of hands.
- Adding a currency never touches the engine.
- Odd chips in split pots are handled explicitly (first winner left of the dealer).
