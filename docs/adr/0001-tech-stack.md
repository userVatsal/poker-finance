# 0001. React + TypeScript + Vite

- Status: Accepted
- Date: 2026-10-17

## Context

The game must run in any modern browser, load quickly from a LinkedIn link on a phone, and be maintainable by student contributors with mixed experience. The poker engine has fiddly rules (side pots, raise reopening) where type errors are costly.

## Decision

- **TypeScript (strict)** for everything, including `noUncheckedIndexedAccess`.
- **React 19** for the UI: the most widely known UI library, so new members can contribute.
- **Vite** for development and builds: fast reloads, zero-config TypeScript, static output.
- **Vitest** for tests: same config as Vite, Jest-compatible API.
- No router or state library. Two views and a few modals do not justify them.

## Consequences

- One language across engine, bots and UI.
- The engine is framework-free and could later run on a multiplayer server unchanged.
- Bundle is about 90 KB gzipped.
