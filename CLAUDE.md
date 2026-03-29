# Claude Code instructions for sierra-university

## Key architectural patterns

### talkingPoints-first tool responses
When a `controls.result({ data })` object contains both a structured array (e.g., `channels[]`) AND a
`talkingPoints` string, the Sierra agent treats the array as primary content and silently ignores
`talkingPoints` and any `instructions` field — even with "MUST"/"REQUIRED" language.

**Rule:** Any tool that needs the agent to say specific text (URLs, card mentions, reactivation prompts)
must return that text in a `talkingPoints` field with NO competing array in data. See `SearchChannelsByGenre`
and `PromotionalOffer` as the reference implementations.

### Testing discipline
- **Tests** (`tests/simulation.tests.ts`) = engineering confidence. Use tag assertions (`assertions.tags`)
  to verify tool was called and emitted correct observability tags. Deterministic.
- **Simulations** (`simulations/*.json`) = behavioral confidence. Use `expectedOutcomes` for LLM-judge checks
  on what the agent actually said. Probabilistic — keep outcomes broad enough to pass consistently.
- Both are required for every new capability. See `TESTING.md` for full rules.

### Build
After every `main.tsx` change: `pnpm sierra build` (compiles TS → main.js + all.tests.js)
Test a category: `pnpm sierra test --categories phase10`

## Current status (as of 2026-03-29)
- Phases 0–10 implemented. Phase 10 has 2 SELF_SERVICE tests still failing:
  1. "Genre Landing: Channel Cards and Browse Link" — agent doesn't mention artwork cards
  2. "Edge Case: Expired Subscription" — agent lists channels despite expired subscription
- Suspected root causes documented in BLUEPRINT.md Phase 10 section and project memory

## Data layer
- `data/sxm-catalog.ts` — generated; do not edit directly; run `node generate-catalog.mjs` to regenerate
- `data/synthetic-data.ts` — hand-authored user profiles; source of truth for test users
- CSVs in `data/` are the upstream source for `sxm-catalog.ts`
