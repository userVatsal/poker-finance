/**
 * Trading archetypes and the poker personalities derived from them.
 *
 * Every bot is described by the same nine dials (`StrategyProfile`). An
 * archetype sets the defaults; individual firms nudge them (see firms.ts).
 * docs/bot-strategies.md explains the reasoning behind each number.
 */

export type ArchetypeId = 'market-maker' | 'stat-arb' | 'macro' | 'multi-strat' | 'trend' | 'bank';

export type Sizing = 'small' | 'standard' | 'large' | 'kelly';

export interface StrategyProfile {
  /** 0–1. Share of hands it is willing to play. Poker players call this VPIP. */
  looseness: number;
  /** 0–1. When it continues, how often it raises rather than calls. */
  aggression: number;
  /** 0–1. How often it bets or raises with a weak hand. */
  bluff: number;
  /** How it sizes bets. `kelly` scales size with its edge. */
  sizing: Sizing;
  /** Max share of its starting stack it will risk in one hand without a very strong hand. 1 = no limit. */
  riskLimit: number;
  /** Drawdown from its peak stack that makes it tighten up. 1 = never. */
  stopLoss: number;
  /** 0–1. How much it adapts to your tendencies. */
  adaptivity: number;
  /** −1 to 1. Positive = plays bigger after winning, smaller after losing. */
  momentum: number;
  /** 0–1. Extra willingness to fold to large bets, even with a reasonable hand. */
  pressureFold: number;
}

export interface Archetype {
  id: ArchetypeId;
  name: string;
  /** One-line summary for seat badges. */
  tag: string;
  /** How this kind of firm makes money, in plain English. */
  trading: string;
  /** How that turns into poker behaviour. */
  poker: string;
  /** The finance idea players should take away. */
  lesson: string;
  /** CSS variable for the archetype colour. */
  color: string;
  profile: StrategyProfile;
}

export const ARCHETYPES: Record<ArchetypeId, Archetype> = {
  'market-maker': {
    id: 'market-maker',
    name: 'Market maker / HFT',
    tag: 'Tight spreads',
    trading:
      'Quotes a price to buy and a price to sell almost all the time, and earns the small gap between them (the spread) over a huge number of trades. Keeps inventory small, because holding a big position is risk it is not paid for.',
    poker:
      'Plays lots of hands with small bets and small raises, picking up many little pots. Backs off quickly when someone pushes a big bet at it, the way a market maker widens or pulls its quotes when flow looks informed.',
    lesson: 'Small edge, high volume, strict inventory limits.',
    color: 'var(--arch-mm)',
    profile: {
      looseness: 0.62,
      aggression: 0.45,
      bluff: 0.12,
      sizing: 'small',
      riskLimit: 0.45,
      stopLoss: 1,
      adaptivity: 0.3,
      momentum: 0,
      pressureFold: 0.75,
    },
  },
  'stat-arb': {
    id: 'stat-arb',
    name: 'Quant / stat-arb fund',
    tag: 'Pure expected value',
    trading:
      'Builds statistical models from large amounts of data and trades whatever has a positive expected return, often sizing positions by how strong the edge is. Constantly re-fits models as the market changes.',
    poker:
      'Decides almost purely on equity versus pot odds, sizes bets with a Kelly-style rule, and learns your habits during the session. If you fold too often, it starts bluffing you more.',
    lesson: 'Expected value, position sizing and adapting to data.',
    color: 'var(--arch-quant)',
    profile: {
      looseness: 0.45,
      aggression: 0.55,
      bluff: 0.18,
      sizing: 'kelly',
      riskLimit: 1,
      stopLoss: 1,
      adaptivity: 0.9,
      momentum: 0,
      pressureFold: 0.2,
    },
  },
  macro: {
    id: 'macro',
    name: 'Global macro fund',
    tag: 'Big conviction',
    trading:
      'Takes large positions on big-picture views: interest rates, currencies, inflation, the economic cycle. Trades less often, but bets big when it is confident the regime is changing.',
    poker:
      'Folds most hands, then makes large bets and overbets when it likes its spot. Rarely backs down once committed.',
    lesson: 'Concentrated, high-conviction bets on a few big ideas.',
    color: 'var(--arch-macro)',
    profile: {
      looseness: 0.05,
      aggression: 0.85,
      bluff: 0.22,
      sizing: 'large',
      riskLimit: 1,
      stopLoss: 1,
      adaptivity: 0.3,
      momentum: 0.1,
      pressureFold: 0.1,
    },
  },
  'multi-strat': {
    id: 'multi-strat',
    name: 'Multi-strategy pod shop',
    tag: 'Hard stop-loss',
    trading:
      'Runs many independent trading teams ("pods") with strict risk limits. A team that loses past its drawdown limit has its capital cut or is shut down.',
    poker:
      'Solid, balanced poker until it loses about a quarter of its peak stack. Then it tightens sharply and stops bluffing, exactly like a pod that has hit its drawdown limit.',
    lesson: 'Drawdown limits and risk management.',
    color: 'var(--arch-pod)',
    profile: {
      looseness: 0.38,
      aggression: 0.55,
      bluff: 0.12,
      sizing: 'standard',
      riskLimit: 0.6,
      stopLoss: 0.25,
      adaptivity: 0.5,
      momentum: 0,
      pressureFold: 0.4,
    },
  },
  trend: {
    id: 'trend',
    name: 'Trend follower (CTA)',
    tag: 'Momentum',
    trading:
      'Systematically buys what has been rising and sells what has been falling, across futures markets. Lets winners run and cuts losers.',
    poker:
      'Plays bigger and looser after a winning streak, smaller and tighter after losses. Ride its hot streaks carefully.',
    lesson: 'Momentum: recent winners tend to keep winning, until they do not.',
    color: 'var(--arch-trend)',
    profile: {
      looseness: 0.42,
      aggression: 0.5,
      bluff: 0.12,
      sizing: 'standard',
      riskLimit: 1,
      stopLoss: 1,
      adaptivity: 0.2,
      momentum: 0.8,
      pressureFold: 0.3,
    },
  },
  bank: {
    id: 'bank',
    name: 'Investment bank',
    tag: 'Capital limits',
    trading:
      'Trades mainly to serve clients, under strict capital rules set by regulators, and with limits on trading purely for its own profit. Has to hold capital against risky positions.',
    poker:
      'Conservative. Rarely bluffs, and will not put more than a set share of its stack at risk in one hand unless it holds a monster.',
    lesson: 'Capital requirements make regulated players cautious.',
    color: 'var(--arch-bank)',
    profile: {
      looseness: 0.32,
      aggression: 0.3,
      bluff: 0.04,
      sizing: 'standard',
      riskLimit: 0.3,
      stopLoss: 0.5,
      adaptivity: 0.2,
      momentum: 0,
      pressureFold: 0.55,
    },
  },
};

export const ARCHETYPE_ORDER: ArchetypeId[] = [
  'market-maker',
  'stat-arb',
  'macro',
  'multi-strat',
  'trend',
  'bank',
];
