import { describe, expect, it } from 'vitest';
import { CURRENCIES, getCurrency, liveCurrencies, stakes } from '../src/currency/currencies';
import { formatMoney, formatSigned } from '../src/currency/format';

describe('currencies', () => {
  it('v0.1 ships USD only', () => {
    expect(liveCurrencies().map((c) => c.code)).toEqual(['USD']);
  });

  it('first wave after USD is EUR, GBP, JPY, CNY, INR', () => {
    const wave = CURRENCIES.filter((c) => c.release === 'v0.2').map((c) => c.code);
    expect(wave).toEqual(['EUR', 'GBP', 'JPY', 'CNY', 'INR']);
  });

  it('codes are unique', () => {
    const codes = CURRENCIES.map((c) => c.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it('every currency starts with 100 big blinds', () => {
    for (const c of CURRENCIES) expect(c.startingStack / c.bigBlind).toBe(100);
  });

  it('USD stakes are in cents', () => {
    expect(stakes(getCurrency('USD'))).toEqual({
      smallBlind: 100,
      bigBlind: 200,
      startingStack: 20000,
    });
  });

  it('JPY has no minor units', () => {
    expect(stakes(getCurrency('JPY')).bigBlind).toBe(200);
  });
});

describe('formatMoney', () => {
  const usd = getCurrency('USD');
  it('drops decimals for whole amounts', () => {
    expect(formatMoney(20000, usd)).toBe('$200');
  });
  it('keeps decimals for fractional amounts', () => {
    expect(formatMoney(1250, usd)).toBe('$12.50');
  });
  it('formats yen without decimals', () => {
    expect(formatMoney(20000, getCurrency('JPY'))).toMatch(/20,000/);
  });
  it('signs profit and loss', () => {
    expect(formatSigned(4000, usd)).toBe('+$40');
    expect(formatSigned(-1200, usd)).toBe('−$12');
  });
});
