/**
 * Currency registry.
 *
 * The engine only ever sees integers in a currency's MINOR units (cents,
 * pence, paise; yen has none). Adding a currency is a config change here,
 * never an engine change. See docs/currencies.md for the rollout plan.
 */

export type CurrencyStatus = 'live' | 'planned';

export interface Currency {
  /** ISO 4217 code. */
  code: string;
  name: string;
  symbol: string;
  /** Digits after the decimal point (USD 2, JPY 0). */
  minorUnits: number;
  /** Locale used for number formatting. */
  locale: string;
  /** Blinds and starting stack, in MAJOR units (e.g. dollars). */
  smallBlind: number;
  bigBlind: number;
  startingStack: number;
  status: CurrencyStatus;
  /** Release that switches the currency on. */
  release: string;
}

export const CURRENCIES: readonly Currency[] = [
  // v0.1
  {
    code: 'USD',
    name: 'US dollar',
    symbol: '$',
    minorUnits: 2,
    locale: 'en-US',
    smallBlind: 1,
    bigBlind: 2,
    startingStack: 200,
    status: 'live',
    release: 'v0.1',
  },
  // v0.2 — first wave
  {
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    minorUnits: 2,
    locale: 'en-IE',
    smallBlind: 1,
    bigBlind: 2,
    startingStack: 200,
    status: 'planned',
    release: 'v0.2',
  },
  {
    code: 'GBP',
    name: 'British pound',
    symbol: '£',
    minorUnits: 2,
    locale: 'en-GB',
    smallBlind: 1,
    bigBlind: 2,
    startingStack: 200,
    status: 'planned',
    release: 'v0.2',
  },
  {
    code: 'JPY',
    name: 'Japanese yen',
    symbol: '¥',
    minorUnits: 0,
    locale: 'ja-JP',
    smallBlind: 100,
    bigBlind: 200,
    startingStack: 20000,
    status: 'planned',
    release: 'v0.2',
  },
  {
    code: 'CNY',
    name: 'Chinese yuan',
    symbol: '¥',
    minorUnits: 2,
    locale: 'zh-CN',
    smallBlind: 5,
    bigBlind: 10,
    startingStack: 1000,
    status: 'planned',
    release: 'v0.2',
  },
  {
    code: 'INR',
    name: 'Indian rupee',
    symbol: '₹',
    minorUnits: 2,
    locale: 'en-IN',
    smallBlind: 50,
    bigBlind: 100,
    startingStack: 10000,
    status: 'planned',
    release: 'v0.2',
  },
  // v0.3 — other majors
  {
    code: 'CHF',
    name: 'Swiss franc',
    symbol: 'CHF',
    minorUnits: 2,
    locale: 'de-CH',
    smallBlind: 1,
    bigBlind: 2,
    startingStack: 200,
    status: 'planned',
    release: 'v0.3',
  },
  {
    code: 'CAD',
    name: 'Canadian dollar',
    symbol: '$',
    minorUnits: 2,
    locale: 'en-CA',
    smallBlind: 1,
    bigBlind: 2,
    startingStack: 200,
    status: 'planned',
    release: 'v0.3',
  },
  {
    code: 'AUD',
    name: 'Australian dollar',
    symbol: '$',
    minorUnits: 2,
    locale: 'en-AU',
    smallBlind: 1,
    bigBlind: 2,
    startingStack: 200,
    status: 'planned',
    release: 'v0.3',
  },
  {
    code: 'NZD',
    name: 'New Zealand dollar',
    symbol: '$',
    minorUnits: 2,
    locale: 'en-NZ',
    smallBlind: 1,
    bigBlind: 2,
    startingStack: 200,
    status: 'planned',
    release: 'v0.3',
  },
  {
    code: 'HKD',
    name: 'Hong Kong dollar',
    symbol: '$',
    minorUnits: 2,
    locale: 'en-HK',
    smallBlind: 10,
    bigBlind: 20,
    startingStack: 2000,
    status: 'planned',
    release: 'v0.3',
  },
  {
    code: 'SGD',
    name: 'Singapore dollar',
    symbol: '$',
    minorUnits: 2,
    locale: 'en-SG',
    smallBlind: 1,
    bigBlind: 2,
    startingStack: 200,
    status: 'planned',
    release: 'v0.3',
  },
  {
    code: 'KRW',
    name: 'South Korean won',
    symbol: '₩',
    minorUnits: 0,
    locale: 'ko-KR',
    smallBlind: 1000,
    bigBlind: 2000,
    startingStack: 200000,
    status: 'planned',
    release: 'v0.3',
  },
  {
    code: 'SEK',
    name: 'Swedish krona',
    symbol: 'kr',
    minorUnits: 2,
    locale: 'sv-SE',
    smallBlind: 10,
    bigBlind: 20,
    startingStack: 2000,
    status: 'planned',
    release: 'v0.3',
  },
  {
    code: 'NOK',
    name: 'Norwegian krone',
    symbol: 'kr',
    minorUnits: 2,
    locale: 'nb-NO',
    smallBlind: 10,
    bigBlind: 20,
    startingStack: 2000,
    status: 'planned',
    release: 'v0.3',
  },
  {
    code: 'AED',
    name: 'UAE dirham',
    symbol: 'AED',
    minorUnits: 2,
    locale: 'en-AE',
    smallBlind: 5,
    bigBlind: 10,
    startingStack: 1000,
    status: 'planned',
    release: 'v0.3',
  },
  {
    code: 'SAR',
    name: 'Saudi riyal',
    symbol: 'SAR',
    minorUnits: 2,
    locale: 'en-SA',
    smallBlind: 5,
    bigBlind: 10,
    startingStack: 1000,
    status: 'planned',
    release: 'v0.3',
  },
  {
    code: 'BRL',
    name: 'Brazilian real',
    symbol: 'R$',
    minorUnits: 2,
    locale: 'pt-BR',
    smallBlind: 5,
    bigBlind: 10,
    startingStack: 1000,
    status: 'planned',
    release: 'v0.3',
  },
  {
    code: 'MXN',
    name: 'Mexican peso',
    symbol: '$',
    minorUnits: 2,
    locale: 'es-MX',
    smallBlind: 20,
    bigBlind: 40,
    startingStack: 4000,
    status: 'planned',
    release: 'v0.3',
  },
  {
    code: 'ZAR',
    name: 'South African rand',
    symbol: 'R',
    minorUnits: 2,
    locale: 'en-ZA',
    smallBlind: 20,
    bigBlind: 40,
    startingStack: 4000,
    status: 'planned',
    release: 'v0.3',
  },
];

export const DEFAULT_CURRENCY = 'USD';

export function getCurrency(code: string): Currency {
  const c = CURRENCIES.find((x) => x.code === code);
  if (!c) throw new Error(`Unknown currency ${code}`);
  return c;
}

export const liveCurrencies = () => CURRENCIES.filter((c) => c.status === 'live');

export const toMinor = (major: number, c: Currency) => Math.round(major * 10 ** c.minorUnits);
export const toMajor = (minor: number, c: Currency) => minor / 10 ** c.minorUnits;

/** Table stakes for a currency, in minor units, ready for the engine. */
export function stakes(c: Currency) {
  return {
    smallBlind: toMinor(c.smallBlind, c),
    bigBlind: toMinor(c.bigBlind, c),
    startingStack: toMinor(c.startingStack, c),
  };
}
