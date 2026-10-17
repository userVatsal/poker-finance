import { rankOf, suitOf, RANK_NAMES, RANK_PLURALS, type Card } from './cards';

/**
 * Hand categories, weakest to strongest.
 */
export const Category = {
  HighCard: 0,
  Pair: 1,
  TwoPair: 2,
  Trips: 3,
  Straight: 4,
  Flush: 5,
  FullHouse: 6,
  Quads: 7,
  StraightFlush: 8,
} as const;
export type Category = (typeof Category)[keyof typeof Category];

export const CATEGORY_NAMES = [
  'High card',
  'Pair',
  'Two pair',
  'Three of a kind',
  'Straight',
  'Flush',
  'Full house',
  'Four of a kind',
  'Straight flush',
] as const;

/**
 * Packs a category and up to five tie-break ranks into one integer.
 * Higher score = better hand, so hands compare with plain `>`.
 *
 *   score = category << 20 | r1 << 16 | r2 << 12 | r3 << 8 | r4 << 4 | r5
 */
function pack(category: number, ranks: number[]): number {
  let score = category << 20;
  for (let i = 0; i < 5; i++) score |= (ranks[i] ?? 0) << (16 - i * 4);
  return score;
}

export const categoryOf = (score: number): Category => (score >> 20) as Category;

/** Highest card of a 5-in-a-row run inside a rank bitmask, or 0. Handles the A-2-3-4-5 wheel. */
function straightHigh(mask: number): number {
  let m = mask;
  if (m & (1 << 14)) m |= 1 << 1; // ace can play low
  for (let high = 14; high >= 5; high--) {
    const run = 0b11111 << (high - 4);
    if ((m & run) === run) return high;
  }
  return 0;
}

/** Top `n` ranks set in a bitmask, highest first. */
function topRanks(mask: number, n: number): number[] {
  const out: number[] = [];
  for (let r = 14; r >= 2 && out.length < n; r--) if (mask & (1 << r)) out.push(r);
  return out;
}

/**
 * Scores the best five-card hand from 5–7 cards.
 */
export function evaluate(cards: readonly Card[]): number {
  if (cards.length < 5 || cards.length > 7) {
    throw new Error(`evaluate() needs 5–7 cards, got ${cards.length}`);
  }

  const rankCounts = new Array<number>(15).fill(0);
  const suitCounts = [0, 0, 0, 0];
  const suitMasks = [0, 0, 0, 0];
  let rankMask = 0;

  for (const c of cards) {
    const r = rankOf(c);
    const s = suitOf(c);
    rankCounts[r]!++;
    suitCounts[s]!++;
    suitMasks[s]! |= 1 << r;
    rankMask |= 1 << r;
  }

  // Flush and straight flush
  let flushMask = 0;
  for (let s = 0; s < 4; s++) if (suitCounts[s]! >= 5) flushMask = suitMasks[s]!;
  if (flushMask) {
    const sf = straightHigh(flushMask);
    if (sf) return pack(Category.StraightFlush, [sf]);
  }

  // Group ranks by count, highest rank first
  const quads: number[] = [];
  const trips: number[] = [];
  const pairs: number[] = [];
  const singles: number[] = [];
  for (let r = 14; r >= 2; r--) {
    const n = rankCounts[r]!;
    if (n === 4) quads.push(r);
    else if (n === 3) trips.push(r);
    else if (n === 2) pairs.push(r);
    else if (n === 1) singles.push(r);
  }

  if (quads.length) {
    const q = quads[0]!;
    const kicker = topRanks(rankMask & ~(1 << q), 1);
    return pack(Category.Quads, [q, ...kicker]);
  }

  if (trips.length && (trips.length > 1 || pairs.length)) {
    const t = trips[0]!;
    const pairCandidates = [...trips.slice(1), ...pairs].sort((a, b) => b - a);
    return pack(Category.FullHouse, [t, pairCandidates[0]!]);
  }

  if (flushMask) return pack(Category.Flush, topRanks(flushMask, 5));

  const st = straightHigh(rankMask);
  if (st) return pack(Category.Straight, [st]);

  if (trips.length) {
    const t = trips[0]!;
    return pack(Category.Trips, [t, ...topRanks(rankMask & ~(1 << t), 2)]);
  }

  if (pairs.length >= 2) {
    const [p1, p2] = pairs as [number, number];
    const kicker = topRanks(rankMask & ~(1 << p1) & ~(1 << p2), 1);
    return pack(Category.TwoPair, [p1, p2, ...kicker]);
  }

  if (pairs.length === 1) {
    const p = pairs[0]!;
    return pack(Category.Pair, [p, ...topRanks(rankMask & ~(1 << p), 3)]);
  }

  return pack(Category.HighCard, singles.slice(0, 5));
}

const rankAt = (score: number, i: number) => (score >> (16 - i * 4)) & 0xf;

/** Plain-English name, e.g. "Two pair, kings and sevens". */
export function describeHand(score: number): string {
  const cat = categoryOf(score);
  const r1 = rankAt(score, 0);
  const r2 = rankAt(score, 1);
  switch (cat) {
    case Category.StraightFlush:
      return r1 === 14 ? 'Royal flush' : `Straight flush, ${RANK_NAMES[r1]} high`;
    case Category.Quads:
      return `Four of a kind, ${RANK_PLURALS[r1]}`;
    case Category.FullHouse:
      return `Full house, ${RANK_PLURALS[r1]} full of ${RANK_PLURALS[r2]}`;
    case Category.Flush:
      return `Flush, ${RANK_NAMES[r1]} high`;
    case Category.Straight:
      return `Straight, ${RANK_NAMES[r1]} high`;
    case Category.Trips:
      return `Three of a kind, ${RANK_PLURALS[r1]}`;
    case Category.TwoPair:
      return `Two pair, ${RANK_PLURALS[r1]} and ${RANK_PLURALS[r2]}`;
    case Category.Pair:
      return `Pair of ${RANK_PLURALS[r1]}`;
    default:
      return `High card, ${RANK_NAMES[r1]}`;
  }
}
