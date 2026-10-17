import { describe, expect, it } from 'vitest';
import { parseCards, type Card } from '../src/engine/cards';
import { applyAction, legalActions, pot, startHand } from '../src/engine/hand';
import { buildPots } from '../src/engine/pots';
import { createRng } from '../src/engine/rng';
import type { HandState, PlayerState, SeatInput } from '../src/engine/types';

const seats = (...stacks: number[]): SeatInput[] =>
  stacks.map((stack, i) => ({ id: `p${i}`, name: `P${i}`, stack, isHuman: i === 0 }));

/**
 * Builds a deck so player i gets holes[i], then burn + flop, burn + turn, burn + river.
 * Cards are dealt one at a time starting left of the dealer.
 */
function stackedDeck(holes: string[], board: string, dealer: number): Card[] {
  const n = holes.length;
  const hands = holes.map(parseCards);
  const order: Card[] = [];
  for (let round = 0; round < 2; round++) {
    for (let k = 1; k <= n; k++) order.push(hands[(dealer + k) % n]![round]!);
  }
  const b = parseCards(board);
  const used = new Set([...order, ...b]);
  const filler = Array.from({ length: 52 }, (_, i) => i).filter((c) => !used.has(c));
  order.push(filler.shift()!, b[0]!, b[1]!, b[2]!, filler.shift()!, b[3]!, filler.shift()!, b[4]!);
  return [...order, ...filler];
}

const chips = (s: HandState) =>
  s.players.reduce((a, p) => a + p.stack, 0) + (s.isComplete ? 0 : pot(s));
const rng = createRng(42);

describe('blinds and first action', () => {
  it('three-handed: SB and BB left of dealer, UTG (dealer) acts first', () => {
    const s = startHand({
      seats: seats(1000, 1000, 1000),
      dealerIndex: 0,
      smallBlind: 5,
      bigBlind: 10,
      handNumber: 1,
      rng,
    });
    expect(s.sbIndex).toBe(1);
    expect(s.bbIndex).toBe(2);
    expect(s.players[1]!.streetBet).toBe(5);
    expect(s.players[2]!.streetBet).toBe(10);
    expect(s.toAct).toBe(0);
    expect(s.players.every((p) => p.hole.length === 2)).toBe(true);
  });

  it('heads-up: dealer posts small blind and acts first preflop, last postflop', () => {
    let s = startHand({
      seats: seats(1000, 1000),
      dealerIndex: 0,
      smallBlind: 5,
      bigBlind: 10,
      handNumber: 1,
      rng,
    });
    expect(s.sbIndex).toBe(0);
    expect(s.toAct).toBe(0);
    s = applyAction(s, { type: 'call' });
    expect(s.toAct).toBe(1); // BB gets the option
    expect(legalActions(s).canCheck).toBe(true);
    s = applyAction(s, { type: 'check' });
    expect(s.street).toBe('flop');
    expect(s.toAct).toBe(1); // non-dealer acts first after the flop
  });
});

describe('betting rules', () => {
  it('minimum raise is the size of the last raise', () => {
    let s = startHand({
      seats: seats(1000, 1000, 1000),
      dealerIndex: 0,
      smallBlind: 5,
      bigBlind: 10,
      handNumber: 1,
      rng,
    });
    expect(legalActions(s).minRaiseTo).toBe(20);
    s = applyAction(s, { type: 'raise', amount: 50 }); // raise of 40
    expect(legalActions(s).minRaiseTo).toBe(90);
  });

  it('raises below the minimum are lifted to the minimum', () => {
    let s = startHand({
      seats: seats(1000, 1000, 1000),
      dealerIndex: 0,
      smallBlind: 5,
      bigBlind: 10,
      handNumber: 1,
      rng,
    });
    s = applyAction(s, { type: 'raise', amount: 12 });
    expect(s.players[0]!.streetBet).toBe(20);
  });

  it('illegal check facing a bet throws', () => {
    const s = startHand({
      seats: seats(1000, 1000, 1000),
      dealerIndex: 0,
      smallBlind: 5,
      bigBlind: 10,
      handNumber: 1,
      rng,
    });
    expect(() => applyAction(s, { type: 'check' })).toThrow();
  });

  it('everyone folding awards the pot to the last player standing', () => {
    let s = startHand({
      seats: seats(1000, 1000, 1000),
      dealerIndex: 0,
      smallBlind: 5,
      bigBlind: 10,
      handNumber: 1,
      rng,
    });
    s = applyAction(s, { type: 'raise', amount: 30 });
    s = applyAction(s, { type: 'fold' });
    s = applyAction(s, { type: 'fold' });
    expect(s.isComplete).toBe(true);
    expect(s.result!.wentToShowdown).toBe(false);
    expect(s.players[0]!.stack).toBe(1015);
  });

  it('a short all-in raise does not reopen raising for players who already acted', () => {
    // P0 (dealer) raises to 100, P1 shoves 130 total (only +30), P2 folds.
    let s = startHand({
      seats: seats(1000, 130, 1000),
      dealerIndex: 0,
      smallBlind: 5,
      bigBlind: 10,
      handNumber: 1,
      rng,
    });
    s = applyAction(s, { type: 'raise', amount: 100 });
    s = applyAction(s, { type: 'raise', amount: 130 });
    expect(s.players[1]!.allIn).toBe(true);
    s = applyAction(s, { type: 'fold' });
    expect(s.toAct).toBe(0);
    const legal = legalActions(s);
    expect(legal.canCall).toBe(true);
    expect(legal.canRaise).toBe(false);
  });

  it('chips are conserved through a full hand', () => {
    let s = startHand({
      seats: seats(500, 800, 1200, 300),
      dealerIndex: 2,
      smallBlind: 5,
      bigBlind: 10,
      handNumber: 1,
      rng,
    });
    const before = chips(s);
    while (!s.isComplete) {
      const l = legalActions(s);
      s = applyAction(s, l.canCheck ? { type: 'check' } : { type: 'call' });
    }
    expect(chips(s)).toBe(before);
  });
});

describe('showdown and side pots', () => {
  it('best hand wins at showdown', () => {
    const deck = stackedDeck(['As Ah', 'Kc Kd'], '2s 7d 9c Jh 3s', 0);
    let s = startHand({
      seats: seats(1000, 1000),
      dealerIndex: 0,
      smallBlind: 5,
      bigBlind: 10,
      handNumber: 1,
      rng,
      deck,
    });
    s = applyAction(s, { type: 'call' });
    s = applyAction(s, { type: 'check' });
    for (let street = 0; street < 3; street++) {
      s = applyAction(s, { type: 'check' });
      s = applyAction(s, { type: 'check' });
    }
    expect(s.isComplete).toBe(true);
    expect(s.players[0]!.stack).toBe(1010);
    expect(s.result!.handNames[0]).toBe('Pair of aces');
  });

  it('builds a side pot when a short stack is all-in and the board runs out automatically', () => {
    // P0 short with the best hand; P1 and P2 bigger stacks.
    const deck = stackedDeck(['As Ah', 'Kc Kd', 'Qc Qd'], '2s 7d 9c Jh 3s', 0);
    let s = startHand({
      seats: seats(100, 1000, 1000),
      dealerIndex: 0,
      smallBlind: 5,
      bigBlind: 10,
      handNumber: 1,
      rng,
      deck,
    });
    s = applyAction(s, { type: 'raise', amount: 100 }); // P0 all-in
    s = applyAction(s, { type: 'raise', amount: 300 }); // P1
    s = applyAction(s, { type: 'call' }); // P2
    // Flop: P1 and P2 check it down.
    while (!s.isComplete) s = applyAction(s, { type: 'check' });

    const pots = s.result!.pots;
    expect(pots).toHaveLength(2);
    expect(pots[0]!.amount).toBe(300); // 100 x 3
    expect(pots[0]!.winners).toEqual([0]);
    expect(pots[1]!.amount).toBe(400); // 200 x 2
    expect(pots[1]!.winners).toEqual([1]);
    expect(s.players[0]!.stack).toBe(300);
    expect(s.players[1]!.stack).toBe(1100);
    expect(s.players[2]!.stack).toBe(700);
  });

  it('runs out the board when everyone is all-in', () => {
    let s = startHand({
      seats: seats(200, 200),
      dealerIndex: 0,
      smallBlind: 5,
      bigBlind: 10,
      handNumber: 1,
      rng,
    });
    s = applyAction(s, { type: 'raise', amount: 200 });
    s = applyAction(s, { type: 'call' });
    expect(s.isComplete).toBe(true);
    expect(s.board).toHaveLength(5);
    expect(s.players[0]!.stack + s.players[1]!.stack).toBe(400);
  });

  it('split pots share chips evenly', () => {
    const deck = stackedDeck(['2c 3d', '2d 3c'], 'As Ks Qh Jd Tc', 0);
    let s = startHand({
      seats: seats(1000, 1000),
      dealerIndex: 0,
      smallBlind: 5,
      bigBlind: 10,
      handNumber: 1,
      rng,
      deck,
    });
    s = applyAction(s, { type: 'call' });
    while (!s.isComplete) s = applyAction(s, { type: 'check' });
    expect(s.players[0]!.stack).toBe(1000);
    expect(s.players[1]!.stack).toBe(1000);
  });
});

describe('buildPots', () => {
  const p = (totalBet: number, folded = false): PlayerState => ({
    id: 'x',
    name: 'x',
    isHuman: false,
    stack: 0,
    streetBet: 0,
    totalBet,
    hole: [],
    folded,
    allIn: false,
    hasActed: true,
    lastAction: null,
  });

  it('folded money stays in the pot but folded players cannot win', () => {
    const pots = buildPots([p(50, true), p(100), p(100)]);
    expect(pots).toEqual([{ amount: 250, eligible: [1, 2], winners: [] }]);
  });

  it('an uncalled bet becomes a pot only its owner can win', () => {
    const pots = buildPots([p(300), p(100)]);
    expect(pots).toEqual([
      { amount: 200, eligible: [0, 1], winners: [] },
      { amount: 200, eligible: [0], winners: [] },
    ]);
  });
});
