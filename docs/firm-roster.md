# Firm roster

37 firms across 6 archetypes. Source of truth: `src/bots/firms.ts`.

> Names describe publicly reported trading styles only. Bots are caricatures, not real strategies. The alias column is shown instead of real names when `USE_REAL_NAMES` is `false` in `src/config.ts`.

## Market maker / HFT

Small edge, high volume, strict inventory limits.

| Firm                   | Alias             | HQ          | Publicly known for                                                                                 | Tweaks                          |
| ---------------------- | ----------------- | ----------- | -------------------------------------------------------------------------------------------------- | ------------------------------- |
| Citadel Securities     | Bastion Liquidity | Miami       | One of the largest market makers in US equities and options.                                       | looseness 0.66                  |
| Jane Street            | Lantern Row       | New York    | Major trading firm in ETFs, bonds and options, known for puzzles and probability-heavy interviews. | adaptivity 0.55, aggression 0.5 |
| Optiver                | Oakline Trading   | Amsterdam   | Options market maker founded in Amsterdam, active on exchanges worldwide.                          | pressureFold 0.7                |
| IMC Trading            | Canal Quotes      | Amsterdam   | Technology-driven market maker founded in Amsterdam, runs the IMC Prosperity competition.          | –                               |
| Susquehanna (SIG)      | Riverbend Group   | Bala Cynwyd | Options trading firm famous for using poker and game theory to train traders.                      | bluff 0.2, adaptivity 0.6       |
| Virtu Financial        | Vertex Flow       | New York    | Electronic market maker known for very consistent daily trading results.                           | bluff 0.06, pressureFold 0.85   |
| Flow Traders           | Delta Stream      | Amsterdam   | Liquidity provider specialising in exchange-traded products (ETPs).                                | –                               |
| Hudson River Trading   | Palisade Systems  | New York    | Algorithmic trading firm built around automated, research-driven strategies.                       | adaptivity 0.5                  |
| Jump Trading           | Leap Capital      | Chicago     | Chicago trading firm focused on research and low-latency technology.                               | aggression 0.55                 |
| Tower Research Capital | Spire Research    | New York    | High-frequency trading firm made up of many independent trading teams.                             | –                               |
| XTX Markets            | Matrix Pricing    | London      | London firm that prices markets with machine learning, a major FX liquidity provider.              | adaptivity 0.6, bluff 0.08      |

## Quant / stat-arb fund

Expected value, position sizing and adapting to data.

| Firm                         | Alias            | HQ            | Publicly known for                                                     | Tweaks                       |
| ---------------------------- | ---------------- | ------------- | ---------------------------------------------------------------------- | ---------------------------- |
| Renaissance Technologies     | Medley Labs      | East Setauket | Quant pioneer whose Medallion fund is famous for its long-run returns. | adaptivity 1, aggression 0.6 |
| Two Sigma                    | Second Deviation | New York      | Applies data science and machine learning to investment management.    | –                            |
| D. E. Shaw                   | Shore & Co.      | New York      | Early pioneer of computational, quantitative investing.                | looseness 0.42               |
| AQR Capital Management       | Factor Hill      | Greenwich     | Known for factor investing: value, momentum, quality and carry.        | momentum 0.2, adaptivity 0.6 |
| Qube Research & Technologies | Cubic Signal     | London        | Quantitative investment manager running systematic strategies.         | –                            |

## Global macro fund

Concentrated, high-conviction bets on a few big ideas.

| Firm                     | Alias               | HQ       | Publicly known for                                                      | Tweaks                          |
| ------------------------ | ------------------- | -------- | ----------------------------------------------------------------------- | ------------------------------- |
| Bridgewater Associates   | Keystone Principles | Westport | One of the largest hedge funds, built on systematic global macro views. | adaptivity 0.45, looseness 0.12 |
| Brevan Howard            | Harbour Macro       | London   | Macro fund known for trading interest rates and fixed income.           | –                               |
| Tudor Investment Corp    | Thornbury Capital   | Stamford | Discretionary macro fund founded by a well-known macro trader.          | bluff 0.28                      |
| Rokos Capital Management | Rook Macro          | London   | London macro fund focused on rates and global economic themes.          | –                               |

## Multi-strategy pod shop

Drawdown limits and risk management.

| Firm                      | Alias               | HQ       | Publicly known for                                                        | Tweaks         |
| ------------------------- | ------------------- | -------- | ------------------------------------------------------------------------- | -------------- |
| Millennium Management     | Centennial Partners | New York | Multi-manager platform with hundreds of teams and tight drawdown limits.  | stopLoss 0.2   |
| Citadel                   | Bastion Multi-Strat | Miami    | Multi-strategy hedge fund (separate from Citadel Securities).             | aggression 0.6 |
| Point72                   | Meridian Point      | Stamford | Multi-manager firm spanning discretionary and systematic strategies.      | –              |
| Balyasny Asset Management | Balance Street      | Chicago  | Multi-strategy firm running teams across equities, macro and commodities. | –              |
| ExodusPoint               | Outpost Capital     | New York | Multi-strategy fund launched in 2018.                                     | –              |

## Trend follower (CTA)

Momentum: recent winners tend to keep winning, until they do not.

| Firm                  | Alias            | HQ        | Publicly known for                                                          | Tweaks                        |
| --------------------- | ---------------- | --------- | --------------------------------------------------------------------------- | ----------------------------- |
| Man AHL               | Ridge Systematic | London    | Long-running systematic trend-following business within Man Group.          | –                             |
| Winton                | Windrow Research | London    | London firm that built its name on systematic, data-driven trend following. | momentum 0.6, adaptivity 0.35 |
| Aspect Capital        | Facet Futures    | London    | Systematic investment manager rooted in trend following.                    | –                             |
| Lynx Asset Management | Ocelot Trend     | Stockholm | Swedish systematic manager focused on trend following.                      | momentum 0.9                  |

## Investment bank

Capital requirements make regulated players cautious.

| Firm           | Alias              | HQ        | Publicly known for                                                     | Tweaks          |
| -------------- | ------------------ | --------- | ---------------------------------------------------------------------- | --------------- |
| Goldman Sachs  | Gilded Lane Bank   | New York  | Global investment bank with a large trading business.                  | aggression 0.38 |
| JPMorgan Chase | Morrow Chase Bank  | New York  | Largest US bank by assets, major markets and trading franchise.        | riskLimit 0.35  |
| Morgan Stanley | Stanton Hill Bank  | New York  | Investment bank with a large equities trading business.                | –               |
| Barclays       | Lombard Crown Bank | London    | British universal bank with a global markets division.                 | –               |
| HSBC           | Harbourline Bank   | London    | One of the largest banks in the world, strong in FX and Asian markets. | –               |
| Deutsche Bank  | Rhine Federal Bank | Frankfurt | Germany's largest bank, with a major fixed income and FX business.     | –               |
| UBS            | Alpine Union Bank  | Zurich    | Swiss bank and one of the largest wealth managers in the world.        | riskLimit 0.25  |
| BNP Paribas    | Seine Paris Bank   | Paris     | Largest bank in the eurozone, strong in derivatives.                   | –               |

## Adding a firm

1. Open a "New firm bot" issue with public sources.
2. Add an entry to `FIRMS` in `src/bots/firms.ts` with a unique `id`, `name` and fictional `alias`.
3. Pick the closest archetype and add `tweaks` only where the public description clearly differs.
4. Regenerate this file and run `npm run check`.
