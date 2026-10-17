import { ARCHETYPES, type ArchetypeId, type StrategyProfile } from './archetypes';

/**
 * The firm roster.
 *
 * IMPORTANT: these are caricatures built from public descriptions of each
 * firm's business. They are not, and do not claim to be, any firm's real
 * strategy. No logos are used. Set USE_REAL_NAMES to false in src/config.ts
 * to show the fictional `alias` instead everywhere.
 */
export interface Firm {
  id: string;
  name: string;
  /** Fictional stand-in name, used when real names are switched off. */
  alias: string;
  archetype: ArchetypeId;
  hq: string;
  /** One line on what the firm is publicly known for. */
  knownFor: string;
  /** Small per-firm adjustments on top of the archetype profile. */
  tweaks?: Partial<StrategyProfile>;
}

export const FIRMS: readonly Firm[] = [
  // Market makers and HFT
  {
    id: 'citadel-securities',
    name: 'Citadel Securities',
    alias: 'Bastion Liquidity',
    archetype: 'market-maker',
    hq: 'Miami',
    knownFor: 'One of the largest market makers in US equities and options.',
    tweaks: { looseness: 0.66 },
  },
  {
    id: 'jane-street',
    name: 'Jane Street',
    alias: 'Lantern Row',
    archetype: 'market-maker',
    hq: 'New York',
    knownFor:
      'Major trading firm in ETFs, bonds and options, known for puzzles and probability-heavy interviews.',
    tweaks: { adaptivity: 0.55, aggression: 0.5 },
  },
  {
    id: 'optiver',
    name: 'Optiver',
    alias: 'Oakline Trading',
    archetype: 'market-maker',
    hq: 'Amsterdam',
    knownFor: 'Options market maker founded in Amsterdam, active on exchanges worldwide.',
    tweaks: { pressureFold: 0.7 },
  },
  {
    id: 'imc',
    name: 'IMC Trading',
    alias: 'Canal Quotes',
    archetype: 'market-maker',
    hq: 'Amsterdam',
    knownFor:
      'Technology-driven market maker founded in Amsterdam, runs the IMC Prosperity competition.',
  },
  {
    id: 'sig',
    name: 'Susquehanna (SIG)',
    alias: 'Riverbend Group',
    archetype: 'market-maker',
    hq: 'Bala Cynwyd',
    knownFor: 'Options trading firm famous for using poker and game theory to train traders.',
    tweaks: { bluff: 0.2, adaptivity: 0.6 },
  },
  {
    id: 'virtu',
    name: 'Virtu Financial',
    alias: 'Vertex Flow',
    archetype: 'market-maker',
    hq: 'New York',
    knownFor: 'Electronic market maker known for very consistent daily trading results.',
    tweaks: { bluff: 0.06, pressureFold: 0.85 },
  },
  {
    id: 'flow-traders',
    name: 'Flow Traders',
    alias: 'Delta Stream',
    archetype: 'market-maker',
    hq: 'Amsterdam',
    knownFor: 'Liquidity provider specialising in exchange-traded products (ETPs).',
  },
  {
    id: 'hrt',
    name: 'Hudson River Trading',
    alias: 'Palisade Systems',
    archetype: 'market-maker',
    hq: 'New York',
    knownFor: 'Algorithmic trading firm built around automated, research-driven strategies.',
    tweaks: { adaptivity: 0.5 },
  },
  {
    id: 'jump',
    name: 'Jump Trading',
    alias: 'Leap Capital',
    archetype: 'market-maker',
    hq: 'Chicago',
    knownFor: 'Chicago trading firm focused on research and low-latency technology.',
    tweaks: { aggression: 0.55 },
  },
  {
    id: 'tower',
    name: 'Tower Research Capital',
    alias: 'Spire Research',
    archetype: 'market-maker',
    hq: 'New York',
    knownFor: 'High-frequency trading firm made up of many independent trading teams.',
  },
  {
    id: 'xtx',
    name: 'XTX Markets',
    alias: 'Matrix Pricing',
    archetype: 'market-maker',
    hq: 'London',
    knownFor:
      'London firm that prices markets with machine learning, a major FX liquidity provider.',
    tweaks: { adaptivity: 0.6, bluff: 0.08 },
  },

  // Quant and statistical arbitrage
  {
    id: 'renaissance',
    name: 'Renaissance Technologies',
    alias: 'Medley Labs',
    archetype: 'stat-arb',
    hq: 'East Setauket',
    knownFor: 'Quant pioneer whose Medallion fund is famous for its long-run returns.',
    tweaks: { adaptivity: 1, aggression: 0.6 },
  },
  {
    id: 'two-sigma',
    name: 'Two Sigma',
    alias: 'Second Deviation',
    archetype: 'stat-arb',
    hq: 'New York',
    knownFor: 'Applies data science and machine learning to investment management.',
  },
  {
    id: 'de-shaw',
    name: 'D. E. Shaw',
    alias: 'Shore & Co.',
    archetype: 'stat-arb',
    hq: 'New York',
    knownFor: 'Early pioneer of computational, quantitative investing.',
    tweaks: { looseness: 0.42 },
  },
  {
    id: 'aqr',
    name: 'AQR Capital Management',
    alias: 'Factor Hill',
    archetype: 'stat-arb',
    hq: 'Greenwich',
    knownFor: 'Known for factor investing: value, momentum, quality and carry.',
    tweaks: { momentum: 0.2, adaptivity: 0.6 },
  },
  {
    id: 'qrt',
    name: 'Qube Research & Technologies',
    alias: 'Cubic Signal',
    archetype: 'stat-arb',
    hq: 'London',
    knownFor: 'Quantitative investment manager running systematic strategies.',
  },

  // Global macro
  {
    id: 'bridgewater',
    name: 'Bridgewater Associates',
    alias: 'Keystone Principles',
    archetype: 'macro',
    hq: 'Westport',
    knownFor: 'One of the largest hedge funds, built on systematic global macro views.',
    tweaks: { adaptivity: 0.45, looseness: 0.12 },
  },
  {
    id: 'brevan-howard',
    name: 'Brevan Howard',
    alias: 'Harbour Macro',
    archetype: 'macro',
    hq: 'London',
    knownFor: 'Macro fund known for trading interest rates and fixed income.',
  },
  {
    id: 'tudor',
    name: 'Tudor Investment Corp',
    alias: 'Thornbury Capital',
    archetype: 'macro',
    hq: 'Stamford',
    knownFor: 'Discretionary macro fund founded by a well-known macro trader.',
    tweaks: { bluff: 0.28 },
  },
  {
    id: 'rokos',
    name: 'Rokos Capital Management',
    alias: 'Rook Macro',
    archetype: 'macro',
    hq: 'London',
    knownFor: 'London macro fund focused on rates and global economic themes.',
  },

  // Multi-strategy pod shops
  {
    id: 'millennium',
    name: 'Millennium Management',
    alias: 'Centennial Partners',
    archetype: 'multi-strat',
    hq: 'New York',
    knownFor: 'Multi-manager platform with hundreds of teams and tight drawdown limits.',
    tweaks: { stopLoss: 0.2 },
  },
  {
    id: 'citadel',
    name: 'Citadel',
    alias: 'Bastion Multi-Strat',
    archetype: 'multi-strat',
    hq: 'Miami',
    knownFor: 'Multi-strategy hedge fund (separate from Citadel Securities).',
    tweaks: { aggression: 0.6 },
  },
  {
    id: 'point72',
    name: 'Point72',
    alias: 'Meridian Point',
    archetype: 'multi-strat',
    hq: 'Stamford',
    knownFor: 'Multi-manager firm spanning discretionary and systematic strategies.',
  },
  {
    id: 'balyasny',
    name: 'Balyasny Asset Management',
    alias: 'Balance Street',
    archetype: 'multi-strat',
    hq: 'Chicago',
    knownFor: 'Multi-strategy firm running teams across equities, macro and commodities.',
  },
  {
    id: 'exoduspoint',
    name: 'ExodusPoint',
    alias: 'Outpost Capital',
    archetype: 'multi-strat',
    hq: 'New York',
    knownFor: 'Multi-strategy fund launched in 2018.',
  },

  // Trend followers
  {
    id: 'man-ahl',
    name: 'Man AHL',
    alias: 'Ridge Systematic',
    archetype: 'trend',
    hq: 'London',
    knownFor: 'Long-running systematic trend-following business within Man Group.',
  },
  {
    id: 'winton',
    name: 'Winton',
    alias: 'Windrow Research',
    archetype: 'trend',
    hq: 'London',
    knownFor: 'London firm that built its name on systematic, data-driven trend following.',
    tweaks: { momentum: 0.6, adaptivity: 0.35 },
  },
  {
    id: 'aspect',
    name: 'Aspect Capital',
    alias: 'Facet Futures',
    archetype: 'trend',
    hq: 'London',
    knownFor: 'Systematic investment manager rooted in trend following.',
  },
  {
    id: 'lynx',
    name: 'Lynx Asset Management',
    alias: 'Ocelot Trend',
    archetype: 'trend',
    hq: 'Stockholm',
    knownFor: 'Swedish systematic manager focused on trend following.',
    tweaks: { momentum: 0.9 },
  },

  // Banks
  {
    id: 'goldman-sachs',
    name: 'Goldman Sachs',
    alias: 'Gilded Lane Bank',
    archetype: 'bank',
    hq: 'New York',
    knownFor: 'Global investment bank with a large trading business.',
    tweaks: { aggression: 0.38 },
  },
  {
    id: 'jpmorgan',
    name: 'JPMorgan Chase',
    alias: 'Morrow Chase Bank',
    archetype: 'bank',
    hq: 'New York',
    knownFor: 'Largest US bank by assets, major markets and trading franchise.',
    tweaks: { riskLimit: 0.35 },
  },
  {
    id: 'morgan-stanley',
    name: 'Morgan Stanley',
    alias: 'Stanton Hill Bank',
    archetype: 'bank',
    hq: 'New York',
    knownFor: 'Investment bank with a large equities trading business.',
  },
  {
    id: 'barclays',
    name: 'Barclays',
    alias: 'Lombard Crown Bank',
    archetype: 'bank',
    hq: 'London',
    knownFor: 'British universal bank with a global markets division.',
  },
  {
    id: 'hsbc',
    name: 'HSBC',
    alias: 'Harbourline Bank',
    archetype: 'bank',
    hq: 'London',
    knownFor: 'One of the largest banks in the world, strong in FX and Asian markets.',
  },
  {
    id: 'deutsche-bank',
    name: 'Deutsche Bank',
    alias: 'Rhine Federal Bank',
    archetype: 'bank',
    hq: 'Frankfurt',
    knownFor: "Germany's largest bank, with a major fixed income and FX business.",
  },
  {
    id: 'ubs',
    name: 'UBS',
    alias: 'Alpine Union Bank',
    archetype: 'bank',
    hq: 'Zurich',
    knownFor: 'Swiss bank and one of the largest wealth managers in the world.',
    tweaks: { riskLimit: 0.25 },
  },
  {
    id: 'bnp-paribas',
    name: 'BNP Paribas',
    alias: 'Seine Paris Bank',
    archetype: 'bank',
    hq: 'Paris',
    knownFor: 'Largest bank in the eurozone, strong in derivatives.',
  },
];

export function getFirm(id: string): Firm {
  const f = FIRMS.find((x) => x.id === id);
  if (!f) throw new Error(`Unknown firm ${id}`);
  return f;
}

export function firmProfile(firm: Firm): StrategyProfile {
  return { ...ARCHETYPES[firm.archetype].profile, ...firm.tweaks };
}

export function displayName(firm: Firm, useRealNames: boolean): string {
  return useRealNames ? firm.name : firm.alias;
}
