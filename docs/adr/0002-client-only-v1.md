# 0002. No backend in v0.1

- Status: Accepted
- Date: 2026-10-17

## Context

v0.1 is single-player against bots. A backend would add cost, an attack surface, personal-data obligations (UK GDPR) and sign-up friction, which hurts a LinkedIn launch where people click once and decide in seconds.

## Decision

Run everything in the browser. No accounts, no server, no analytics cookies. The only stored data is an optional display name in the player's own `localStorage`.

Update (2026-10-17): Vercel Web Analytics was added to count page views. It is cookie-free, does not identify individual visitors, and runs only on the Vercel deployment. Google Analytics with a consent banner followed; see [ADR 0006](0006-google-analytics-with-consent.md).

## Consequences

- Free hosting, nothing to keep running, nothing to breach.
- Players could inspect bot logic in the browser. That is fine: the game is educational and the code is open source anyway.
- Leaderboards and multiplayer need a backend later (planned for v0.5 and v1.0, each with its own ADR and a privacy notice).
