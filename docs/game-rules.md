# Game rules

Poker Finance plays standard **No-Limit Texas Hold'em**.

## Table

- Six seats: you plus five firm bots.
- USD table: $1 small blind, $2 big blind, $200 starting stack (100 big blinds).
- The dealer button moves one seat clockwise each hand, skipping empty seats.

## A hand

1. **Blinds.** The two players left of the dealer post the small and big blind. Heads-up, the dealer posts the small blind.
2. **Deal.** Everyone gets two private cards, one at a time, starting left of the dealer.
3. **Pre-flop betting** starts left of the big blind (heads-up: with the dealer).
4. **Flop:** burn one card, deal three shared cards, betting round.
5. **Turn:** burn, one card, betting round.
6. **River:** burn, one card, betting round.
7. **Showdown:** players still in reveal. The best five-card hand from each player's two cards plus the five shared cards wins.

After the flop, betting starts with the first player left of the dealer who is still in.

## Actions

| Action      | When                                        |
| ----------- | ------------------------------------------- |
| Fold        | Facing a bet. You give up the hand.         |
| Check       | Nobody has bet this round.                  |
| Call        | Match the current bet.                      |
| Bet / Raise | Put in more. Amounts are "raise to" totals. |
| All-in      | Bet everything you have.                    |

## Betting limits

- The minimum opening bet is the big blind.
- A raise must be at least the size of the previous full raise.
- You can always go all-in, even for less than a full raise.
- An all-in for less than a full raise does **not** reopen betting for players who have already acted. They can only call or fold.
- You cannot raise if everyone else is already all-in.

## Pots

- If one player is all-in for less, a **side pot** is created for the extra chips. Players can only win pots they paid into.
- A bet nobody can match is returned to its owner.
- Ties split the pot. Odd chips go to the first winner clockwise from the dealer.
- If everyone but one player folds, that player wins without showing.
- If betting is closed (everyone but one player is all-in), the remaining cards are dealt automatically.

## Hand rankings (best first)

1. Straight flush (royal flush is the ace-high one)
2. Four of a kind
3. Full house
4. Flush
5. Straight (A-2-3-4-5 is the lowest)
6. Three of a kind
7. Two pair
8. One pair
9. High card

Kickers break ties in the usual way.

## Busting

- A bot that loses all its chips is **liquidated** and a new firm takes the seat with a fresh stack.
- If you bust, you see your report card and can rebuy for another starting stack.

## Not in v0.1

Antes, straddles, time banks, tournaments and multiplayer. See [roadmap.md](roadmap.md).
