import { describe, expect, it } from 'vitest';
import { parseCards } from '../src/engine/cards';
import { estimateEquity, potOdds } from '../src/engine/equity';
import { createRng } from '../src/engine/rng';

describe('estimateEquity', () => {
  it('aces are about 85% against one random hand', () => {
    const eq = estimateEquity(parseCards('As Ah'), [], 1, 20000, createRng(1));
    expect(eq).toBeGreaterThan(0.83);
    expect(eq).toBeLessThan(0.87);
  });

  it('7-2 offsuit is about 35% against one random hand', () => {
    const eq = estimateEquity(parseCards('7c 2d'), [], 1, 20000, createRng(2));
    expect(eq).toBeGreaterThan(0.32);
    expect(eq).toBeLessThan(0.38);
  });

  it('a made royal flush on the river always wins', () => {
    const eq = estimateEquity(
      parseCards('As Ks'),
      parseCards('Qs Js Ts 2d 3c'),
      4,
      2000,
      createRng(3),
    );
    expect(eq).toBe(1);
  });

  it('equity falls as opponents are added', () => {
    const hole = parseCards('Ac Kd');
    const one = estimateEquity(hole, [], 1, 6000, createRng(4));
    const five = estimateEquity(hole, [], 5, 6000, createRng(4));
    expect(five).toBeLessThan(one);
  });
});

describe('potOdds', () => {
  it('calling 50 into a 100 pot needs 33.3% equity', () => {
    expect(potOdds(50, 100)).toBeCloseTo(1 / 3);
  });
  it('nothing to call needs no equity', () => {
    expect(potOdds(0, 100)).toBe(0);
  });
});
