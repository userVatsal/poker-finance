import { describe, expect, it } from 'vitest';
import { ARCHETYPES, type ArchetypeId } from '../src/bots/archetypes';
import { FIRMS } from '../src/bots/firms';
import { legalActions } from '../src/engine/hand';
import { createRng } from '../src/engine/rng';
import { Session } from '../src/game/session';

/**
 * Plays thousands of hands end to end. Catches engine bugs that only show up
 * in rare spots (side pots, busts, seat replacement) and checks the bots'
 * personalities come through in the numbers.
 */
describe('full-session simulation', () => {
  it('plays 600 hands across several sessions without errors and conserves chips per hand', () => {
    for (let seed = 1; seed <= 4; seed++) {
      const session = new Session({ seed, opponents: 5 });
      const humanRng = createRng(seed * 77);
      let hands = 0;
      while (hands < 150) {
        if (!session.canDeal()) session.rebuy();
        session.dealNextHand();
        const h0 = session.hand!;
        const before = h0.players.reduce(
          (a, p) => a + p.stack + (h0.isComplete ? 0 : p.totalBet),
          0,
        );
        let guard = 0;
        while (session.handInProgress) {
          if (++guard > 500) throw new Error('Hand did not finish');
          if (session.isHumanTurn()) {
            const l = legalActions(session.hand!);
            const r = humanRng();
            if (l.canRaise && r < 0.15) session.humanAct({ type: 'raise', amount: l.minRaiseTo });
            else if (l.canCheck) session.humanAct({ type: 'check' });
            else if (r < 0.55) session.humanAct({ type: 'call' });
            else session.humanAct({ type: 'fold' });
          } else {
            session.botAct();
          }
        }
        // Chips are conserved within a hand (seat replacement after a bust adds fresh chips, so compare hand players only).
        const after = session.hand!.players.reduce((a, p) => a + p.stack, 0);
        expect(after).toBe(before);
        hands++;
      }
      expect(session.stats.handsPlayed).toBe(150);
    }
  }, 120_000);

  it('archetype personalities show up in how many hands they play', () => {
    // Bots only, many hands: measure VPIP (voluntarily put chips in preflop) by archetype.
    const played: Record<string, { hands: number; vpip: number }> = {};
    const firmArch = new Map(FIRMS.map((f) => [f.id, f.archetype]));
    for (let seed = 10; seed < 16; seed++) {
      const session = new Session({ seed, opponents: 5 });
      const humanRng = createRng(seed);
      for (let h = 0; h < 80; h++) {
        if (!session.canDeal()) session.rebuy();
        session.dealNextHand();
        const counted = new Set<string>();
        while (session.handInProgress) {
          const hand = session.hand!;
          if (session.isHumanTurn()) {
            const l = legalActions(hand);
            session.humanAct(
              l.canCheck
                ? { type: 'check' }
                : humanRng() < 0.5
                  ? { type: 'call' }
                  : { type: 'fold' },
            );
            continue;
          }
          const seat = session.seatFor(hand.toAct)!;
          const street = hand.street;
          const isBB = hand.toAct === hand.bbIndex;
          const d = session.botAct();
          if (street === 'preflop' && !counted.has(seat.id)) {
            counted.add(seat.id);
            const arch = firmArch.get(seat.firmId!)!;
            played[arch] ??= { hands: 0, vpip: 0 };
            played[arch].hands++;
            if (d.action.type === 'raise' || (d.action.type === 'call' && !isBB))
              played[arch].vpip++;
          }
        }
      }
    }
    const rate = (a: ArchetypeId) => played[a]!.vpip / played[a]!.hands;
    // Market makers play the most hands; macro funds and banks play the fewest.
    expect(rate('market-maker')).toBeGreaterThan(rate('macro'));
    expect(rate('market-maker')).toBeGreaterThan(rate('bank'));
    expect(rate('stat-arb')).toBeGreaterThan(rate('macro'));
    // Log for tuning (visible with `npm run simulate`).
    console.table(
      Object.fromEntries(
        Object.entries(played).map(([k, v]) => [
          ARCHETYPES[k as ArchetypeId].name,
          `${Math.round((v.vpip / v.hands) * 100)}% of ${v.hands}`,
        ]),
      ),
    );
  }, 120_000);
});
