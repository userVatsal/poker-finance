import type { Card } from './cards';
import { shuffledDeck } from './deck';
import { describeHand, evaluate } from './handEvaluator';
import { buildPots, totalPot } from './pots';
import type { Rng } from './rng';
import type {
  HandEvent,
  HandResult,
  HandState,
  LegalActions,
  PlayerAction,
  PlayerState,
  SeatInput,
  Street,
} from './types';

/**
 * No-limit Texas Hold'em hand state machine.
 *
 * Pure functions: `applyAction` never mutates its input, it returns a new state.
 * That keeps React rendering simple and makes every hand replayable in tests.
 */

export interface StartHandOptions {
  seats: readonly SeatInput[];
  dealerIndex: number;
  smallBlind: number;
  bigBlind: number;
  handNumber: number;
  rng: Rng;
  /** Optional fixed deck (top of deck first) for tests. */
  deck?: Card[];
}

const nextIndex = (i: number, n: number) => (i + 1) % n;

function canAct(p: PlayerState): boolean {
  return !p.folded && !p.allIn;
}

function putChips(p: PlayerState, amount: number): number {
  const paid = Math.min(amount, p.stack);
  p.stack -= paid;
  p.streetBet += paid;
  p.totalBet += paid;
  if (p.stack === 0) p.allIn = true;
  return paid;
}

function cloneState(s: HandState): HandState {
  return {
    ...s,
    players: s.players.map((p) => ({ ...p, hole: p.hole.slice() })),
    deck: s.deck.slice(),
    board: s.board.slice(),
    log: s.log.slice(),
  };
}

export function startHand(opts: StartHandOptions): HandState {
  const { seats, dealerIndex, smallBlind, bigBlind, handNumber } = opts;
  const n = seats.length;
  if (n < 2) throw new Error('A hand needs at least two players');
  if (seats.some((s) => s.stack <= 0)) throw new Error('Every seat must have chips');

  const players: PlayerState[] = seats.map((s) => ({
    id: s.id,
    name: s.name,
    isHuman: s.isHuman,
    stack: s.stack,
    streetBet: 0,
    totalBet: 0,
    hole: [],
    folded: false,
    allIn: false,
    hasActed: false,
    lastAction: null,
  }));

  // Heads-up: the dealer posts the small blind and acts first before the flop.
  const sbIndex = n === 2 ? dealerIndex : nextIndex(dealerIndex, n);
  const bbIndex = nextIndex(sbIndex, n);
  const log: HandEvent[] = [];

  const sbPaid = putChips(players[sbIndex]!, smallBlind);
  players[sbIndex]!.lastAction = { type: 'post', amount: sbPaid };
  log.push({ kind: 'post', player: sbIndex, amount: sbPaid, blind: 'small' });
  const bbPaid = putChips(players[bbIndex]!, bigBlind);
  players[bbIndex]!.lastAction = { type: 'post', amount: bbPaid };
  log.push({ kind: 'post', player: bbIndex, amount: bbPaid, blind: 'big' });

  const deck = opts.deck ? opts.deck.slice() : shuffledDeck(opts.rng);
  // Deal one card at a time, starting left of the dealer, like a real table.
  for (let round = 0; round < 2; round++) {
    for (let k = 1; k <= n; k++) players[(dealerIndex + k) % n]!.hole.push(deck.shift()!);
  }

  const state: HandState = {
    handNumber,
    smallBlind,
    bigBlind,
    dealerIndex,
    sbIndex,
    bbIndex,
    players,
    deck,
    board: [],
    street: 'preflop',
    toAct: -1,
    currentBet: Math.max(sbPaid, bbPaid, bigBlind),
    minRaise: bigBlind,
    lastAggressor: bbIndex,
    isComplete: false,
    result: null,
    log,
  };

  // Blinds may have put everyone all-in already.
  state.toAct = findNextToAct(state, bbIndex);
  if (state.toAct === -1) return advanceStreet(state);
  return state;
}

/** Next player after `from` who still owes an action this street, or -1. */
function findNextToAct(s: HandState, from: number): number {
  const n = s.players.length;
  const live = s.players.filter((p) => !p.folded);
  const actors = live.filter(canAct);
  if (live.length <= 1) return -1;
  // Only one player can still bet: they act only if they still owe chips.
  if (actors.length === 1 && actors[0]!.streetBet >= s.currentBet) return -1;
  if (actors.length === 0) return -1;

  for (let k = 1; k <= n; k++) {
    const i = (from + k) % n;
    const p = s.players[i]!;
    if (!canAct(p)) continue;
    if (!p.hasActed || p.streetBet < s.currentBet) return i;
  }
  return -1;
}

export function pot(s: HandState): number {
  return totalPot(s.players);
}

export function legalActions(s: HandState): LegalActions {
  const p = s.players[s.toAct];
  if (!p || s.isComplete) {
    return {
      canFold: false,
      canCheck: false,
      canCall: false,
      callAmount: 0,
      canRaise: false,
      minRaiseTo: 0,
      maxRaiseTo: 0,
    };
  }
  const owed = Math.max(0, s.currentBet - p.streetBet);
  const callAmount = Math.min(owed, p.stack);
  const maxRaiseTo = p.streetBet + p.stack;
  const fullRaiseTo = s.currentBet === 0 ? s.bigBlind : s.currentBet + s.minRaise;
  const othersCanRespond = s.players.some((q, i) => i !== s.toAct && canAct(q));
  const canRaise = !p.hasActed && maxRaiseTo > s.currentBet && othersCanRespond;
  return {
    canFold: owed > 0,
    canCheck: owed === 0,
    canCall: owed > 0,
    callAmount,
    canRaise,
    minRaiseTo: canRaise ? Math.min(fullRaiseTo, maxRaiseTo) : 0,
    maxRaiseTo: canRaise ? maxRaiseTo : 0,
  };
}

/**
 * Applies the current player's action and returns the next state.
 * Illegal actions throw, so bugs surface immediately in tests.
 */
export function applyAction(state: HandState, action: PlayerAction): HandState {
  if (state.isComplete) throw new Error('Hand is already complete');
  const legal = legalActions(state);
  const s = cloneState(state);
  const idx = s.toAct;
  const p = s.players[idx]!;
  let logged = 0;

  switch (action.type) {
    case 'fold':
      // Folding when you could check is allowed in real poker but never sensible; treat it as a check.
      if (legal.canCheck) {
        p.lastAction = { type: 'check', amount: 0 };
        break;
      }
      p.folded = true;
      p.lastAction = { type: 'fold', amount: 0 };
      break;
    case 'check':
      if (!legal.canCheck) throw new Error(`${p.name} cannot check facing a bet`);
      p.lastAction = { type: 'check', amount: 0 };
      break;
    case 'call': {
      if (!legal.canCall) throw new Error(`${p.name} has nothing to call`);
      logged = putChips(p, legal.callAmount);
      p.lastAction = { type: 'call', amount: logged };
      break;
    }
    case 'raise': {
      if (!legal.canRaise) throw new Error(`${p.name} cannot raise now`);
      const target = Math.round(action.amount ?? legal.minRaiseTo);
      const to = Math.min(Math.max(target, legal.minRaiseTo), legal.maxRaiseTo);
      const increment = to - s.currentBet;
      logged = putChips(p, to - p.streetBet);
      if (increment >= s.minRaise) {
        // A full raise reopens the action for everyone else.
        s.minRaise = increment;
        for (const q of s.players) if (q !== p) q.hasActed = false;
      }
      s.currentBet = Math.max(s.currentBet, p.streetBet);
      s.lastAggressor = idx;
      p.lastAction = { type: 'raise', amount: p.streetBet };
      break;
    }
    default:
      throw new Error(`Unknown action ${(action as PlayerAction).type}`);
  }
  p.hasActed = true;
  const loggedType = p.lastAction!.type as PlayerAction['type'];
  s.log.push({
    kind: 'action',
    player: idx,
    street: s.street,
    type: loggedType,
    amount: loggedType === 'raise' ? p.streetBet : logged,
    allIn: p.allIn,
  });

  const live = s.players.filter((q) => !q.folded);
  if (live.length === 1) return finishByFold(s);

  const next = findNextToAct(s, idx);
  if (next !== -1) {
    s.toAct = next;
    return s;
  }
  return advanceStreet(s);
}

const STREET_ORDER: Street[] = ['preflop', 'flop', 'turn', 'river', 'showdown'];

/** Closes the betting round and deals the next street (or runs the board out to showdown). */
function advanceStreet(s: HandState): HandState {
  while (true) {
    for (const p of s.players) {
      p.streetBet = 0;
      p.hasActed = false;
    }
    s.currentBet = 0;
    s.minRaise = s.bigBlind;

    const next = STREET_ORDER[STREET_ORDER.indexOf(s.street) + 1]!;
    if (next === 'showdown') return showdown(s);

    s.deck.shift(); // burn
    const count = next === 'flop' ? 3 : 1;
    const cards = s.deck.splice(0, count);
    s.board.push(...cards);
    s.street = next;
    s.log.push({ kind: 'deal', street: next, cards });

    const toAct = findNextToAct(s, s.dealerIndex);
    if (toAct !== -1) {
      s.toAct = toAct;
      return s;
    }
    // Nobody (or only one player) can bet: keep dealing.
  }
}

function finishByFold(s: HandState): HandState {
  const winner = s.players.findIndex((p) => !p.folded);
  const amount = pot(s);
  const winnings = s.players.map((_, i) => (i === winner ? amount : 0));
  s.players[winner]!.stack += amount;
  s.log.push({ kind: 'win', player: winner, amount, hand: null, potIndex: 0 });
  s.result = {
    pots: [{ amount, eligible: [winner], winners: [winner] }],
    winnings,
    scores: s.players.map(() => null),
    handNames: s.players.map(() => null),
    wentToShowdown: false,
  };
  s.toAct = -1;
  s.isComplete = true;
  return s;
}

function showdown(s: HandState): HandState {
  s.street = 'showdown';
  const n = s.players.length;
  const scores = s.players.map((p) => (p.folded ? null : evaluate([...p.hole, ...s.board])));
  const handNames = scores.map((sc) => (sc === null ? null : describeHand(sc)));
  const pots = buildPots(s.players);
  const winnings = new Array<number>(n).fill(0);

  // Odd chips go to the first winner clockwise from the dealer.
  const seatOrder = Array.from({ length: n }, (_, k) => (s.dealerIndex + 1 + k) % n);

  pots.forEach((potItem, potIndex) => {
    let best = -1;
    for (const i of potItem.eligible) best = Math.max(best, scores[i] ?? -1);
    const winners = seatOrder.filter((i) => potItem.eligible.includes(i) && scores[i] === best);
    potItem.winners = winners;
    const share = Math.floor(potItem.amount / winners.length);
    let remainder = potItem.amount - share * winners.length;
    for (const w of winners) {
      const extra = remainder > 0 ? 1 : 0;
      remainder -= extra;
      winnings[w]! += share + extra;
      s.log.push({
        kind: 'win',
        player: w,
        amount: share + extra,
        hand: potItem.eligible.length > 1 ? handNames[w]! : null,
        potIndex,
      });
    }
  });

  winnings.forEach((w, i) => (s.players[i]!.stack += w));
  const contested = pots.some((pt) => pt.eligible.length > 1);
  const result: HandResult = { pots, winnings, scores, handNames, wentToShowdown: contested };
  s.result = result;
  s.toAct = -1;
  s.isComplete = true;
  return s;
}
