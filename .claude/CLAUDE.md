# Labyrinth – working instructions

## Knowledge base

The project wiki is [docs/README.md](../docs/README.md): architecture, operations (environments,
deploy, logs, bug runbook), development (run, test, debug, conventions). Start any planning or
investigation there, then verify against the code. Keep it current: every change updates the wiki
pages it affects (enforced by `openspec/config.yaml` rules and archive guidance).

## Session start

At the start of every session, before doing anything else: read `openspec/context/roadmap.md` and
run `openspec list`, then tell the user in two or three lines where the project stands (last
finished change, active change and its task progress, the natural next step).

## OpenSpec workflow (use it proactively)

This project is spec-driven with OpenSpec. Use the OpenSpec skills/commands on your own
initiative whenever they fit; do not wait to be asked. When unsure whether one fits, suggest it.

- New feature or behaviour change → `openspec-propose` (proposal, specs, design, tasks),
  then stop for the user's review before implementing.
- Idea still unclear, or a question that affects several changes → `openspec-explore`.
- Plan changes mid-way → `openspec-update-change`.
- User approves a proposal → `openspec-apply-change`.
- Change implemented, verified and committed → suggest `openspec-archive-change`.
- **Fast lane** ("pikakaistalla", or a change with no new UX or rule decisions, e.g. a pure
  refactor or technical fix): propose and apply in one go without stopping for review, then stop
  at the end with the summary, a short "what to look at" list and "How to check". If a real
  decision turns up while working, stop and ask instead of deciding.
- Pure tooling or refactoring with no behaviour change needs no change; just do it (and still
  update the wiki if it affects it).
- After finishing a step, name the natural next OpenSpec step.

## Autopilot (foundation phase — currently ON)

While we are building roadmap features for the first time ("laying foundations"), the user trusts
Claude's judgement and does not want to approve every step. This overrides the review stops above:

- Run the loop without asking: propose → apply → verify (checks + UI check where visible) →
  commit → archive (sync specs, update roadmap and wiki) → commit → propose the next roadmap item
  → apply → …
- Make UX and rule decisions yourself, using the rules of the original board game, the memory
  notes and the existing specs. Record each non-obvious one in the change's `design.md` and list
  them in the summary so the user can revisit them later.
- Stop and ask only for: spending money or creating external accounts/services, anything
  irreversible outside the repo, a decision that would force rework of already built features, or
  failing checks you cannot fix.
- At each archived change, give a one-paragraph summary (what was built, decisions made, How to
  check) and keep going. When the session gets long, finish the current change, then recommend a
  new session with a handover instead of starting the next one.

Autopilot ends when the user says so, or when the work turns to refining existing features or
fixing bugs: then the normal review stops apply again, because the user wants to validate that
everything works and is final.

## Working agreements

- Work locally: commit, but do not push, wait for CI or deploy. The user pushes and deploys
  manually; list any production checks for them in the summary instead.
- End every summary that changed something visible or runnable with a short "How to check"
  (a few steps: which command, which URL, what to tap, what you should see). Keep it cheap: no
  extra work just to produce it; skip it when nothing user-visible changed.
- Bug reports ("around 14:30 in game brave-otters-sing, X happened"): follow
  [docs/operations.md → Investigating a reported bug](../docs/operations.md#investigating-a-reported-bug).
- UI checks: Playwright MCP `playwright-mobile` (Galaxy S24), **portrait only** by default. Check
  landscape and a narrow desktop only when a change reshapes a layout (new screen, new layout
  structure). This overrides the global "test every UI change in three sizes" rule for this
  project. Save screenshots under `.playwright-mcp/` (git-ignored) and close the tabs you opened
  when the check is done.
- Before a UI check or E2E run, make sure the dev servers are the current code: `npm run dev` in
  this repo is `tsx watch` + Vite (both reload by themselves); anything else listening on
  2567/5173 (an old build, another checkout) must be stopped first. Check with PowerShell
  `Get-NetTCPConnection -LocalPort 2567,5173 -State Listen` and the owning process command line.
- Before committing, run the check chain **once**, right before the commit (not after every task
  group; while working, run only the tests of the workspace you touch):
  `npm run lint && npm run typecheck && npm test && npm run build && npm run size -w @labyrinth/client`.
- Changes may be large (a whole roadmap item at once); the user prefers progress over small steps.
