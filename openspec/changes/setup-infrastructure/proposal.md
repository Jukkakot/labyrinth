# Proposal

## Why

The scaffold has deployment configuration (GitHub Pages workflow, `render.yaml`) but nothing is live yet. The client does not know where the server is, and the debugging tools have not been verified. `add-logging` needs a running Render service to check its log output, and every later change needs a working deploy pipeline and debugging tools. This change makes the whole path live and verified before any feature work.

## What Changes

- **GitHub Pages:** the first client deploy, verified at `https://jukkakot.github.io/labyrinth/`.
- **Render:** the server service is created from `render.yaml` (Blueprint), verified via `/health`, and deploys automatically after CI passes.
- **Server URL:** the client reads its server URL from `VITE_SERVER_URL`. Locally it is `http://localhost:2567`; in production it comes from a GitHub Actions repository variable.
- **CORS:** the server allows cross-origin requests only from the GitHub Pages origin and localhost, configured through `ALLOWED_ORIGINS`.
- **Debugging tools:**
  - Playwright MCP is verified working, with a second, mobile-emulating instance.
  - VS Code launch configurations let breakpoints be set in the server and the client.
  - Render MCP is verified able to read the service's logs.
- **Documentation:** production URLs and the Render service id are recorded in `.claude/CLAUDE.md`.
- No specs: no game behaviour changes (`skip_specs`).
- Workspaces touched: server (CORS), client (server URL config). Also CI and deploy configuration and editor/MCP configuration.

## Capabilities

### New Capabilities
<!-- none: infrastructure only, skip_specs is set -->

### Modified Capabilities
<!-- none -->

## Impact

- **server**: CORS middleware (new dependency `cors`), `ALLOWED_ORIGINS` environment variable.
- **client**: `VITE_SERVER_URL` configuration module and typed env declaration.
- **CI/deploy**: `deploy-client.yml` passes `VITE_SERVER_URL`; `render.yaml` adds `ALLOWED_ORIGINS`.
- **Tooling**: `.mcp.json` (mobile Playwright instance), `.vscode/launch.json` and `extensions.json`, `.gitignore` exception for `.vscode/launch.json`.
- **External accounts**: one Render Blueprint connection in the dashboard (manual, by the user), and GitHub repository variables. Cost stays 0 €.
- `add-logging` reuses this CORS configuration for its client-log endpoint.
