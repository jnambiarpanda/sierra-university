# SiriusXM Personalized Customer Support Agent — POC

A proof-of-concept Sierra agent that demonstrates personalized subscriber retention for SiriusXM. The agent knows who the caller is, what they listen to, and what content they'd love — and uses that to have a genuinely helpful, personalized conversation instead of a generic script.

---

## What this agent does

When a subscriber calls in, the agent:

1. **Recognizes them instantly** — resolves the caller by phone number or email, greets them by first name, and surfaces their subscription tier without asking.
2. **Knows their taste** — loads their listening affinity profile: dominant genres, super-categories (Music, Talk, Sports), and top artists/talents.
3. **Finds relevant content** — matches their top artists to real upcoming live events and on-demand recordings on SiriusXM, and surfaces both in the same conversation.
4. **Makes a personalized retention offer** — for trial subscribers approaching expiry, proposes the right offer (upgrade, promo pricing, or trial extension) based on their profile.
5. **Explores the catalog with them** — if they ask "what hip-hop channels do you have?", the agent searches the full genre catalog and responds with channel artwork cards and a direct browse link.
6. **Handles edge cases gracefully** — expired subscriptions get a re-activation offer; unknown callers get a helpful anonymous experience; abuse is detected and handled without escalation.
7. **Routes to a live agent when needed** — escalates with full context when the issue is genuinely unresolvable.

### Named profiles (real employee data)
The agent supports a set of real SiriusXM employee profiles sourced from Databricks HMF recommendation data. When a named-profile user calls in, their actual for-you channel recommendations and artist affinities power the conversation — no synthetic stand-ins.

---

## Try the live agent

Open the dev chat and start a conversation:

**[Open dev agent](https://sierra.chat/agent/Ey5Etf0BlylfdG0BnQxll2LMGIoWyHmaWq4oyp3_vWQ/chat/dev:JITESH)**

The agent will ask for your email. Use one of the test personas below.

![Agent chat — genre discovery with channel artwork cards](docs/screenshot-chat.png)

### Sample conversations to try

**Scenario 1 — Hip-hop fan looking for content**

> Email: `hip.hop@test.com`

After the agent greets you, try:
- *"I'm a huge Drake fan — what's coming up for me?"*
- *"What hip-hop channels do you have?"*

The agent will surface an upcoming Drake live event and/or on-demand recording, then display channel artwork cards for Hip-Hop Nation, Shade 45, and similar channels.

---

**Scenario 2 — Country listener on a trial about to expire**

> Email: `trial.ends.soon@test.com`

After the agent greets you, try:
- *"I'm thinking of cancelling when my trial ends"*
- *"What do I actually get with the paid plan?"*

The agent will recognize the trial status, connect the upcoming Morgan Wallen content to their listening history, and offer a personalized retention pitch before presenting a promotional offer.

---

## Engineering: run and test locally

### Prerequisites

- Node.js 18+
- `pnpm` package manager
- Access to the Sierra University workspace at [university.sierra.ai](https://university.sierra.ai)

### Setup

```bash
git clone <this-repo>
cd sierra-university
pnpm install
```

### Build

```bash
pnpm sierra build
```

This compiles `main.tsx` → `main.js` + `all.tests.js` via esbuild.

To regenerate the channel/talent catalog from source CSVs:
```bash
node generate-catalog.mjs    # rebuilds data/sxm-catalog.ts (872 channels, 39 genres)
node generate-users-csv.mjs  # rebuilds data/users.csv (20 test users + 63 named profiles)
pnpm sierra build
```

---

### Test with the Journey interface

The Journey interface lets you run a scripted conversation against the live agent and inspect every tool call and tag in real time.

**[Open Journey](https://university.sierra.ai/agents/01KM66B5V22CQ49DFXSAEZZFB4/journeys/01KM66B7376D3PA8PPZXMEF698?workspaceId=01KM712JSMWXJVK13VS9K78440)**

1. Open the Journey link above.
2. Click **Merge** (top right) to push your latest local build to the workspace.
3. Select a journey from the left panel or start a new one in the Chat panel on the right.
4. Watch the tool invocations, agent tags, and full conversation transcript as the agent responds.

![Sierra Journey interface showing channel artwork cards on login](docs/screenshot-journey.png)

---

### Run automated simulations

The simulation suite has 94 test scenarios across all phases, currently passing at **87%**.

**[Open Simulations](https://university.sierra.ai/agents/01KM66B5V22CQ49DFXSAEZZFB4/simulations/ab-01KMMFEGCEY69Y8SA8CC8Z6AFC?workspaceId=01KM712JSMWXJVK13VS9K78440&resultId=01KMX5Y86DADPZBMVFECXXRXV0)**

#### Run from the CLI

```bash
# Run all simulations
pnpm sierra test

# Run a specific phase
pnpm sierra test --categories phase3
pnpm sierra test --categories phase10
pnpm sierra test --categories phase-named-profiles-p1
```

#### Run from the UI

1. Open the Simulations link above.
2. Click the green **▶ Run** button (top toolbar) to execute all simulations.
3. Click any individual simulation to expand its transcript, required tags, and behavior assertions.
4. Green checkmarks = pass. Each simulation shows the full conversation replay so you can see exactly what the agent said and which tools fired.

![Simulation results with passing transcript and tag assertions](docs/screenshot-simulations.png)

#### Upload a custom simulation JSON

You can write your own simulation scenarios and upload them directly:

1. Create a JSON file matching the schema in `simulations/*.json` (see `simulations/named-profile-simulator.json` as an example).
2. In the Simulations UI, click **⚙ Settings → Upload simulation file** and select your JSON.
3. The new scenarios will appear in the panel and can be run immediately.

---

## Project structure

```
main.tsx                        — agent definition (tools, goals, rules)
data/
  users.csv                     — 83 user profiles (20 test + 63 named)
  sxm-catalog.ts                — generated: 872 channels, 39 genres, talent catalog
  synthetic-data.ts             — runtime query helpers (loaded from users.csv)
  events.csv                    — 179 SiriusXM events (live + on-demand)
generate-catalog.mjs            — regenerates sxm-catalog.ts from source CSVs
generate-users-csv.mjs          — merges test users + named profiles into users.csv
simulations/                    — simulation scenario JSON files by phase
tests/simulation.tests.ts       — tag assertion tests (94 scenarios)
BLUEPRINT.md                    — phase-by-phase design decisions and test coverage
```

---

## Phase summary

| Phase | Capability |
|-------|-----------|
| 0 | Caller identification — phone lookup + email fallback |
| 1 | Subscription awareness — tier detection, trial expiry |
| 2 | Audience affinity segmentation — genre, super-category, artist tags |
| 3 | Content recommendations — live events + on-demand matched to affinity |
| 4 | Trialer conversion — personalized retention offers |
| 5 | Abuse detection — custom handling without escalation |
| 6 | Live agent transfer — escalation with full context |
| 7 | Self-service resolution tracking — outcome tagging |
| 8 | Promotional offers — contextual upsell with talking points |
| 9 | Voice channel support — phone-aware behavior |
| 10 | Genre discovery — catalog search with artwork cards and browse links |
| N | Named profiles — real employee data from Databricks HMF |
