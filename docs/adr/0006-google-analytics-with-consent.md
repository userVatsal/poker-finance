# 0006. Google Analytics 4 behind a consent banner

- Status: Accepted
- Date: 2026-10-17

## Context

Vercel Web Analytics gives cookie-free visit counts but no detail on how people play: how many start a game, how long they stay, which firms interest them, whether they share. The society wants that detail to improve the game and to show reach to partners.

Google Analytics 4 provides it, but it sets cookies. Under UK GDPR and PECR, non-essential cookies need the visitor's prior consent.

## Decision

- Add GA4, loaded only after the visitor clicks **Accept analytics** in a banner. Nothing is requested from Google before that.
- Keep Vercel Web Analytics for cookie-free counts of everyone, including people who decline.
- Configure GA via the `VITE_GA_MEASUREMENT_ID` environment variable. Without it, GA and the banner are off.
- Deny all advertising consent signals and anonymise IPs.
- Provide **Cookie settings** in the footer to change the choice; withdrawing deletes `_ga` cookies.
- Publish a privacy notice (`docs/privacy.md`) and an event list (`docs/analytics.md`).

## Consequences

- Detailed game analytics for visitors who consent; anonymous counts for everyone.
- A banner appears on first visit once GA is configured, which adds a little friction.
- GA numbers will be lower than Vercel's because some visitors decline or block it. Compare trends, not totals.
- The event list and privacy notice must be kept in step whenever an event is added.
