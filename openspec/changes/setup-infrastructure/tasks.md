# Tasks

## 1. Configuration in the repo

- [x] 1.1 Restrict CORS to an `ALLOWED_ORIGINS` allow-list via Colyseus's CORS hook (localhost/LAN dev origins allowed outside production) and `ALLOWED_ORIGINS=https://jukkakot.github.io` in `render.yaml`; verify by server test that a request with an allowed Origin gets `Access-Control-Allow-Origin` and a disallowed one does not
- [x] 1.2 Add `client/src/config.ts` reading `VITE_SERVER_URL` (dev fallback `http://localhost:2567`, clear error when used in a production build without it — resolved on use so the first Pages deploy works before Render exists) with a typed `vite-env.d.ts`, and pass `VITE_SERVER_URL: ${{ vars.VITE_SERVER_URL }}` in `deploy-client.yml`; verify by unit tests: dev fallback, trailing-slash trim, production error when missing
- [ ] 1.3 Add `.vscode/launch.json` (Server via tsx with `--conditions=source`, Client via Chrome, compound Full stack) and `.vscode/extensions.json`, and allow `launch.json` in `.gitignore`; verify the Server configuration starts and stops at a breakpoint in `packages/rules`
- [x] 1.4 Add a `playwright-mobile` instance (`--device "iPhone 15"`) to `.mcp.json`; verify both Playwright MCP instances can open the local client after a Claude Code restart (install chromium and pin `--browser chromium` if needed)
- [x] 1.5 Run lint, typecheck, test and build and commit; ask the user to push

## 2. Deployments

- [ ] 2.1 After the push, verify with `gh run list` that CI and "Deploy client" succeed, and with Playwright MCP that `https://jukkakot.github.io/labyrinth/` shows the Finnish UI at a mobile viewport
- [ ] 2.2 Ask the user to create the Render service from the Blueprint (dashboard: New → Blueprint → Jukkakot/labyrinth); then with Render MCP select the workspace, find the service, read its URL and confirm the latest deploy is live and `/health` returns `{"status":"ok"}`
- [ ] 2.3 Set the GitHub variable `VITE_SERVER_URL` to the Render URL (`gh variable set`) and re-run "Deploy client"; verify with Playwright MCP from the Pages origin that `fetch(<server>/health)` succeeds (CORS allowed)
- [ ] 2.4 Verify with Render MCP `list_logs` that the service's startup lines can be read and filtered by text

## 3. Documentation

- [ ] 3.1 Record the production client URL, server URL, Render service id and the "user pushes, Render deploys after CI" flow in `.claude/CLAUDE.md`; verify the documented URLs respond
