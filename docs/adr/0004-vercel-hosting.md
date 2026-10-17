# 0004. Host on Vercel

- Status: Accepted
- Date: 2026-10-17

## Context

We need free, reliable static hosting with HTTPS, preview links for pull requests (so non-coders on the committee can review changes), and no manual deploy steps.

## Decision

Deploy with Vercel's GitHub integration. `vercel.json` pins the Vite build, SPA rewrites, asset caching and security headers. GitHub Actions runs CI separately so quality checks don't depend on the host.

## Consequences

- Every merge to `main` is live in about a minute; every PR gets a preview URL.
- Free on the Hobby plan for this traffic level. If the society later needs a team account, Vercel's plans or a move to another static host (Netlify, Cloudflare Pages, GitHub Pages) are straightforward because the build is plain static files.
