/**
 * What the bots learn about YOU during a session.
 *
 * Adaptive bots (quant funds especially) read these stats the way a quant
 * desk reads order flow: if you fold to bets too often, they bluff more;
 * if you raise a lot, they call you down lighter.
 */
export interface OpponentModel {
  hands: number;
  /** Hands where you voluntarily put chips in before the flop. */
  vpipHands: number;
  /** Hands where you raised before the flop. */
  pfrHands: number;
  betsFaced: number;
  foldsToBet: number;
  aggressiveActions: number;
  passiveActions: number;
}

export const emptyModel = (): OpponentModel => ({
  hands: 0,
  vpipHands: 0,
  pfrHands: 0,
  betsFaced: 0,
  foldsToBet: 0,
  aggressiveActions: 0,
  passiveActions: 0,
});

const MIN_SAMPLE = 5;

/** Share of bets you fold to, or null until there is enough data. */
export function foldToBetRate(m: OpponentModel): number | null {
  return m.betsFaced >= MIN_SAMPLE ? m.foldsToBet / m.betsFaced : null;
}

/** Share of your bets/raises among bets, raises and calls, or null until there is enough data. */
export function aggressionRate(m: OpponentModel): number | null {
  const total = m.aggressiveActions + m.passiveActions;
  return total >= MIN_SAMPLE ? m.aggressiveActions / total : null;
}

export function vpipRate(m: OpponentModel): number | null {
  return m.hands >= MIN_SAMPLE ? m.vpipHands / m.hands : null;
}

/** A plain-English read of your style, used on the report card. */
export function describePlayer(m: OpponentModel): string {
  const vpip = vpipRate(m);
  const agg = aggressionRate(m);
  if (vpip === null || agg === null) return 'Not enough hands to read your style yet.';
  const loose = vpip > 0.35;
  const aggressive = agg > 0.4;
  if (loose && aggressive)
    return 'Loose-aggressive: you play lots of hands and bet them hard. A high-volatility strategy.';
  if (loose)
    return 'Loose-passive: you see lots of flops but rarely take control. Bots will value-bet you thinly.';
  if (aggressive)
    return 'Tight-aggressive: selective and forceful. This is the style most professionals aim for.';
  return 'Tight-passive: careful and low-risk. Adaptive bots will try to steal pots from you.';
}
