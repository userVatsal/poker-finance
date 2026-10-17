# Architecture decision records

Short records of significant decisions: the context, what we chose and why. Add a new numbered file for each new decision; never rewrite an accepted one, supersede it instead.

| #                                             | Decision                                   | Status   |
| --------------------------------------------- | ------------------------------------------ | -------- |
| [0001](0001-tech-stack.md)                    | React + TypeScript + Vite                  | Accepted |
| [0002](0002-client-only-v1.md)                | No backend in v0.1                         | Accepted |
| [0003](0003-real-names-policy.md)             | Real firm names, no logos, alias switch    | Accepted |
| [0004](0004-vercel-hosting.md)                | Host on Vercel                             | Accepted |
| [0005](0005-integer-money.md)                 | Integer minor units for all money          | Accepted |
| [0006](0006-google-analytics-with-consent.md) | Google Analytics 4 behind a consent banner | Accepted |

Template:

```markdown
# NNNN. Title

- Status: Proposed | Accepted | Superseded by NNNN
- Date: YYYY-MM-DD

## Context

## Decision

## Consequences
```
