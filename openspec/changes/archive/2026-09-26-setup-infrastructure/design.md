# Design

## Context

Current state (commits `033aa38`…):
- `.github/workflows/ci.yml` and `deploy-client.yml` exist but have never run, because nothing has been pushed.
- GitHub Pages is enabled with the Actions source.
- `render.yaml` defines `labyrinth-server` (free plan, Frankfurt, build filter, `autoDeployTrigger: checksPass`, `/health`), but no service exists.
- `.mcp.json` registers Playwright MCP, which has not been tried.
- Render MCP is configured at user level.
- The client has no server URL. The server has no CORS configuration beyond Colyseus's matchmaking defaults.

Constraints: 0 € budget; the user pushes manually (the assistant never pushes).

## Goals / Non-Goals

**Goals:**
- A push to main results in a deployed client and server, each checked once end to end.
- Every debugging tool the project relies on is proven to work before it is needed.

**Non-Goals:**
- E2E test harness (planned with `show-board`, when there is a UI flow to test).
- Logging setup (`add-logging`).
- Custom domain, keep-alive pinging, paid plans.
- SPA deep-link routing on Pages (decided in `lobby`, when invite links appear).

## Decisions

### 1. Render service from Blueprint, not from Render MCP
Render MCP's `create_web_service` cannot set `healthCheckPath`, `buildFilter` or the "deploy after CI checks pass" trigger. Those settings live in `render.yaml`, so the service is created once in the dashboard (New → Blueprint → `Jukkakot/labyrinth`). After that, Render MCP is used to verify the service, read deploys and read logs. The user does the one dashboard step; everything else is scripted or done by the assistant.

### 2. Server URL as build-time config
The client reads `import.meta.env.VITE_SERVER_URL` from `client/src/config.ts`, which falls back to `http://localhost:2567` in development. In a production build without the value it throws when first used, not at startup, so the first Pages deploy (before Render exists) still loads. The production value is a GitHub Actions repository variable (`gh variable set VITE_SERVER_URL`), used by `deploy-client.yml`. It is not a secret, so a variable rather than a secret. It is set once the Render URL is known.
- Alternative considered: runtime discovery (fetching a config file). It adds a request and a failure mode for no benefit at this size.

### 3. CORS through Colyseus's own hook and an explicit allow-list
`ALLOWED_ORIGINS` is a comma-separated list: `https://jukkakot.github.io` in `render.yaml`. In development, localhost and LAN dev origins are allowed as well.
- Found during implementation: Colyseus's HTTP router adds CORS headers to **every** response, Express routes included, and by default echoes any `Origin`. A separate `cors` middleware would therefore be redundant and would be overridden.
- Instead, `configureCors()` uses the documented override `matchMaker.controller.getCorsHeaders`, and removes the wildcard default. An allowed origin is echoed with `Vary: Origin`; any other origin gets no `Access-Control-Allow-Origin` at all. This covers matchmaking and our own routes in one place.

### 4. Three Playwright MCP instances
`playwright` (desktop viewport), `playwright-mobile` (`--device "Galaxy S24"`, the reference device; Android is primary) and `playwright-ios` (`--device "iPhone 15"`) in `.mcp.json`. They run `--isolated` so they can be open at the same time, and `--headless` so no windows pop up. If the chosen browser is missing, the task installs it with `npx playwright install chromium` and pins `--browser chromium`.

### 5. VS Code debugging
`.vscode/launch.json`:
- "Server" launches `src/index.ts` through tsx with `--conditions=source`, so breakpoints in `packages/rules` work too.
- "Client" launches Chrome against the Vite dev server.
- "Full stack" is a compound of the two.

`extensions.json` recommends the Vitest, Playwright and oxc extensions.

### 6. Verification through the real path
Each step is checked through the same path players use:
- Pages URL loads and shows the Finnish UI.
- `/health` answers on the Render URL.
- From the Pages origin, the browser can call the server (CORS).
- Render MCP returns the service's startup log lines.

## Risks / Trade-offs

- [Render free service sleeps, so the first request after idle takes about a minute] → Accepted (0 € decision). Verification allows for it.
- [The Render service name may already be taken, which changes the URL] → The URL is read back from Render MCP and written to the repository variable and to CLAUDE.md, never assumed.
- [Assistant cannot push] → Tasks that need a deploy stop and ask the user to push, then continue verification.
