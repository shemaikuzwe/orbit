# Orbit

A client-side Linear-inspired starting point built with Next.js 16, React 19, TypeScript, Tailwind CSS v4, shadcn/ui, pnpm, and @hello-pangea/dnd.

## Run

```sh
pnpm install
pnpm dev
```

Open http://localhost:3000. `pnpm build` checks the production build; `pnpm typecheck` checks TypeScript.

## Features

- Drag issues between statuses and reorder them within a column (mouse, touch, keyboard).
- Create, edit, and delete issues, including description, status, priority, assignee, label, and project.
- Create projects and open their filtered issue boards.
- Board/list views, search, priority filter, and C / Cmd+K shortcuts.

State is intentionally in memory: refreshing resets the workspace to its sample data. There is no API, database, localStorage, authentication, or sync implementation.

## Sync starting point

`lib/workspace.ts` defines the domain types, seed state, typed actions, and pure reducer. `components/workspace.tsx` owns the reducer and view state. A sync engine can produce/consume those actions and replace the initial snapshot without changing issue and project UI. Seed identifiers are human-readable; new projects use UUIDs and new issues use session-local sequential identifiers. Replace the issue ID allocator when introducing concurrent clients.

## Styling

Component styling uses Tailwind utilities. `app/globals.css` contains shared shadcn theme tokens and base styles. Generated shadcn primitives live in `components/ui`; add more with `pnpm dlx shadcn@latest add <component>`.
