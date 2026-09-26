# Labyrinth – working instructions

## Knowledge base

The project wiki is [docs/README.md](../docs/README.md): architecture, operations (environments,
deploy, logs, bug runbook), development (run, test, debug, conventions). Start any planning or
investigation there, then verify against the code. Keep it current: every change updates the wiki
pages it affects (enforced by `openspec/config.yaml` rules and archive guidance).

## OpenSpec workflow (use it proactively)

This project is spec-driven with OpenSpec. Use the OpenSpec skills/commands on your own
initiative whenever they fit; do not wait to be asked. When unsure whether one fits, suggest it.

- New feature or behaviour change → `openspec-propose` (proposal, specs, design, tasks),
  then stop for the user's review before implementing.
- Idea still unclear, or a question that affects several changes → `openspec-explore`.
- Plan changes mid-way → `openspec-update-change`.
- User approves a proposal → `openspec-apply-change`.
- Change implemented, verified and committed → suggest `openspec-archive-change`.
- Pure tooling or refactoring with no behaviour change needs no change; just do it (and still
  update the wiki if it affects it).
- After finishing a step, name the natural next OpenSpec step.

## Working agreements

- Push to `main` yourself after green checks when a deploy is needed.
- Bug reports ("around 14:30 in game brave-otters-sing, X happened"): follow
  [docs/operations.md → Investigating a reported bug](../docs/operations.md#investigating-a-reported-bug).
- UI checks: Playwright MCP `playwright-mobile` (Galaxy S24) by default.
- Before committing: `npm run lint && npm run typecheck && npm test && npm run build`.
