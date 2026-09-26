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

## Working agreements

- Work locally: commit, but do not push, wait for CI or deploy. The user pushes and deploys
  manually; list any production checks for them in the summary instead.
- End every summary that changed something visible or runnable with a short "How to check"
  (a few steps: which command, which URL, what to tap, what you should see). Keep it cheap: no
  extra work just to produce it; skip it when nothing user-visible changed.
- Bug reports ("around 14:30 in game brave-otters-sing, X happened"): follow
  [docs/operations.md → Investigating a reported bug](../docs/operations.md#investigating-a-reported-bug).
- UI checks: Playwright MCP `playwright-mobile` (Galaxy S24) by default.
- Before committing: `npm run lint && npm run typecheck && npm test && npm run build && npm run size -w @labyrinth/client`.
