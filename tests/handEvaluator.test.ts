import { describe, expect, it } from 'vitest';
import { parseCards } from '../src/engine/cards';
import { Category, categoryOf, describeHand, evaluate } from '../src/engine/handEvaluator';

const score = (text: string) => evaluate(parseCards(text));
const cat = (text: string) => categoryOf(score(text));

describe('hand categories', () => {
  it.each([
    ['As Ks Qs Js Ts 2d 3c', Category.StraightFlush],
    ['5h 4h 3h 2h Ah Kd Kc', Category.StraightFlush],
    ['9c 9d 9h 9s 2d 3c 4h', Category.Quads],
    ['Kc Kd Kh 7s 7d 2c 3h', Category.FullHouse],
    ['Kc Kd Kh 7s 7d 7c 3h', Category.FullHouse],
    ['Ah 9h 7h 4h 2h Kd Qc', Category.Flush],
    ['9c 8d 7h 6s 5d 2c 2h', Category.Straight],
    ['Ad 2c 3h 4s 5d Kc Kh', Category.Straight],
    ['Qc Qd Qh 7s 4d 2c 3h', Category.Trips],
    ['Jc Jd 4h 4s 9d 2c 3h', Category.TwoPair],
    ['Tc Td 8h 6s 4d 3c 2h', Category.Pair],
    ['Ac Jd 8h 6s 4d 3c 2h', Category.HighCard],
  ])('%s → category %i', (cards, expected) => {
    expect(cat(cards)).toBe(expected);
  });
});

describe('tie-breaks', () => {
  it('higher straight beats lower straight; wheel is the lowest', () => {
    expect(score('6c 5d 4h 3s 2d Kc Kh')).toBeGreaterThan(score('Ad 2c 3h 4s 5d Kc Qh'));
    expect(score('Ac Kd Qh Js Td 2c 3h')).toBeGreaterThan(score('Kc Qd Jh Ts 9d 2c 3h'));
  });

  it('kickers decide a pair', () => {
    expect(score('Ac Ad Kh 7s 4d 3c 2h')).toBeGreaterThan(score('Ac Ad Qh 7s 4d 3c 2h'));
  });

  it('two pair uses the best kicker, including a third pair', () => {
    expect(score('Kc Kd 7h 7s 5d 5c Ah')).toBeGreaterThan(score('Kc Kd 7h 7s 5d 5c Qh'));
    expect(score('Kc Kd 7h 7s 6d 6c 2h')).toBeGreaterThan(score('Kc Kd 7h 7s 5d 5c 2h'));
  });

  it('full house prefers the higher trips', () => {
    expect(score('Ac Ad Ah 2s 2d Kc Kh')).toBeGreaterThan(score('Kc Kd Kh As Ad 2c 3h'));
  });

  it('flush compares all five cards', () => {
    expect(score('Ah Kh 9h 5h 3h 2c 2d')).toBeGreaterThan(score('Ah Kh 9h 5h 2h 2c 2d'));
  });

  it('identical boards tie', () => {
    expect(score('Ac Kd Qh Js 9d 3c 2h')).toBe(score('Ac Kd Qh Js 9d 4c 2h'));
  });

  it('works with five and six cards', () => {
    expect(categoryOf(evaluate(parseCards('As Ks Qs Js Ts')))).toBe(Category.StraightFlush);
    expect(categoryOf(evaluate(parseCards('2c 2d 5h 7s 9d Jc')))).toBe(Category.Pair);
  });
});

describe('describeHand', () => {
  it('names hands in plain English', () => {
    expect(describeHand(score('As Ks Qs Js Ts 2d 3c'))).toBe('Royal flush');
    expect(describeHand(score('Kc Kd Kh 7s 7d 2c 3h'))).toBe('Full house, kings full of sevens');
    expect(describeHand(score('Jc Jd 4h 4s 9d 2c 3h'))).toBe('Two pair, jacks and fours');
    expect(describeHand(score('Ad 2c 3h 4s 5d Kc Kh'))).toBe('Straight, five high');
  });
});
