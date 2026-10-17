# Deployment (Vercel)

The game is a static site. Vercel builds it from GitHub on every push.

## First-time setup

1. Go to [vercel.com](https://vercel.com) and **sign up with GitHub** (the Hobby plan is free).
2. Click **Add New → Project** and import `userVatsal/poker-finance`.
3. Vercel detects Vite from `vercel.json`. Leave the settings as they are:
   - Framework preset: Vite
   - Build command: `npm run build`
   - Output directory: `dist`
   - Node version: 22 (Project Settings → General)
4. Click **Deploy**. After about a minute you get a URL like `poker-finance.vercel.app`.

If Vercel gives a different URL (for example because the name is taken), update it in two places, then push:

- `SITE_URL` in `src/config.ts` (used for LinkedIn sharing)
- The `og:image` and `og:url` tags in `index.html` (used for the LinkedIn preview card)

## How deploys work

| Event                         | Result                                            |
| ----------------------------- | ------------------------------------------------- |
| Push or merge to `main`       | Production deploy                                 |
| Open or update a pull request | Preview deploy with its own URL, posted on the PR |

GitHub Actions (`.github/workflows/ci.yml`) runs lint, type checks, tests and a build on every push and PR. Protect `main` so PRs can only merge when CI passes: **GitHub → Settings → Branches → Add rule → Require status checks → `check`**.

## Custom domain (optional)

1. Buy a domain (for example `pokerfinance.dmuquant.com` as a subdomain of a society domain).
2. Vercel → Project → **Settings → Domains → Add**, then follow the DNS instructions.
3. Update `SITE_URL` and the Open Graph tags as above.

## Checking the LinkedIn preview

After deploying, paste the URL into the [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/). It shows the preview card and refreshes LinkedIn's cache if you changed the image.

## Rollback

Vercel → Project → **Deployments** → pick a previous deployment → **Promote to Production**.

## What `vercel.json` does

- Rewrites every path to `index.html` (single-page app).
- Caches built assets for a year (their filenames change on every build).
- Adds basic security headers: `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`.
