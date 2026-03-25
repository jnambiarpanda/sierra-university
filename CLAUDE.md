# Sierra University — SiriusXM Trialer Conversion Agent

## Commands

| Command | What it does |
|---|---|
| `pnpm watch` | Build + upload to Sierra Agent Studio on every save |
| `pnpm build` | One-time build |
| `pnpm upload` | Upload latest build to Agent Studio |
| `pnpm check` | Type-check without building |

> There is no local dev server. All agent testing happens in Sierra Agent Studio (UI) or via the simulation test runner.

---

## Project Architecture

```
main.tsx                     — Agent entry point: createAgent(), all Goals, Rules, and tools
dynamic-customer-info.tsx    — TrialerCustomerInfo: PromptContext with full affinity memory
tags.ts                      — All conversation tag constants + emitTag() helper
knowledge.ts                 — Knowledge base definitions (Baseball Rules, Content Catalog, Pokemon, Sierra Outfitters FAQ)
skills/
  trialer-upgrade-offer.tsx  — TrialerUpgradeOffer, TrialerConversionSuccess, TrialerConversionDeferred, TrialerExtensionOffer
  abuse-detection.tsx        — SierraUniversityAbuseDetection skill
data/
  users.csv                  — Test users: emailAddress, listenerID, profileID, segment, firstName, lastName
  affinity.csv               — Ranked affinities: profileID, rank, artistName, contentType, confidence
  listening-history.csv      — Recent listens: profileID, contentID, listenedAt, durationSeconds
  favorites.csv              — Saved favorites: profileID, contentID, savedAt
  content-catalog.csv        — SiriusXM content: contentID, title, artistHost, contentType, channel, channelNumber, airTime
  synthetic-data.ts          — In-memory query helpers backed by the CSVs above
tests/
  simulation.tests.ts        — Sierra simulation tests (describe/test/test.critical)
trialer-conversion-simulations.json  — UI-importable simulations (Trialer Conversion Journey)
trialer-journey-simulator.json       — UI-importable simulations (2-user journey simulator)
integrations/                — Custom integrations (cat-facts-api, pokemon-api, sierra-outfitters)
integrations-registry.ts     — Registers all integrations with the agent
```

---

## Synthetic Data Layer

**All tools must use `data/synthetic-data.ts` — never call external APIs directly from tool `func` bodies.**

Available query helpers:

```ts
getUserByEmail(email)                        // email → UserRecord | undefined
getAffinityByProfile(profileID)              // profileID → AffinityRecord[] sorted by rank
getListeningHistoryByProfile(profileID, limit?) // profileID → ListeningHistoryRecord[] by recency
getFavoritesByProfile(profileID)             // profileID → FavoriteRecord[]
searchContentCatalog(artistName, contentType?) // fuzzy artist/type search → ContentCatalogItem[]
getPersonalizedRecommendations(profileID)    // two-pass match: artist first, then content_type → PersonalizedRecommendation[]
```

**Test users:**
| Email | Name | Confidence | Expected journey |
|---|---|---|---|
| sarah.mitchell@sxm-test.com | Sarah Mitchell | 97% (Styx) | Full upgrade pitch → converted |
| marcus.johnson@sxm-test.com | Marcus Johnson | 95% (Megadeth) | Full upgrade pitch |
| priya.patel@sxm-test.com | Priya Patel | 92% (Bono) | Medium confidence |
| carlos.rivera@sxm-test.com | Carlos Rivera | 88% (Howard Stern) | Medium confidence |
| alex.kim@sxm-test.com | Alex Kim | 48% | Extension offer only — no upgrade pitch |
| unknown.user@notindb.com | (not in DB) | — | Graceful generic greeting |

---

## Tag System

**Always use constants from `tags.ts` — never hardcode tag strings.**

```ts
import { Tags, emitTag } from "./tags";
emitTag(output, Tags.OUTCOME_CONVERTED);
```

Key tags to know:
- `stage:entry` → profile resolved, journey started
- `affinity:artist_match_high/medium/low` → confidence tier detected
- `stage:content_surfaced` → personalized content moment shown
- `stage:offer_presented` → upgrade offer made
- `offer:upgrade_full` / `offer:trial_extended` → which offer was made
- `outcome:converted` / `outcome:deferred` / `outcome:dropped_off` → journey result

Tags surface in Sierra Monitor/Explorer for funnel analysis.

---

## Trialer Conversion Journey — Decision Logic

```
Email collected
    └─ ResolveTrialerProfile(email)
           ├─ not found → greet generically, continue
           └─ found
                  ├─ segment ≠ "trialer" → no conversion journey
                  └─ isTrialer = true
                         └─ pitchStrategy:
                                ├─ confidence ≥ 0.95 → lead with artist content → full upgrade offer
                                ├─ confidence 0.70–0.94 → surface content → gauge interest → offer
                                └─ confidence < 0.70 → skip upgrade → TrialerExtensionOffer only
```

---

## Adding a New Tool

1. Register in `main.tsx` using `tools.registerTool()`
2. Add params with `toolParam.string()` / `toolParam.number()`
3. Call a `synthetic-data.ts` helper in `func` — do not use `fetch.jsonSync` for trialer data
4. Return `controls.result({ data: { ... } })` or `controls.error("message")`
5. Include relevant `Tags` values in the returned `data` object so the agent emits them

---

## Adding a New Simulation Test

In `tests/simulation.tests.ts`:
- Use `test.critical()` for must-pass journeys
- Use `test()` for non-critical coverage
- `messages` can be a string (single turn) or `string[]` (multi-turn)
- `assertions` reference tag strings like `"outcome:converted"` or `"stage:entry"`

For UI-importable simulations, follow the format in `trialer-journey-simulator.json`:
- `messages[]` are persona instructions for the AI simulator, not literal user messages
- Each message tells the simulator what the user believes and how to behave that turn

---

## Sierra SDK Quick Reference

| SDK export | Purpose |
|---|---|
| `createAgent()` | Agent factory — all config goes here |
| `Goal` + `Rule` | Journey orchestration in JSX |
| `tools.registerTool()` | Register a custom tool |
| `PromptContext` | Inject persistent text into system prompt |
| `useRootStore()` | Read/write conversation-level state |
| `useOutput()` + `output.send()` | Emit tags and conversation events |
| `Respond` | Terminal skill — send a fixed response and close |
| `NewCrawledKnowledgeBase` | Crawl-based knowledge source |
| `fetch.jsonSync()` | Synchronous HTTP fetch inside tool/knowledge funcs |
| `AbuseType` | Enum for abuse detection overrides |

---

## Conventions

- JSX is used even in `.ts` files where Sierra SDK components are rendered — this is intentional
- `// Copyright Sierra` is the standard file header
- Skills live in `skills/` and import from `../tags`
- Knowledge base generators are `function*` generators that `yield` `ArticleBatch` objects
- Do not add `console.log` — use `info()` or `logging.info()` from `@sierra/agent`
