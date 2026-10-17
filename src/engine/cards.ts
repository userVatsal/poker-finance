/**
 * Card representation.
 *
 * A card is an integer 0–51. This keeps the hand evaluator fast enough to run
 * thousands of Monte Carlo trials in the browser.
 *
 *   rank = (card >> 2) + 2   → 2..14 (14 = ace)
 *   suit = card & 3          → 0 spades, 1 hearts, 2 diamonds, 3 clubs
 */
export type Card = number;

export type Suit = 0 | 1 | 2 | 3;

export const RANK_CHARS = '23456789TJQKA';
export const SUIT_CHARS = 'shdc';
export const SUIT_SYMBOLS = ['♠', '♥', '♦', '♣'] as const;
export const SUIT_NAMES = ['spades', 'hearts', 'diamonds', 'clubs'] as const;

export const RANK_NAMES: Record<number, string> = {
  2: 'two',
  3: 'three',
  4: 'four',
  5: 'five',
  6: 'six',
  7: 'seven',
  8: 'eight',
  9: 'nine',
  10: 'ten',
  11: 'jack',
  12: 'queen',
  13: 'king',
  14: 'ace',
};

export const RANK_PLURALS: Record<number, string> = {
  2: 'twos',
  3: 'threes',
  4: 'fours',
  5: 'fives',
  6: 'sixes',
  7: 'sevens',
  8: 'eights',
  9: 'nines',
  10: 'tens',
  11: 'jacks',
  12: 'queens',
  13: 'kings',
  14: 'aces',
};

export const rankOf = (card: Card): number => (card >> 2) + 2;
export const suitOf = (card: Card): Suit => (card & 3) as Suit;

export function makeCard(rank: number, suit: Suit): Card {
  if (rank < 2 || rank > 14) throw new Error(`Invalid rank ${rank}`);
  return ((rank - 2) << 2) | suit;
}

/** "As" → ace of spades, "Td" → ten of diamonds. */
export function parseCard(text: string): Card {
  if (text.length !== 2) throw new Error(`Invalid card "${text}"`);
  const rank = RANK_CHARS.indexOf(text[0]!.toUpperCase()) + 2;
  const suit = SUIT_CHARS.indexOf(text[1]!.toLowerCase());
  if (rank < 2 || suit < 0) throw new Error(`Invalid card "${text}"`);
  return makeCard(rank, suit as Suit);
}

export function parseCards(text: string): Card[] {
  return text.trim().split(/\s+/).filter(Boolean).map(parseCard);
}

export function cardToString(card: Card): string {
  return RANK_CHARS[rankOf(card) - 2]! + SUIT_CHARS[suitOf(card)]!;
}

/** Display label, e.g. "A♠", "10♥". */
export function cardLabel(card: Card): { rank: string; suit: string; red: boolean } {
  const r = rankOf(card);
  const rank = r === 10 ? '10' : RANK_CHARS[r - 2]!;
  const s = suitOf(card);
  return { rank, suit: SUIT_SYMBOLS[s], red: s === 1 || s === 2 };
}
