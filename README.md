# IT FLS Operations Platform

A Next.js application for reporting and handling IT support tickets, viewing
reports, and requesting inventory orders. Tickets, users, and inventory order
requests are stored in PostgreSQL; authentication is provided by Neon Auth.
The inventory catalog is currently sample data in the repository, not a live
stock database.

## Requirements

- Node.js `^20.19.0`, `^22.12.0`, or `>=24.0.0` and npm.
- A PostgreSQL database accessible through Neon and a Neon Auth instance.
- A Neon Auth trusted origin for the application (and for the seed command, if
  different).

## Configuration

Copy [`.env.example`](.env.example) to `.env` and set the following values:

| Variable                  | Purpose                                                                                                                              |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `DATABASE_URL`            | Pooled PostgreSQL connection used by the application, seed, and import scripts.                                                      |
| `DIRECT_URL`              | Direct PostgreSQL connection used by the Prisma CLI for migrations.                                                                  |
| `NEON_AUTH_BASE_URL`      | Base URL of the Neon Auth instance.                                                                                                  |
| `NEON_AUTH_COOKIE_SECRET` | Cryptographically random secret of at least 32 characters for auth cookies.                                                          |
| `ADMIN_EMAIL`             | Initial admin email for the seed command; it must use `@digitecgalaxus.ch`.                                                          |
| `ADMIN_PASSWORD`          | Initial admin password for the seed command; 12–128 characters.                                                                      |
| `SEED_ORIGIN`             | Optional origin sent to Neon Auth by the seed command; defaults to `http://localhost:3000` and must be trusted by the auth instance. |

`STATS_PIN` is present in the example environment and CI configuration, but
the current statistics page uses role-based access rather than a PIN. Keep
secrets out of source control and use separate credentials and databases for
development and production.

## Local setup

```bash
npm ci
npx prisma migrate deploy
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with the
seeded admin credentials. `npm run dev` generates the Prisma client before
starting Next.js. The seed creates the initial admin's Neon Auth account and
local profile; if an active admin profile already exists for `ADMIN_EMAIL`,
it makes no changes. The seed currently uses the name defined in
[`prisma/seed.ts`](prisma/seed.ts).

To build and run the production server:

```bash
npm run build
npm start
```

`npm run build` also generates the Prisma client. Apply migrations with
`npx prisma migrate deploy` as part of deployment before starting the updated
application. After changing the schema, regenerate the client with
`npm run db:generate` and restart any running development server so its cached
Prisma instance is replaced. An undefined model delegate such as
`prisma.inventoryOrder` can indicate a stale running client; a missing table
indicates that the corresponding migration has not been applied.

## Authentication and access

Neon Auth stores credentials; the local `User` record supplies the application
role and active flag. Signing in requires an active local user profile. Admins
can create accounts and manage roles, activation, and passwords in Settings.
Account creation through the admin flow, the app's email-signup endpoint, and
the initial-admin seed is restricted to `@digitecgalaxus.ch`. This application
check does not configure restrictions on direct access to the Neon Auth
service; configure the provider separately if direct registration is enabled.

| Role        | Ticket access and navigation                                                       | Inventory and administration                                                                  |
| ----------- | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `REPORTER`  | Dashboard and personal Reports; can create tickets and see only their own tickets. | No inventory or Settings access.                                                              |
| `SUPPORTER` | Dashboard and staff Reports; can see and handle all tickets.                       | Inventory Dashboard and Request order; can submit requests and see their own.                 |
| `ADMIN`     | Same staff ticket dashboard and reports as supporters.                             | Inventory Dashboard and Request order; can view and review all requests, and access Settings. |

The staff dashboard defaults to **New** tickets; tabs select all, open, new,
resolved, or closed tickets. Search and workplace, category, and assignee
filters update automatically. The reporter dashboard defaults to all of the
reporter's tickets and offers search and status tabs. Ticket lists use a table
on larger screens and cards on mobile; mobile navigation exposes direct links.
German and English are available through the user menu, along with theme
preferences. Staff statistics have their own language toggle.

## Ticket workflow

- Signed-in users can create tickets with a workplace, category, and
  description. Existing workplace/category names are suggested, and new names
  are saved as lookup values.
- A new ticket starts as `NEW`. Staff can take it over, moving it to
  `IN_PROGRESS`; admins can assign open tickets to an active supporter or
  admin.
- Staff can record a resolution, including optional time spent and external
  follow-up details. The reporter can also mark their own open ticket resolved.
  Staff or the reporter can close a resolved ticket, or reopen a resolved or
  closed ticket. A reopened ticket becomes `IN_PROGRESS` if assigned and `NEW`
  otherwise.
- Reporters can edit the description, workplace, and category of their own open
  tickets. Ticket details show status, assignment, resolution, attachments, and
  history where available.
- Reporter Reports summarizes the user's ticket total, categories, and
  workplaces. Staff Reports provides a statistics dashboard with date and
  supporter filters.

## Inventory and order requests

Supporters and admins can open **Inventory → Dashboard** to view the sample
catalog, its storage location, stock, minimum levels, and low-stock indicators.
The catalog is defined in
[`src/server/inventory-catalog.ts`](src/server/inventory-catalog.ts); editing
stock requires changing that file and deploying the application. Counts are not
adjusted automatically, and the availability shown is sample data.

**Inventory → Request order** allows a supporter or admin to choose a catalog
item, enter a quantity from 1 to 500, a business reason, and optional notes.
Requests are stored in the `inventory_orders` table as `PENDING`. Supporters
see their own requests; admins see all requests and can approve or reject
pending requests with an optional comment. A request can be reviewed only
once. The decision records the reviewer and review time, and the requester can
see the status and comment on the request page. Approval records a decision
only: it does not place an external order or update inventory stock.

## Importing ticket data

The optional importer reads
[`prisma/data/tickets-since-2026-09.json`](prisma/data/tickets-since-2026-09.json):

```bash
npm run db:import-tickets -- --dry
npm run db:import-tickets
```

The dry run reports counts without writing. The import creates missing local
user profiles, workplaces, categories, closed tickets, and history; it uses
source message IDs to avoid reimporting tickets and can backfill missing
assignees and time spent. Imported profiles are not Neon Auth login accounts.
Review the input and target database before running the non-dry import.
The scripts in [`scripts/`](scripts/) produce cleaned or inferred copies of
raw exports and can alter resolver/time data; read their usage and inference
rules before using their output.

## Quality, commits, and releases

- `npm run lint`, `npm run typecheck`, `npm run format:check`, and
  `npm run build` are configured in [CI](.github/workflows/ci.yml).
  `npm run format` formats TypeScript files under `app/`.
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
  login/, logout/, api/auth/  # Neon Auth login and proxy routes
  (app)/                      # authenticated shell and role-specific navigation
    dashboard/, reports/      # ticket dashboards and reporter reports
    tickets/, support/        # ticket creation, details, actions, and staff redirect
    stats/, admin/            # staff statistics and admin settings
    inventory/                # inventory dashboard and order requests/review
    _components/              # shared UI, navigation, and filter components
src/
  lib/                        # Prisma singleton, auth, role helpers, i18n
  server/                     # ticket queries/actions, users, sample inventory catalog
prisma/                       # schema, migrations, seed, and ticket import
assets/css/                   # application styles
```

Pages and server actions enforce access with the helpers in
[`src/lib/auth/authorization.ts`](src/lib/auth/authorization.ts). The
[`proxy.ts`](proxy.ts) middleware provides an optimistic session check for
matched routes, not the role authorization boundary. Prisma generates the
client into `src/generated/prisma`.
