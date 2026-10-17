# Analytics

Poker Finance uses two analytics tools.

|                | Vercel Web Analytics                    | Google Analytics 4                                             |
| -------------- | --------------------------------------- | -------------------------------------------------------------- |
| Purpose        | Simple visit counts and traffic sources | Detailed behaviour: funnels, events, retention                 |
| Cookies        | None                                    | Yes                                                            |
| Consent needed | No                                      | Yes, via the in-game banner                                    |
| Code           | `<Analytics />` in `src/main.tsx`       | `src/analytics/googleAnalytics.ts`, `src/ui/ConsentBanner.tsx` |
| Dashboard      | Vercel → poker-finance → Analytics      | analytics.google.com                                           |

## Setting up Google Analytics

1. Go to [analytics.google.com](https://analytics.google.com) and sign in with the society's Google account.
2. **Admin → Create → Property.** Name it "Poker Finance", time zone United Kingdom, currency GBP.
3. Choose **Web** as the platform. Website URL: `https://dmu-poker-finance.vercel.app`. Stream name: "Poker Finance web".
4. Copy the **Measurement ID**. It looks like `G-ABC123XYZ`.
5. In Vercel: **poker-finance → Settings → Environment Variables → Add**
   - Key: `VITE_GA_MEASUREMENT_ID`
   - Value: your Measurement ID
   - Environments: Production (and Preview if you want to test on preview links)
6. **Deployments → latest → ⋯ → Redeploy.** Environment variables only apply to new builds.
7. Open the live site in a private window, click **Accept analytics**, play a hand, then check **Reports → Realtime** in GA.

Recommended GA settings: **Admin → Data collection and modification → Data retention** → 2 months (matches the privacy notice), and leave Google Signals off.

For local testing, copy `.env.example` to `.env.local` and fill in the ID. `.env.local` is git-ignored.

## How consent works

- Without `VITE_GA_MEASUREMENT_ID`, Google Analytics is completely off and no banner appears.
- With it, first-time visitors see a banner. Nothing loads from Google until they click **Accept analytics**.
- The choice is saved in the browser. **Cookie settings** in the footer re-opens the banner.
- Declining after accepting stops collection and deletes the `_ga` cookies.
- Advertising signals (ad storage, user data, personalisation) are always denied.

## Events

| Event              | When                                    | Parameters                            |
| ------------------ | --------------------------------------- | ------------------------------------- |
| `page_view`        | Page load (automatic)                   | GA defaults                           |
| `game_start`       | "Take a seat" in the lobby              | `currency`, `opponents_picked`        |
| `hand_complete`    | Every finished hand                     | `hand_number`                         |
| `view_firm`        | A firm's profile is opened from a seat  | `firm`                                |
| `tutorial_open`    | "How to play" opened                    |                                       |
| `firms_guide_open` | "The firms" guide opened                |                                       |
| `cash_out`         | "Cash out" clicked                      | `hands`, `net` (whole currency units) |
| `bust`             | Player's stack hits zero                | `hands`                               |
| `rebuy`            | Player rebuys after busting             |                                       |
| `share`            | Result copied or LinkedIn share clicked | `method` (`copy` or `linkedin`)       |

Useful GA explorations: a funnel of `page_view → game_start → hand_complete (hand_number ≥ 10) → share`, and `view_firm` counts to see which firms people are most curious about.

To add an event, call `track('event_name', { ...params })` from `src/analytics/googleAnalytics.ts`, then add it to this table and to `docs/privacy.md` if it collects anything new.
