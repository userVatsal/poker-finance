import type { Rng } from '../engine/rng';
import type { ArchetypeId } from './archetypes';
import type { Reason } from './botBrain';

/**
 * Desk notes: short explanations of the finance idea behind a bot's move.
 * This is the educational heart of the game.
 */
export interface DeskNote {
  concept: string;
  text: string;
}

type Template = { concept: string; text: (firm: string) => string };

const NOTES: Partial<Record<Reason, Template>> = {
  spread_raise: {
    concept: 'Earning the spread',
    text: (f) =>
      `${f} raised small. Market makers make money on volume: lots of small, positive-edge trades rather than a few big bets. Small raises win small pots often.`,
  },
  open_raise: {
    concept: 'Taking the initiative',
    text: (f) =>
      `${f} opened with a raise. Raising first gives two ways to win: everyone folds now, or it has the stronger hand later.`,
  },
  value_raise: {
    concept: 'Value betting',
    text: (f) =>
      `${f} raised for value. With a strong hand, the goal is to get paid by worse hands, the way a trader adds to a position that is working.`,
  },
  value_bet: {
    concept: 'Value betting',
    text: (f) =>
      `${f} bet because its hand is likely ahead. Checking a strong hand gives away free cards, like leaving money on the table.`,
  },
  kelly_raise: {
    concept: 'Kelly criterion',
    text: (f) =>
      `${f} sized its bet with a Kelly-style rule: the bigger the estimated edge, the bigger the bet, and never more than its edge justifies. Quant funds size positions the same way.`,
  },
  conviction_bet: {
    concept: 'High-conviction bets',
    text: (f) =>
      `${f} bet big. Global macro funds trade rarely but size up hard when they are confident about the big picture. Few positions, large size.`,
  },
  momentum_raise: {
    concept: 'Momentum',
    text: (f) =>
      `${f} is on a winning run and is pressing it with bigger bets. Trend followers add to what has been working and cut what has not.`,
  },
  call_odds: {
    concept: 'Pot odds',
    text: (f) =>
      `${f} called because the price was right: its estimated chance of winning beats the share of the final pot it has to pay. Same logic as buying an option that is cheap relative to its payoff.`,
  },
  fold_pressure: {
    concept: 'Inventory risk',
    text: (f) =>
      `${f} folded a hand that was arguably worth a call. A big bet looks like informed flow, and a careful desk would rather give up a small edge than carry a large risky position.`,
  },
  capital_limit: {
    concept: 'Capital requirements',
    text: (f) =>
      `${f} hit its risk limit. Regulated and risk-managed firms must hold capital against positions, so they cap how much they put at risk on one trade, even a good one.`,
  },
  stop_loss: {
    concept: 'Drawdown limits',
    text: (f) =>
      `${f} is down past its drawdown limit and has tightened up. Multi-strategy funds cut a team's risk when it loses too much from its peak.`,
  },
  bluff: {
    concept: 'Bluffing and fold equity',
    text: (f) =>
      `${f} bet with a weak hand. A bluff only needs you to fold often enough to be profitable. That chance of an instant win is called fold equity.`,
  },
  exploit_bluff: {
    concept: 'Exploiting a pattern',
    text: (f) =>
      `${f} noticed you fold to bets a lot and bluffed into you. Quant models hunt for repeatable patterns in other players' behaviour. Mix up your play so you are harder to model.`,
  },
};

/** Moves worth explaining at most a fraction of the time, so notes stay interesting. */
const FREQUENCY: Partial<Record<Reason, number>> = {
  spread_raise: 0.35,
  open_raise: 0.2,
  value_raise: 0.5,
  value_bet: 0.35,
  kelly_raise: 0.45,
  conviction_bet: 0.6,
  momentum_raise: 0.6,
  call_odds: 0.2,
  fold_pressure: 0.6,
  capital_limit: 0.9,
  stop_loss: 0.9,
  bluff: 0.4,
  exploit_bluff: 1,
};

export function deskNoteFor(reason: Reason, firmName: string, rng: Rng): DeskNote | null {
  const t = NOTES[reason];
  if (!t) return null;
  if (rng() > (FREQUENCY[reason] ?? 0)) return null;
  return { concept: t.concept, text: t.text(firmName) };
}

/** Bluffs are revealed only at showdown, so the live note for a bluff stays neutral. */
export function isHiddenReason(reason: Reason): boolean {
  return reason === 'bluff' || reason === 'exploit_bluff';
}

export const ARCHETYPE_SIGNATURE: Record<ArchetypeId, Reason[]> = {
  'market-maker': ['spread_raise', 'fold_pressure'],
  'stat-arb': ['kelly_raise', 'exploit_bluff'],
  macro: ['conviction_bet'],
  'multi-strat': ['stop_loss'],
  trend: ['momentum_raise'],
  bank: ['capital_limit'],
};
