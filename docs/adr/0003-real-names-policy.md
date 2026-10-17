# 0003. Real firm names, no logos, alias switch

- Status: Accepted
- Date: 2026-10-17

## Context

Playing against "Citadel Securities" or "Goldman Sachs" is the hook that makes people click. But the game is public, shared from a university society's LinkedIn page, and seen by staff of those firms. Using names could raise trademark or reputation concerns, and the Students' Union may have rules about external organisations.

## Decision

- Show real firm names as plain text, used descriptively.
- Never use logos, brand colours or trademarked imagery.
- Describe every firm only with neutral, public facts (`knownFor`).
- State clearly and repeatedly (footer, firm profiles, `DISCLAIMER.md`) that bots are caricatures, not real strategies, and that no firm is affiliated.
- Give every firm a fictional alias, and add `USE_REAL_NAMES` in `src/config.ts` to switch all names at once.

## Consequences

- The real-name hook works at launch.
- If a firm or the Students' Union objects, names can be removed with a one-line change and a redeploy, within minutes.
- Contributors adding firms must follow the rules in `CONTRIBUTING.md`.

This is a project decision, not legal advice. Check the Students' Union's rules before promoting the game.
