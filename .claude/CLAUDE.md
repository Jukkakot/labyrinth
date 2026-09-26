# Labyrinth – working instructions

## OpenSpec workflow (use it proactively)

This project is spec-driven with OpenSpec. Use the OpenSpec skills/commands on your own
initiative whenever they fit; do not wait to be asked. When unsure whether one fits, suggest it.

- New feature or behaviour change → `openspec-propose` (proposal, specs, design, tasks),
  then stop for the user's review before implementing.
- Idea still unclear, or a question that affects several changes → `openspec-explore`.
- Plan changes mid-way → `openspec-update-change`.
- User approves a proposal → `openspec-apply-change`.
- Change implemented, verified and committed → suggest `openspec-archive-change`.
- Pure tooling or refactoring with no behaviour change needs no change; just do it.
- After finishing a step, name the natural next OpenSpec step.

Project context and decisions: `openspec/config.yaml` points to `openspec/context/*.md`
(product, architecture, nfr, roadmap). Read the relevant one before planning. An existing
spec under `openspec/specs/` wins over those files.

## Commands

- `npm run dev`: server (:2567, /monitor, /playground) + client (Vite)
- `npm run lint && npm run typecheck && npm test && npm run build`: run all before committing
