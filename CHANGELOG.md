# Changelog

All notable changes to this project are recorded here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.1.0] - 2026-10-17

First public build.

### Added

- No-Limit Texas Hold'em engine with blinds, minimum-raise rules, short all-in handling, side pots, split pots and automatic board run-outs.
- Fast 5–7 card hand evaluator and Monte Carlo equity estimator.
- Seeded random number generator so any session can be replayed from its seed.
- Six trading archetypes (market maker, stat-arb, macro, multi-strategy, trend, bank) with nine strategy dials each.
- 37 firm bots with per-firm tweaks and fictional aliases.
- Bot brain with stop-loss, momentum, capital limits, half-Kelly sizing and adaptation to the human player.
- Desk notes explaining the finance concept behind bot moves, held until the hand ends.
- Lobby with opponent picker, table view, firm profiles, how-to-play guide and firms guide.
- Report card with P&L, return, play-style read and LinkedIn sharing.
- USD currency, with EUR, GBP, JPY, CNY, INR and 14 further currencies configured but not yet enabled.
- Real-names switch in `src/config.ts`.
- Vercel config, GitHub Actions CI, issue and pull request templates, JetBrains run configurations.
- Documentation: architecture, rules, bot strategies, roster, currencies, roadmap, brand, development, deployment and ADRs.

[Unreleased]: https://github.com/userVatsal/poker-finance/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/userVatsal/poker-finance/releases/tag/v0.1.0
