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

## Project structure

```text
app/
  layout.tsx
  page.tsx
  components/
    AppShell.tsx
    UserMenu.tsx
assets/
  css/
    styles.css
src/
  client/
    app.ts
    leader.ts
    data/
      reference-data.ts
      seed-data.ts
```

- `app/page.tsx` provides the Next.js page shell and loads the browser-only demo.
- `app/components/AppShell.tsx` contains the shared sidebar, top bar, and shell components.
- `app/components/UserMenu.tsx` contains the user menu and its display preferences.
- `app/layout.tsx` contains the document metadata and shared stylesheet import.
- `src/client/data/reference-data.ts` contains shared demo lists.
- `src/client/data/seed-data.ts` contains the initial incident records.
- `src/client/app.ts` contains the existing incident workflows.
- `src/client/leader.ts` contains the team-leader reporting workflows.
- TypeScript browser scripts are compiled to ignored `public/generated/js/` assets before Next.js runs.
- `assets/css/styles.css` contains the page styles.

This is a demo without a backend, authentication, or access control. Changes
are saved only in the current browser.
