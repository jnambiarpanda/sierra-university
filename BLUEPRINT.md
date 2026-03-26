# SiriusXM Trialer Conversion Agent — Development Blueprint

> Personalized customer support agent that converts free-trial subscribers into paying customers
> by connecting their listening history to upcoming live events and on-demand content.

---

## Guiding Principles

- **One capability per phase.** Each phase ships a working, tested feature.
- **Tests are part of the phase.** No phase is done until simulation tests pass.
- **No fabrication.** The agent only surfaces content it can confirm exists in the data layer.
- **Descriptive synthetic users.** Test user names describe the scenario (e.g., `Phone Known`). No real names, no celebrity names. Email format: `firstname.lastname@test.com`.
- **Double confirmation before advancing.** After each phase confirm twice before proceeding.

---

## Data Layer (shared across all phases)

| File | Purpose |
|------|---------|
| `data/users.csv` | User profiles: id, name, email, phone, subscription tier, affinity channels/artists |
| `data/events.csv` | 179 SiriusXM events (March 16–27 2026): artist, date, channels, type |
| `data/channel-catalog.csv` | ~65 channels: key, name, number, genre, package tier, description |
| `data/synthetic-data.ts` | In-memory arrays + all query helpers used by tools |

---

## Phase 0 — Caller Identification

**Goal:** Before any conversation logic runs, silently resolve who the caller is.

### Capabilities
1. **Phone-based lookup** — The Sierra platform passes `clientPhoneNumber` in conversation info. Use it to find the matching user profile and surface name, email, and subscription tier as context.
2. **Email fallback** — If phone lookup fails (or the channel has no phone), ask the caller for their email address and resolve from that.

### New files
- `tags.ts` — full tag schema for all phases (Intent, Affinity, Stage, Response, Offer, Outcome)

### New tools
- `ResolveCallerByPhone` — lookup type; param: `phoneNumber`; returns profile or not-found
- `ResolveCallerByEmail` — lookup type; param: `email`; returns profile or not-found

### Agent changes (main.tsx)
- Import `DynamicCustomerInfo` from `./dynamic-customer-info` and add it to `useAdditionalGoalAgentChildren`
- Add `Goal`: "Silently identify the caller before asking why they are reaching out."
- Add `Rule`: "If the customer is on a voice channel, attempt phone lookup first. If it fails, ask for their email."
- Register both tools

### Synthetic test users (data/users.csv)
| Name | Scenario |
|------|---------|
| Phone Known | Phone number is in our system; lookup succeeds immediately |
| Email Only | No phone on file; must fall back to email lookup |
| Unknown Caller | Neither phone nor email matches; proceed as anonymous |
| Phone Unknown | Phone provided but not in database; fall back to email |

### Simulation tests (tests/simulation.tests.ts)
- `phase0-phone-known` — send `clientPhoneNumber` via `withConversationInfo`; assert agent greets by name
- `phase0-email-fallback` — no phone; assert agent asks for email; provide email; assert resolved
- `phase0-unknown-caller` — bad phone + bad email; assert agent proceeds gracefully without name
- `phase0-phone-not-found` — phone not in DB; assert fallback to email prompt

### Done when
- All 4 simulation tests pass in `pnpm sierra test`
- Agent surfaces caller name + tier when phone is known without asking

---

## Phase 1 — Subscription Awareness

**Goal:** Know what the caller currently has and what they could upgrade to.

### Capabilities
- Surface current subscription tier (Select, Premier, All Access) from resolved profile
- Know which channels/packages the caller is missing
- Frame the conversation around what value they are not yet getting

### New tool
- `GetSubscriptionDetails` — lookup; param: `customerId`; returns tier, expiry, channels included/excluded

### Agent changes
- Add `Goal`: "Understand the customer's current subscription and identify upgrade paths."
- Add `Rule`: "Always know what the caller has before suggesting what they might want."
- Emit tag `stage:subscription-surfaced` after lookup

### Synthetic test users
| Name | Scenario |
|------|---------|
| Select Subscriber | On Select tier; missing Premier channels |
| All Access Trial | On trial; full access; needs conversion before expiry |
| Expired Trialer | Trial ended; should be offered re-activation |

### Simulation tests
- `phase1-select-tier` — assert agent mentions Select tier and available upgrades
- `phase1-all-access-trial` — assert agent acknowledges trial status and expiry
- `phase1-expired-trial` — assert agent offers reactivation path

### Done when all phase1 tests pass

---

## Phase 2 — Audience Affinity Segmentation

**Goal:** Classify the caller by their listening behavior across genre, super-category, and artist/talent.

### Capabilities
- Map the caller's top affinity channels to a genre segment (e.g., Hip-Hop, Country, Talk)
- Map to a super-category (Music, Talk, Sports, Howard Stern, Comedy)
- Identify their top 3 artists/hosts/talents from the affinity CSV
- Emit the segment as a tag so downstream goals can personalize

### New tool
- `GetAffinityProfile` — lookup; param: `customerId`; returns top channels, genres, super-category, top artists

### Agent changes
- Add `Goal`: "Understand what kind of content the caller loves most."
- Emit tags: `affinity:genre:<value>`, `affinity:super-category:<value>`, `affinity:artist:<name>`

### Synthetic test users
| Name | Scenario |
|------|---------|
| Hip Hop Heavy | Strong hip-hop channel affinity; top artist: Drake |
| Talk Radio Fan | High talk/news affinity; no strong music preference |
| Country Devotee | Country-dominant profile; top artist: Morgan Wallen |
| Balanced Listener | Spread across many genres; no dominant segment |

### Simulation tests
- `phase2-hip-hop-segment` — assert correct genre tag emitted
- `phase2-talk-super-category` — assert super-category tag = Talk
- `phase2-artist-identified` — assert at least one artist affinity tag
- `phase2-balanced-no-dominant` — assert no single genre tag dominates

### Done when all phase2 tests pass

---

## Phase 3 — Content Awareness & Recommendations

**Goal:** Connect the caller's affinity to real upcoming/recent SiriusXM content and recommend it.

### Capabilities
- Match caller's top artists and channels to events in events.csv
- Four outcome scenarios (never fabricate):
  1. **Live + On-Demand** — event is coming up AND a recorded version is available → recommend both
  2. **On-Demand only** — no upcoming live event but a recording exists → recommend recording
  3. **Live only** — upcoming event found but no on-demand version → recommend live
  4. **Neither** — no match found → do not recommend content; pivot to subscription value

### New tool
- `GetContentForUser` — lookup; param: `customerId`; returns matched events with type (live/on-demand/both)

### Agent changes
- Add `Goal`: "Find content that matches what the caller loves and is actually available."
- Add `Rule`: "Never mention an artist, show, or channel that cannot be confirmed in the content database."
- Emit tags: `response:content-live`, `response:content-on-demand`, `response:content-both`, `response:no-content`

### Synthetic test users
| Name | Scenario |
|------|---------|
| Live Event Match | Has upcoming event matching their top artist |
| On Demand Match | No live event but recorded session available |
| Both Available | Matching live event AND on-demand recording |
| No Content Match | Affinity channels have no matching events |

### Simulation tests
- `phase3-live-recommendation` — assert `response:content-live` tag + agent mentions event date
- `phase3-on-demand-recommendation` — assert `response:content-on-demand` tag
- `phase3-both-recommendation` — assert `response:content-both` tag
- `phase3-no-match-pivot` — assert `response:no-content` tag + agent pivots to value prop

### Done when all phase3 tests pass

---

## Phase 4 — Trialer Conversion Decision

**Goal:** Based on caller profile, subscription, affinity, and content match, make a personalized retention offer.

### Capabilities
- Detect if caller is a trialer (trial tier) or at-risk subscriber
- Choose the right offer: upgrade to Premier, extend trial, offer promotional price
- Emit outcome tag

### New tool
- `GetRetentionOffer` — lookup; param: `customerId`; returns recommended offer type and talking points

### Agent changes
- Add `Goal`: "Determine the best offer to retain this customer."
- Add `Rule`: "Only make an offer if you have confirmed their subscription status."
- Emit tags: `offer:upgrade-premier`, `offer:extend-trial`, `offer:promotional`, `offer:no-offer`

### Synthetic test users
| Name | Scenario |
|------|---------|
| Trial Ends Soon | Trial expiring in 3 days; receptive to upgrade |
| Budget Conscious | Wants to stay but price-sensitive; needs promo |
| Feature Seeker | Wants specific channels not in current plan |
| Happy To Cancel | Not interested; graceful exit needed |

### Simulation tests
- `phase4-trial-upgrade-offer` — assert `offer:upgrade-premier` tag
- `phase4-promo-offer` — assert `offer:promotional` tag
- `phase4-feature-upgrade` — assert agent mentions specific missing channels
- `phase4-graceful-exit` — assert `outcome:cancelled` tag + agent thanks caller

### Done when all phase4 tests pass

---

## Phase 5 — Live Agent Escalation

**Goal:** When the agent cannot resolve the issue, escalate cleanly with full context.

### Capabilities
- Detect escalation triggers: caller asks for human, billing dispute, account locked
- Pass resolved caller profile + segment + offer attempted to transfer payload
- Emit outcome tag

### Agent changes
- Add `Goal`: "If the customer needs a human agent, transfer them with full context."
- Emit tags: `outcome:transferred`, `outcome:self-served`

### Simulation tests
- `phase5-explicit-transfer-request` — caller says "speak to a human" → assert `outcome:transferred`
- `phase5-billing-dispute-escalation` — billing issue → assert transfer with context
- `phase5-self-served` — issue resolved without transfer → assert `outcome:self-served`

### Done when all phase5 tests pass

### Speed Bump & Transfer Observability Enhancement

**Goal:** Reduce unnecessary escalations by attempting resolution before transferring. Provide granular Insights into why and how transfers occur.

#### Speed bump pattern
- When a customer requests a live agent, agent calls `RecordSaveAttempt` first, acknowledges the request, asks what the customer needs, and attempts resolution
- Only calls `RecordTransfer` if the customer explicitly insists or the issue cannot be resolved

#### New tool
- `RecordSaveAttempt` — emits `transfer:save-attempted`; instructs agent to apply speed bump before escalating

#### Updated tools
- `RecordTransfer` — accepts `reason` (`explicit-request` | `billing-dispute` | `unresolved`) and `saveAttempted` (`true`/`false`); emits reason tag + optionally `transfer:save-failed`
- `RecordSelfServed` — accepts `saveAttempted` (`true`/`false`); emits optionally `transfer:save-succeeded`

#### New tags (`tags.ts` — `transfer` section)
| Tag | Meaning |
|-----|---------|
| `transfer:reason:explicit-request` | Customer insisted on a human after save attempt |
| `transfer:reason:billing-dispute` | Charge/refund issue unresolvable by agent |
| `transfer:reason:unresolved` | Agent tried but could not fix the issue |
| `transfer:save-attempted` | Speed bump fired |
| `transfer:save-succeeded` | Speed bump worked — no transfer needed |
| `transfer:save-failed` | Speed bump tried but customer still escalated |

#### Insights funnel enabled
```
outcome:transferred → transfer:reason:* → transfer:save-failed (if attempted)
outcome:self-served → transfer:save-succeeded (if speed bump preceded resolution)
```

#### Simulation test update
- `phase5-explicit-transfer-request` persona updated to insist on a human after speed bump attempt

---

## Phase 6 — Synthetic Test User Library

**Goal:** Build a complete set of synthetic test users that cover all phase scenarios end to end.

### Requirements
- One user per distinct test scenario across all phases (minimum 20 users)
- Each user has: id, first_name, last_name, email, phone, subscription_tier, affinity channels, top artists
- Names describe the scenario (e.g., `Trial Ends`, `Select Upgrade`, `No Content`)
- No real names, no celebrity names, no public figures
- Email: `firstname.lastname@test.com`
- Phone: `+1555XXX0000` format (fake numbers only)
- All users must be loadable from `data/users.csv` via `getUserProfileById` and `getUserProfileByPhone`

### Done when
- All prior phase tests still pass with the expanded user set
- `pnpm sierra test` shows 0 failures

---

## Phase 7 — Simulation Upload Package

**Goal:** Create a JSON file that can be imported into Sierra Agent Studio as UI simulations.

### Format
```json
{
  "simulations": [
    {
      "name": "...",
      "messages": ["persona instruction turn 1", "persona instruction turn 2"]
    }
  ],
  "version": 0
}
```

### Required simulations
At minimum one simulation per phase (7+ simulations), covering the happy path and at least one edge case per phase.

### Output file
`trialer-journey-simulator.json` at the project root

### Done when
- File is valid JSON
- Covers Phases 0–5 with representative multi-turn simulations
- File can be imported into Sierra Agent Studio without errors

---

## Phase 8 — Channel Card Attachments (Web UI Layer)

**Goal:** Display SiriusXM channel artwork inline in web chat when the agent references channels, making upgrade pitches and content recommendations visual.

### New files
| File | Purpose |
|------|---------|
| `web/main.tsx` | React web config; registers `ChannelCardsAttachment` alongside built-in Sierra types |

### Data changes
| File | Change |
|------|--------|
| `data/channel-catalog.csv` | Added `image_url` column; 13 channels populated with CloudFront URLs |
| `data/synthetic-data.ts` | `ChannelRecord` type gets `imageUrl?: string`; `CHANNELS` array updated |

### Agent changes (`main.tsx`)
- `GetSubscriptionDetails` emits a `channel-cards` attachment after subscription lookup:
  - **Select tier**: shows 3 Premier+ channels the caller is missing (Howard Stern, Liquid Metal, SiriusXM Premier) — visual upgrade pitch
  - **Other tiers**: shows caller's top channels that have artwork
- Attachment is **chat-only**: guarded by `ctx.conversationInfo.channel !== "voice_phone"`

### Attachment payload schema
```typescript
type ChannelCardsPayload = {
    type: "channel-cards";
    title?: string;
    channels: Array<{
        channelKey: string;
        channelName: string;
        channelNumber: string;
        imageUrl: string;
    }>;
};
```

### Test coverage
- `phase1-select-tier` `expectedOutcomes` updated: agent displays channel artwork for Premier channels
- `trialer-journey-simulator.json` — new simulation: "Channel Cards — Select subscriber sees Premier upgrade artwork"

### Done when
- `pnpm sierra build` passes
- `pnpm sierra test --categories phase1` passes (exit 0)
- Channel tiles render visually in `pnpm sierra dev` for a Select subscriber

---

## Phase 9 — Voice Enablement & Curated Demo Journey

**Goal:** Enable voice calls with a safe, demo-ready journey. Phases 0–2 run silently before the first spoken word. Phase 3 delivers the content recommendation. Phases 4 and 5 are suppressed on voice to eliminate demo risk.

### New capabilities
| Capability | Implementation |
|-----------|---------------|
| Voice enabled | `onVoiceCheck` added to `createAgent` |
| Default persona | `daisy-jordan` (English US) |
| Language switching | `DynamicLanguageSwitching` wired in — EN (`daisy-jordan`) ↔ FR (`guillaume-lefevre`) |
| Silent tool chain | Voice-curated `Goal` instructs agent to run all 4 lookups before first spoken word |
| Phase 4/5 suppressed | Voice Rules: no retention offers, no transfers, graceful close only |
| Attachment guard | Channel cards skipped on `voice_phone` channel |
| Channel observability | `channel:voice` / `channel:chat` tags emitted on every conversation |

### New tags (`tags.ts` — `channel` section)
| Tag | Meaning |
|-----|---------|
| `channel:voice` | Conversation is on voice/phone channel |
| `channel:chat` | Conversation is on web chat channel |

### Voice-curated Goal (Rules)
1. On voice: silently call `ResolveCallerByPhone` → `GetSubscriptionDetails` → `GetAffinityProfile` → `GetContentForUser` before speaking. First spoken message = greeting + content recommendation in ≤ 2 sentences.
2. On voice: do not make retention offers or suggest upgrades.
3. On voice: if billing issue or human request, say *"I'll have someone from our team follow up with you shortly"* and close gracefully. Do not call `RecordTransfer`.
4. On voice: no lists, bullet points, channel numbers, or markdown. Speak naturally.

### Files changed
| File | Change |
|------|--------|
| `tags.ts` | Add `channel` section |
| `main.tsx` | Add `onVoiceCheck`; add `VoiceCheckOutput` import; emit channel tags in `ResolveCallerByPhone`; add `isVoice` guard on attachment; add voice-curated Goal; wire `DynamicLanguageSwitching` |
| `voice-swapper.tsx` | Trim to EN/FR only; remove Spanish; dedicated personas only |

### Core voice metrics tracked via Insights
| Metric | Tags |
|--------|------|
| Voice containment rate | `outcome:self-served` + `channel:voice` |
| Voice escalation rate | `outcome:transferred` + `channel:voice` |
| Chat vs voice split | `channel:voice` vs `channel:chat` |

### Demo user & journey
- **Phone**: `+15550010012` (Live Event — Kendrick Lamar affinity, EVT032 upcoming)
- **Journey**: silent identify → subscription → affinity → live event recommendation → close
- **Language demo bonus**: say *"en français"* mid-call to trigger French persona swap

### Done when
- `pnpm sierra build` passes
- Agent responds to voice calls with correct persona
- First spoken message combines greeting + content recommendation
- French persona swap works mid-call
