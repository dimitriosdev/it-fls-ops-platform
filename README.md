# IT Support Incident Demo

A Next.js browser application for the IT support incident-management demo.
Sample incidents and user changes are stored locally in the browser.

## Run locally

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Create a production build
with `npm run build` and serve it with `npm start`.

The browser-only workflow scripts are compiled from TypeScript before `dev`,
`build`, and `start`. Format TypeScript with `npm run format` and check it with
`npm run format:check`.

## Quality, commits and releases

- `npm run lint`, `npm run typecheck`, `npm run format:check` run in CI
  (`.github/workflows/ci.yml`) together with `npm run build`.
- Commits follow [Conventional Commits](https://www.conventionalcommits.org/),
  enforced by commitlint via a Husky `commit-msg` hook. Use `npm run commit`
  (Commitizen) for a guided prompt. A `pre-commit` hook formats staged files.
- `npm run release` bumps the version in `package.json` from the commit history
  (`feat` → minor, `fix` → patch, `BREAKING CHANGE` → major), updates
  `CHANGELOG.md`, commits and tags. Use `npm run release -- --first-release`
  for the first tag, then `git push --follow-tags`.

## Project structure

```text
app/
  layout.tsx, page.tsx      # page.tsx redirects to /dashboard
  login/, logout/           # local email + password (Neon Auth)
  (app)/                    # authenticated shell (sidebar, topbar)
    dashboard/, tickets/, admin/, support/
  stats/                    # staff-only statistics (server gate + client charts)
src/
  lib/                      # prisma singleton, auth, role helpers, i18n
  server/                   # queries.ts (reads), tickets.ts, users.ts (writes)
prisma/                     # schema, migrations, seed, ticket import
```

- Pages are React Server Components reading from PostgreSQL via `src/server/queries.ts`;
  writes go through Server Actions that call `src/server/tickets.ts` / `users.ts`.
- `/admin` is ADMIN only; `/support` and `/stats` are ADMIN and SUPPORTER; the rest needs a login.
- `assets/css/styles.css` contains the page styles.
