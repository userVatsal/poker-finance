import { toMajor, type Currency } from './currencies';

const cache = new Map<string, Intl.NumberFormat>();

function formatter(c: Currency, decimals: number): Intl.NumberFormat {
  const key = `${c.code}:${decimals}`;
  let f = cache.get(key);
  if (!f) {
    f = new Intl.NumberFormat(c.locale, {
      style: 'currency',
      currency: c.code,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    cache.set(key, f);
  }
  return f;
}

/**
 * Formats minor units as money. Whole amounts drop the decimals ("$12"),
 * fractional ones keep them ("$12.50"). Yen and won never show decimals.
 */
export function formatMoney(minor: number, c: Currency): string {
  const major = toMajor(minor, c);
  const whole = Number.isInteger(major);
  return formatter(c, whole ? 0 : c.minorUnits).format(major);
}

/** Signed version for profit and loss, e.g. "+$40" or "−$12". */
export function formatSigned(minor: number, c: Currency): string {
  if (minor === 0) return formatMoney(0, c);
  return `${minor > 0 ? '+' : '−'}${formatMoney(Math.abs(minor), c)}`;
}
