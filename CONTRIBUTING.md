# Contributing to Poker Finance

Thanks for helping. This project is run by DMU Quant Society and is open to members and the public.

## Ways to help

- **Report a bug** with the "Bug report" issue template.
- **Suggest a feature** with the "Feature request" template.
- **Propose a new firm** with the "New firm bot" template. Include public sources for how the firm trades.
- **Improve a bot.** Tune dials in `src/bots/archetypes.ts` or `src/bots/firms.ts` and show the effect with `npm run simulate`.
- **Write a desk note.** Add or improve explanations in `src/bots/deskNotes.ts`.
- **Fix docs.** Typos and clearer explanations are always welcome.

## Workflow

1. Fork the repo (members can branch directly).
2. Create a branch from `main` using a prefix:
   - `feat/` new feature, `fix/` bug fix, `docs/` documentation, `bot/` bot tuning, `chore/` tooling
   - Example: `feat/eur-tables`, `bot/tune-macro-sizing`
3. Make your change. Keep pull requests small and focused.
4. Run `npm run check`. It must pass: lint, types, tests and build.
5. Open a pull request and fill in the template. Vercel posts a preview link automatically.
6. A maintainer reviews it. Once approved, it is squash-merged into `main` and deploys.

## Commit messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add EUR and GBP tables
fix: return uncalled bet when everyone folds to an all-in
docs: explain Kelly sizing in bot-strategies.md
bot: make macro funds overbet less often
```

## Code standards

- TypeScript strict mode. No `any` without a comment explaining why.
- The engine (`src/engine/`) stays pure: no React, no DOM, no `Math.random()`. Use the seeded `Rng`.
- Every engine or bot change needs a test in `tests/`.
- Money is always an integer in the currency's minor units. Never use floats for chips.
- UI copy: plain English, sentence case, no jargon without an explanation.
- Run `npm run format` before committing.

## Rules for firm bots

- Base the profile only on **public** descriptions of the firm's business. Cite sources in the issue or pull request.
- Never claim a bot reproduces a firm's real strategy.
- No logos, trademarks in images, or anything implying endorsement.
- Every firm needs a unique fictional `alias`.
- Keep `knownFor` factual and neutral. Nothing negative or speculative about a real company.

## Questions

Open a discussion or message the society on LinkedIn.
