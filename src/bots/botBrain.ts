import { estimateEquity, potOdds } from '../engine/equity';
import { legalActions, pot } from '../engine/hand';
import type { Rng } from '../engine/rng';
import type { HandState, PlayerAction } from '../engine/types';
import type { ArchetypeId, StrategyProfile } from './archetypes';
import { aggressionRate, foldToBetRate, type OpponentModel } from './opponentModel';

/**
 * Why a bot did what it did. Drives the "desk notes" that explain the
 * trading idea behind a move.
 */
export type Reason =
  | 'open_raise'
  | 'spread_raise'
  | 'value_raise'
  | 'value_bet'
  | 'kelly_raise'
  | 'conviction_bet'
  | 'momentum_raise'
  | 'call_odds'
  | 'check'
  | 'fold_weak'
  | 'fold_pressure'
  | 'capital_limit'
  | 'stop_loss'
  | 'bluff'
  | 'exploit_bluff';

export interface BotMemory {
  /** Stack when the session (or this bot's seat) started. */
  startStack: number;
  /** Highest stack it has reached. */
  peakStack: number;
  /** Net chips won or lost in its recent hands, newest last. */
  recentResults: number[];
}

export interface BotContext {
  hand: HandState;
  archetype: ArchetypeId;
  profile: StrategyProfile;
  memory: BotMemory;
  opponent: OpponentModel;
  rng: Rng;
  /** Monte Carlo trials for equity. */
  iterations?: number;
}

export interface BotDecision {
  action: PlayerAction;
  reason: Reason;
  equity: number;
  potOdds: number;
}

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Adjusts the base profile for how the bot is doing and what it has learned about you. */
export function effectiveProfile(ctx: BotContext): {
  profile: StrategyProfile;
  tightened: boolean;
  sizeMultiplier: number;
  exploiting: boolean;
} {
  const base = ctx.profile;
  const p = { ...base };
  const me = ctx.hand.players[ctx.hand.toAct]!;
  const stackNow = me.stack + me.totalBet;

  // Stop-loss: a drawdown past the limit makes it tighten up.
  const drawdown =
    ctx.memory.peakStack > 0 ? (ctx.memory.peakStack - stackNow) / ctx.memory.peakStack : 0;
  const tightened = drawdown >= base.stopLoss;
  if (tightened) {
    p.looseness *= 0.5;
    p.aggression *= 0.7;
    p.bluff *= 0.25;
  }

  // Momentum: recent results push it looser and bigger (or tighter and smaller).
  const recent = ctx.memory.recentResults.slice(-4).reduce((a, b) => a + b, 0);
  const trend = clamp((recent / Math.max(1, ctx.memory.startStack)) * 4, -1, 1);
  const m = base.momentum * trend;
  p.looseness = clamp(p.looseness + 0.18 * m, 0.05, 0.95);
  p.aggression = clamp(p.aggression + 0.2 * m, 0.05, 0.95);
  const sizeMultiplier = clamp(1 + 0.6 * m, 0.6, 1.6);

  // Adaptivity: exploit what it has learned about the human, if they are still in the hand.
  let exploiting = false;
  const humanIn = ctx.hand.players.some((q) => q.isHuman && !q.folded);
  if (humanIn) {
    const ftb = foldToBetRate(ctx.opponent);
    if (ftb !== null && ftb > 0.55) {
      p.bluff = clamp(p.bluff + base.adaptivity * (ftb - 0.45), 0, 0.6);
      exploiting = base.adaptivity >= 0.5;
    }
    const agg = aggressionRate(ctx.opponent);
    if (agg !== null && agg > 0.45) {
      // You raise a lot, so your raises mean less: fold less to pressure.
      p.pressureFold = clamp(p.pressureFold - base.adaptivity * 0.4, 0, 1);
    }
  }

  return { profile: p, tightened, sizeMultiplier, exploiting };
}

function roundTo(amount: number, step: number): number {
  return Math.max(step, Math.round(amount / step) * step);
}

/**
 * The bot's decision. Deterministic for a given rng, so sessions replay exactly.
 */
export function decide(ctx: BotContext): BotDecision {
  const { hand, rng } = ctx;
  const idx = hand.toAct;
  const me = hand.players[idx]!;
  const legal = legalActions(hand);
  const opponents = hand.players.filter((p, i) => i !== idx && !p.folded).length;
  const iterations = ctx.iterations ?? (hand.street === 'preflop' ? 300 : 400);
  const equity = estimateEquity(me.hole, hand.board, opponents, iterations, rng);
  const potSize = pot(hand);
  const toCall = legal.callAmount;
  const odds = potOdds(toCall, potSize);
  const fair = 1 / (opponents + 1);
  const rel = equity / fair; // >1 means better than an average hand at this table
  const preflop = hand.street === 'preflop';
  const bb = hand.bigBlind;
  const step = hand.smallBlind;

  const { profile, tightened, sizeMultiplier, exploiting } = effectiveProfile(ctx);
  const playThreshold = lerp(1.5, 0.72, profile.looseness);
  const strong = preflop ? rel >= playThreshold * 1.6 : equity >= 0.62 || rel >= 2;
  const monster = equity >= 0.8 || (preflop && rel >= 2.5);

  const out = (action: PlayerAction, reason: Reason): BotDecision => ({
    action,
    reason,
    equity,
    potOdds: odds,
  });

  // --- Sizing ---------------------------------------------------------------
  function raiseTarget(isBluff: boolean): number {
    let to: number;
    if (preflop && hand.currentBet <= bb) {
      const mult = { small: 2.2, standard: 3, large: 3.8, kelly: 2.5 }[profile.sizing];
      to = bb * mult + opponentsLimped() * bb;
    } else {
      let fraction = { small: 0.4, standard: 0.66, large: 1.0, kelly: 0.5 }[profile.sizing];
      if (profile.sizing === 'kelly' && !isBluff)
        fraction = clamp(0.35 + (equity - 0.5) * 2.2, 0.35, 1.2);
      if (profile.sizing === 'large' && strong) fraction = 1.25; // overbet with conviction
      // Pot-sized raise maths: call first, then raise a fraction of the new pot.
      to = hand.currentBet + (potSize + toCall) * fraction;
    }
    to *= sizeMultiplier;
    to = roundTo(to, step);
    to = clamp(to, legal.minRaiseTo, legal.maxRaiseTo);
    // If the raise is most of the stack, just go all-in.
    if (to >= legal.maxRaiseTo * 0.85) to = legal.maxRaiseTo;
    return to;
  }

  function opponentsLimped(): number {
    return hand.players.filter(
      (p, i) => i !== idx && !p.folded && p.streetBet === bb && i !== hand.bbIndex,
    ).length;
  }

  // --- Risk checks ------------------------------------------------------------
  // Capital / drawdown style limit: never commit more than riskLimit x starting stack without a monster.
  const riskCap = profile.riskLimit * ctx.memory.startStack;
  const exceedsRisk = (committedAfter: number) => !monster && committedAfter > riskCap;

  function raiseOrDowngrade(isBluff: boolean, reason: Reason): BotDecision {
    let to = raiseTarget(isBluff);
    // Half-Kelly: commit at most (2p - 1) / 2 of the stack on this hand.
    if (profile.sizing === 'kelly' && !monster && !isBluff) {
      const kellyCap = clamp((2 * equity - 1) / 2, 0.08, 0.5) * (me.stack + me.totalBet);
      const capTo = roundTo(kellyCap - me.totalBet + me.streetBet, step);
      to = clamp(Math.min(to, capTo), legal.minRaiseTo, legal.maxRaiseTo);
    }
    const committedAfter = me.totalBet + (to - me.streetBet);
    if (exceedsRisk(committedAfter)) {
      if (legal.canCheck) return out({ type: 'check' }, 'capital_limit');
      if (!exceedsRisk(me.totalBet + toCall)) return out({ type: 'call' }, 'capital_limit');
      return out({ type: 'fold' }, 'capital_limit');
    }
    return out({ type: 'raise', amount: to }, reason);
  }

  const valueReason = (): Reason => {
    if (ctx.archetype === 'market-maker') return 'spread_raise';
    if (ctx.archetype === 'stat-arb') return 'kelly_raise';
    if (ctx.archetype === 'macro') return 'conviction_bet';
    if (ctx.archetype === 'trend' && sizeMultiplier > 1.15) return 'momentum_raise';
    return legal.canCheck ? 'value_bet' : 'value_raise';
  };

  // --- Nobody has bet: check or bet -------------------------------------------
  if (legal.canCheck) {
    if (preflop) {
      // Big blind option after limps.
      if (legal.canRaise && rel >= playThreshold * 1.3 && rng() < profile.aggression)
        return raiseOrDowngrade(false, valueReason());
      return out({ type: 'check' }, 'check');
    }
    const valueBet = equity >= 0.58 || rel >= 1.6;
    if (legal.canRaise && valueBet && rng() < 0.3 + profile.aggression * 0.6)
      return raiseOrDowngrade(false, valueReason());
    const bluffChance = profile.bluff * (opponents === 1 ? 1.3 : 0.6);
    if (legal.canRaise && !valueBet && rng() < bluffChance) {
      return raiseOrDowngrade(true, exploiting ? 'exploit_bluff' : 'bluff');
    }
    return out({ type: 'check' }, 'check');
  }

  // --- Facing a bet --------------------------------------------------------------
  let shouldContinue: boolean;
  let wouldContinueIgnoringPressure: boolean;
  if (preflop) {
    const raisedBBs = Math.max(0, hand.currentBet / bb - 1);
    const pressure = profile.pressureFold * Math.min(1.5, raisedBBs / 6);
    const priceIsGreat = equity >= odds + 0.05 && toCall <= bb;
    wouldContinueIgnoringPressure = rel >= playThreshold || priceIsGreat;
    shouldContinue = rel >= playThreshold * (1 + pressure) || priceIsGreat;
  } else {
    const betRatio = toCall / Math.max(1, potSize - toCall);
    const margin = profile.pressureFold * Math.min(1.2, betRatio) * 0.18;
    wouldContinueIgnoringPressure = equity >= odds;
    shouldContinue = equity >= odds + margin;
  }

  // Premium hands never fold, whatever the pressure.
  if (monster) shouldContinue = true;

  if (shouldContinue) {
    if (
      legal.canRaise &&
      (strong || monster) &&
      rng() < profile.aggression + (monster ? 0.25 : 0)
    ) {
      return raiseOrDowngrade(
        false,
        preflop && hand.currentBet <= bb
          ? ctx.archetype === 'market-maker'
            ? 'spread_raise'
            : 'open_raise'
          : valueReason(),
      );
    }
    // Open-raising unopened pots before the flop.
    if (preflop && hand.currentBet <= bb && legal.canRaise && rng() < profile.aggression) {
      return raiseOrDowngrade(
        false,
        ctx.archetype === 'market-maker' ? 'spread_raise' : 'open_raise',
      );
    }
    if (exceedsRisk(me.totalBet + toCall)) return out({ type: 'fold' }, 'capital_limit');
    return out({ type: 'call' }, 'call_odds');
  }

  // Not continuing on merit: occasional bluff-raise heads-up.
  if (legal.canRaise && opponents <= 2 && rng() < profile.bluff * 0.3) {
    return raiseOrDowngrade(true, exploiting ? 'exploit_bluff' : 'bluff');
  }
  if (tightened && wouldContinueIgnoringPressure) return out({ type: 'fold' }, 'stop_loss');
  if (wouldContinueIgnoringPressure) return out({ type: 'fold' }, 'fold_pressure');
  if (tightened) return out({ type: 'fold' }, 'stop_loss');
  return out({ type: 'fold' }, 'fold_weak');
}
