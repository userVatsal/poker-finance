import type { PlayerState, Pot } from './types';

/**
 * Splits the chips players put in into a main pot and side pots.
 *
 * Works level by level: every distinct contribution amount creates a layer,
 * and only players who are still in AND paid up to that layer can win it.
 * An uncalled top layer naturally becomes a pot only its owner can win,
 * which is how unmatched bets get returned.
 */
export function buildPots(players: readonly PlayerState[]): Pot[] {
  const levels = [...new Set(players.map((p) => p.totalBet).filter((b) => b > 0))].sort(
    (a, b) => a - b,
  );

  const pots: Pot[] = [];
  let previous = 0;
  let dead = 0;
  for (const level of levels) {
    let amount = 0;
    for (const p of players) amount += Math.min(p.totalBet, level) - Math.min(p.totalBet, previous);
    const eligible = players
      .map((p, i) => (!p.folded && p.totalBet >= level ? i : -1))
      .filter((i) => i >= 0);
    previous = level;
    if (amount === 0) continue;

    const last = pots[pots.length - 1];
    if (eligible.length === 0) {
      // Only folded players reached this layer: their dead money joins the pot below.
      if (last) last.amount += amount;
      else dead += amount;
      continue;
    }
    if (last && sameMembers(last.eligible, eligible)) {
      last.amount += amount;
    } else {
      pots.push({ amount: amount + dead, eligible, winners: [] });
      dead = 0;
    }
  }
  return pots;
}

function sameMembers(a: number[], b: number[]): boolean {
  return a.length === b.length && a.every((x, i) => x === b[i]);
}

export function totalPot(players: readonly PlayerState[]): number {
  return players.reduce((sum, p) => sum + p.totalBet, 0);
}
