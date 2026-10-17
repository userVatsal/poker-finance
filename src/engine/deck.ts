import type { Card } from './cards';
import { shuffle, type Rng } from './rng';

export function createDeck(): Card[] {
  return Array.from({ length: 52 }, (_, i) => i);
}

export function shuffledDeck(rng: Rng): Card[] {
  return shuffle(createDeck(), rng);
}

/** Every card not in `used`. */
export function remainingCards(used: readonly Card[]): Card[] {
  const taken = new Set(used);
  return createDeck().filter((c) => !taken.has(c));
}
