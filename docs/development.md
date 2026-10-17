# Development setup (macOS + JetBrains)

## 1. Install the tools

1. **Node.js 22.** Easiest: install [Homebrew](https://brew.sh), then run `brew install node@22`. Check with `node -v`.
2. **Git.** macOS asks to install the command line tools the first time you run `git`. Accept.
3. **WebStorm** (free for students via the JetBrains Student Pack) or IntelliJ IDEA Ultimate.

## 2. Open the project

1. In WebStorm: **File → New → Project from Version Control**.
2. URL: `https://github.com/userVatsal/poker-finance.git`. Click **Clone**.
3. When WebStorm offers to run `npm install`, click **Run**. Or open the terminal (⌥F12) and run `npm install`.

## 3. Run it

The repo includes shared run configurations in `.idea/runConfigurations/`. They appear in the run menu at the top right:

| Configuration | What it does                                                                                         |
| ------------- | ---------------------------------------------------------------------------------------------------- |
| **npm dev**   | Starts the dev server. Open the printed URL (usually http://localhost:5173). Edits reload instantly. |
| **npm test**  | Runs all tests once.                                                                                 |
| **npm check** | Runs everything CI runs: lint, types, tests, build. Run this before every push.                      |

If they don't appear, open `package.json` and click the green ▶ next to any script.

## 4. Recommended settings

- **Settings → Languages & Frameworks → JavaScript → Prettier:** enable "Automatic Prettier configuration" and "Run on save".
- **Settings → Languages & Frameworks → JavaScript → Code Quality Tools → ESLint:** "Automatic ESLint configuration" and "Run eslint --fix on save".
- **Settings → Languages & Frameworks → Node.js:** point to Node 22.
- Vitest tests show a green ▶ in the gutter. Click it to run one test.

## 5. Everyday workflow

1. Pull the latest `main` (**Git → Pull**, or ⌘T).
2. Create a branch (**Git → New Branch**), e.g. `feat/eur-tables`.
3. Make changes, run **npm check**.
4. Commit (⌘K) with a [Conventional Commit](https://www.conventionalcommits.org/) message.
5. Push (⌘⇧K) and open a pull request on GitHub. Vercel posts a preview link on the PR.

## Useful files

| File                         | Why you would touch it                 |
| ---------------------------- | -------------------------------------- |
| `src/config.ts`              | Real-names switch, bot speed, site URL |
| `src/bots/firms.ts`          | Add or tweak a firm                    |
| `src/bots/archetypes.ts`     | Change a whole trading style           |
| `src/bots/deskNotes.ts`      | Edit the educational notes             |
| `src/currency/currencies.ts` | Turn on a currency                     |
| `src/styles/theme.css`       | Colours and layout                     |

## Troubleshooting

- **`command not found: npm`** — Node isn't installed or the terminal needs restarting.
- **Port 5173 in use** — Vite picks the next free port and prints it.
- **Tests fail after changing a bot** — check `npm run simulate`. The simulation test protects archetype personalities.
