# Development

## Setup and run — Implemented

- Requires Node 22 (`.nvmrc`) and npm 11. `npm install` at the repo root installs all workspaces.
- `npm run dev` starts both:
  - server on http://localhost:2567 (`/health`, `/monitor`, `/playground`)
  - client on http://localhost:5173 (also on the LAN for phones: see the Vite output)
- In development the client is served at `/`; production uses `/labyrinth/`.
- Two browser tabs are two players (session per tab).
- Logs: the terminal shows pretty lines; `logs/dev.log` has the same entries as JSON (server and
  client). Add `?debug=1` to the client URL to also get its debug entries. Clear the file only
  while the server is stopped (it keeps the file open).

## Checks — Implemented

Run before every commit (CI runs the same):

```
npm run lint && npm run typecheck && npm test && npm run build && npm run size -w @labyrinth/client
```

- Lint: oxlint (root `.oxlintrc.json`). No formatter.
- Bundle budget: client JavaScript ≤ 200 kB gzip (size-limit, fails CI).
- Tests: Vitest in every workspace. Server test files run one at a time because each boots a
  real Colyseus server (`fileParallelism: false`).

## Testing approach

| Level | Tools | Status |
|---|---|---|
| Rules | Vitest; fast-check for invariants; test names follow spec scenarios | Implemented (first rules come with `add-board-model`) |
| Server | Vitest + @colyseus/testing (real rooms, SDK clients in-process); `captureLogs()` asserts log lines | Implemented |
| Client | Vitest; jsdom + Testing Library for components (`// @vitest-environment jsdom`) | Implemented |
| E2E | Playwright, Galaxy S24 profile, two players in two contexts | Planned (`show-board`) |

## Debugging — Implemented

- **VS Code**: Run and Debug → "Server" (tsx with the `source` condition, so breakpoints in
  `packages/rules` work), "Client" (Chrome + Vite), or "Full stack".
- **Playwright MCP** (for Claude): `playwright-mobile` = Galaxy S24 (default for UI checks),
  `playwright-ios` = iPhone 15, `playwright` = desktop; all headless and isolated.
- **Render MCP** (for Claude): deploys, service details, production logs. See
  [operations.md](operations.md).

## Conventions — Implemented

- English for all code, identifiers, file and package names; UI text Finnish first + English,
  always through i18next.
- Prefer established libraries over hand-written plumbing; game rules are our own code.
- Conventional commits (`feat:`, `fix:`, `docs:`, `chore:` …), directly on `main`.
- Reference device: Samsung Galaxy S24 (360×780 CSS px); Android primary, iOS must work; tap
  targets ≥ 44 px.
- Planning: OpenSpec (`/opsx:*`). Each change updates the wiki pages it affects.
