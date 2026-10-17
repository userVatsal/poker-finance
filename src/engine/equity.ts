import type { Card } from './cards';
import { remainingCards } from './deck';
import { evaluate } from './handEvaluator';
import type { Rng } from './rng';

/**
 * Monte Carlo equity: the share of the pot a hand wins on average against
 * `opponents` random hands, given the board so far. Ties count fractionally.
 *
 * This is the same idea as a quant pricing an option by simulating paths:
 * deal out the unknown cards many times and average the result.
 */
export function estimateEquity(
  hole: readonly Card[],
  board: readonly Card[],
  opponents: number,
  iterations: number,
  rng: Rng,
): number {
  if (hole.length !== 2) throw new Error('Hole must be two cards');
  if (opponents < 1) return 1;

  const stub = remainingCards([...hole, ...board]);
  const need = 5 - board.length + opponents * 2;
  if (need > stub.length) throw new Error('Not enough cards for that many opponents');

  const pool = stub.slice();
  const fullBoard = new Array<Card>(5);
  for (let i = 0; i < board.length; i++) fullBoard[i] = board[i]!;
  const mine = new Array<Card>(7);
  const theirs = new Array<Card>(7);

  let total = 0;
  for (let it = 0; it < iterations; it++) {
    // Partial Fisher–Yates: only shuffle as many cards as we need.
    for (let i = 0; i < need; i++) {
      const j = i + Math.floor(rng() * (pool.length - i));
      const tmp = pool[i]!;
      pool[i] = pool[j]!;
      pool[j] = tmp;
    }
    let k = 0;
    for (let i = board.length; i < 5; i++) fullBoard[i] = pool[k++]!;

    mine[0] = hole[0]!;
    mine[1] = hole[1]!;
    for (let i = 0; i < 5; i++) mine[i + 2] = fullBoard[i]!;
    const myScore = evaluate(mine);

    let tiedWithMe = 0;
    let beaten = false;
    for (let o = 0; o < opponents; o++) {
      theirs[0] = pool[k++]!;
      theirs[1] = pool[k++]!;
      for (let i = 0; i < 5; i++) theirs[i + 2] = fullBoard[i]!;
      const s = evaluate(theirs);
      if (s > myScore) {
        beaten = true;
        break;
      }
      if (s === myScore) tiedWithMe++;
    }
    if (!beaten) total += 1 / (tiedWithMe + 1);
  }
  return total / iterations;
}

/** Break-even equity needed to call: toCall / (pot + toCall). */
export function potOdds(toCall: number, pot: number): number {
  if (toCall <= 0) return 0;
  return toCall / (pot + toCall);
}
