import { describe, expect, it } from 'vitest';
import { ARCHETYPES, ARCHETYPE_ORDER } from '../src/bots/archetypes';
import { decide } from '../src/bots/botBrain';
import { deskNoteFor } from '../src/bots/deskNotes';
import { FIRMS, displayName, firmProfile } from '../src/bots/firms';
import { emptyModel } from '../src/bots/opponentModel';
import { parseCards } from '../src/engine/cards';
import { applyAction, startHand } from '../src/engine/hand';
import { createRng } from '../src/engine/rng';
import type { HandState } from '../src/engine/types';

describe('firm roster', () => {
  it('has 37 firms with unique ids, names and aliases', () => {
    expect(FIRMS).toHaveLength(37);
    for (const key of ['id', 'name', 'alias'] as const) {
      const values = FIRMS.map((f) => f[key]);
      expect(new Set(values).size).toBe(values.length);
    }
  });

  it('covers every archetype', () => {
    for (const a of ARCHETYPE_ORDER) expect(FIRMS.some((f) => f.archetype === a)).toBe(true);
  });

  it('alias switch hides real names', () => {
    const f = FIRMS[0]!;
    expect(displayName(f, false)).toBe(f.alias);
    expect(displayName(f, false)).not.toBe(f.name);
  });

  it('every profile dial is in range', () => {
    for (const f of FIRMS) {
      const p = firmProfile(f);
      for (const k of [
        'looseness',
        'aggression',
        'bluff',
        'riskLimit',
        'stopLoss',
        'adaptivity',
        'pressureFold',
      ] as const) {
        expect(p[k]).toBeGreaterThanOrEqual(0);
        expect(p[k]).toBeLessThanOrEqual(1);
      }
      expect(p.momentum).toBeGreaterThanOrEqual(-1);
      expect(p.momentum).toBeLessThanOrEqual(1);
    }
  });
});

/** Heads-up hand where the bot (player 1, big blind) faces an action with the given hole cards. */
function spot(hole: string, setup: (s: HandState) => HandState): HandState {
  let s = startHand({
    seats: [
      { id: 'you', name: 'You', stack: 20000, isHuman: true },
      { id: 'bot', name: 'Bot', stack: 20000, isHuman: false },
    ],
    dealerIndex: 0,
    smallBlind: 100,
    bigBlind: 200,
    handNumber: 1,
    rng: createRng(9),
  });
  s.players[1]!.hole = parseCards(hole);
  s.players[0]!.hole = parseCards('2c 3d');
  s = setup(s);
  return s;
}

const memory = { startStack: 20000, peakStack: 20000, recentResults: [] as number[] };

function decideFor(archetype: keyof typeof ARCHETYPES, s: HandState, seed = 1) {
  return decide({
    hand: s,
    archetype,
    profile: ARCHETYPES[archetype].profile,
    memory,
    opponent: emptyModel(),
    rng: createRng(seed),
  });
}

describe('bot decisions', () => {
  it('never folds aces before the flop', () => {
    for (const a of ARCHETYPE_ORDER) {
      for (let seed = 1; seed <= 10; seed++) {
        const s = spot('As Ah', (h) => applyAction(h, { type: 'raise', amount: 1200 }));
        expect(decideFor(a, s, seed).action.type).not.toBe('fold');
      }
    }
  });

  it('folds 7-2 offsuit to a big raise most of the time', () => {
    let folds = 0;
    for (let seed = 1; seed <= 40; seed++) {
      const s = spot('7c 2d', (h) => applyAction(h, { type: 'raise', amount: 2000 }));
      if (decideFor('bank', s, seed).action.type === 'fold') folds++;
    }
    expect(folds).toBeGreaterThan(34);
  });

  it('always returns a legal action', () => {
    for (const a of ARCHETYPE_ORDER) {
      for (let seed = 1; seed <= 20; seed++) {
        const s = spot('Ts 9s', (h) => applyAction(h, { type: 'raise', amount: 600 }));
        const d = decideFor(a, s, seed);
        expect(() => applyAction(s, d.action)).not.toThrow();
      }
    }
  });

  it('banks respect their capital limit without a monster', () => {
    // Bot holds a medium hand facing a near all-in: banks fold on capital grounds.
    const s = spot('Jc Tc', (h) => applyAction(h, { type: 'raise', amount: 15000 }));
    const d = decideFor('bank', s);
    expect(d.action.type).toBe('fold');
  });

  it('pod shops tighten after a drawdown past the stop-loss', () => {
    const s = spot('9h 8h', (h) => applyAction(h, { type: 'raise', amount: 800 }));
    s.players[1]!.stack = 12000; // down 40% from peak
    const tight = decide({
      hand: s,
      archetype: 'multi-strat',
      profile: ARCHETYPES['multi-strat'].profile,
      memory: { startStack: 20000, peakStack: 20000, recentResults: [-8000] },
      opponent: emptyModel(),
      rng: createRng(3),
    });
    expect(tight.action.type).toBe('fold');
    expect(tight.reason).toBe('stop_loss');
  });
});

describe('desk notes', () => {
  it('signature moves always get a note when frequency is 1', () => {
    const note = deskNoteFor('exploit_bluff', 'Two Sigma', createRng(1));
    expect(note?.text).toContain('Two Sigma');
  });
  it('plain checks have no note', () => {
    expect(deskNoteFor('check', 'X', createRng(1))).toBeNull();
  });
});
