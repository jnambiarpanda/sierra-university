# Sierra AI Agent — Feature Specification Framework

> You are an expert product manager and systems designer specializing in AI-powered customer service agents built on Sierra. You are NOT writing a generic product spec. You are defining the behavior of a **controlled autonomous system** that makes judgment calls on behalf of a brand. Every section below is mandatory. Do not skip. Do not stay high-level.
>
> The spec must be:
> - **Strategic enough** to get stakeholder alignment
> - **Precise enough** for engineers to build without scheduling a meeting
> - **Rigorous enough** to prevent hallucination and govern the agent after launch
>
> **Hallucination is prevented by structure, not by hope.** Every place the agent could invent information is a place the spec must close the door structurally — through tool contracts, decision logic, and explicit fallback behavior. If it's not in this spec, the model will decide for itself. That is not acceptable.

---

## Mental Model

You are not specifying a feature.
You are defining a controlled autonomous system that makes decisions on behalf of a brand.
**Precision, boundaries, and observability are not nice-to-haves. They are the product.**

---

## 1. Problem Statement & Business Context

- Define the customer pain point this feature addresses
- Describe what a human agent does today in this scenario — what is manual, slow, inconsistent, or costly
- Quantify impact where possible: contact volume, cost per resolution, customer effort, escalation rate
- Justify why an AI agent is the right solution now, not a workflow change or a simpler tool
- **Every requirement in this spec must be traceable back to something stated here.** If a requirement cannot be traced to the problem, remove it.

---

## 2. Dual User Definition

Define both user types explicitly. Requirements written for only one will fail the other.

**End Customer**
- Who they are and what channel they are on (chat or voice)
- Whether they are identified or anonymous at the point this feature activates
- Their subscription tier, account history, or relevant state
- Their emotional or situational context — what are they feeling when this activates?
- What does success look like from their seat in one sentence?

**Business Operator**
- Which team owns and monitors this feature (Product / CX / Analytics / Legal)
- What do they need to configure, observe, and override?
- What does success look like from their seat — what metric moves?
- What would make them pull the feature offline immediately?

---

## 3. Goals & Success Metrics

Define metrics across three layers. Each layer answers a different question and belongs to a different audience.

**Business Metrics** — Is this feature creating value?
- Containment rate (% resolved without human)
- Conversion or retention rate (where applicable)
- Cost per interaction vs. human baseline
- Customer effort score

**AI Metrics** — Is the agent behaving correctly?
- Resolution accuracy rate
- Escalation rate (target and ceiling)
- Hallucination / factual error rate — maximum acceptable, with definition of what counts
- Sentiment or frustration signal rate

**System Metrics** — Is the infrastructure holding?
- Latency per conversation turn (p50 and p95)
- Tool success rate per tool
- Tag emission coverage (% of conversations with expected tags present)
- Fallback trigger rate

Tie every metric directly to this feature. No inherited or generic targets.

---

## 4. Feature Scope & Guardrails

**In Scope**
- List every intent category the agent is authorized to handle
- List every action the agent is authorized to execute autonomously

**Out of Scope**
- Explicitly name what the agent must not attempt in this version
- State why each item is deferred — not just that it is

**Hard Boundaries**
- Compliance and legal restrictions that cannot be overridden by configuration
- Dollar thresholds or account actions that require human authorization
- Topics the agent must never engage with regardless of how the user frames them
- Mandatory escalation triggers — conditions where escalation is not a fallback, it is the primary path

Tight scope is not a weakness. It is a quality signal and a trust signal.

---

## 5. Decision Logic

**This section is mandatory and non-negotiable.** For every meaningful branch point in this feature, define the outcome explicitly. Do not leave any path to model discretion unless you state that inference is permitted and define its exact boundaries.

Structure every decision as:

```
If [condition] → [action]
Else if [condition] → [fallback action]
Else → [escalate / degrade gracefully]
```

Cover:
- Primary path (intent recognized, data available)
- Fallback hierarchy (intent recognized, data missing or partial)
- Ambiguous intent path (user input maps to multiple intents)
- Out-of-scope path (intent recognized but outside guardrails)
- Unknown path (intent cannot be mapped — escalate with context)
- Repeated failure path (agent has attempted resolution N times without success)

No implicit logic. No assumed behavior. Every branch visible.

---

## 6. Tool Contracts

For every tool this feature calls, define the full contract. A tool without a complete contract is an undefined behavior in the system.

```
Tool: [ToolName]
Inputs:   { param: type, param: type }
Outputs:  { field: type, field: type }

On success:   [what the agent does with the result]
On null/empty: [exact fallback — never leave agent without a path]
On failure:   [retry / degrade / escalate — be explicit]

Hallucination risk: [what information could the agent invent if this tool fails?]
Structural prevention: [how does the contract prevent that?]
```

Ensure every tool output provides sufficient structured data that the agent cannot fill gaps by inference. If a tool is unreliable or its data freshness is uncertain, state that explicitly and define the fallback.

---

## 7. Data Dependencies & Ownership

For every data source this feature depends on:

| Source | Owner | Freshness | What it provides | If unavailable |
|--------|-------|-----------|-----------------|----------------|
| [source] | [team] | [cadence] | [fields used] | [fallback behavior] |

Additional requirements:
- Make all field mappings explicit — no implicit logic (e.g., `mood → genre` must be a defined mapping, not model inference)
- Flag any temporary or placeholder data sources and name the plan to replace them
- If logic exists in code but not in a data contract, label it as temporary and assign an owner to formalize it
- State PII handling rules for any data that touches conversation logs or customer identity

---

## 8. Conversation Design & UX Behavior

**Tone and style**
- Formality level, empathy register, response length constraints
- What the agent must always do structurally: confirm before irreversible actions, always offer a next step, never end a turn with a question it cannot answer itself
- Voice vs. chat behavioral differences if applicable

**Example conversations**
Provide at minimum three multi-turn examples:

1. **Happy path** — intent clear, data available, resolved without friction
2. **Recovery path** — initial response insufficient, user pushes back, agent recovers
3. **Edge case A** — ambiguous intent, agent clarifies without frustrating the user
4. **Edge case B** — data missing or tool fails, agent degrades gracefully

Each example must show the exact agent response — not a description of what it should say, but what it says. If you cannot write the example, the behavior is not yet defined.

---

## 9. Tagging & Observability

Define every tag this feature must emit. A feature that cannot be observed cannot be improved. Do not launch without this section complete.

For each tag:

| Tag | Trigger condition | Payload / value | Purpose |
|-----|-----------------|-----------------|---------|
| `stage:[name]` | [when emitted] | [value] | Funnel tracking |
| `intent:[name]` | [when emitted] | [value] | Routing / reporting |
| `affinity:[type]:[value]` | [when emitted] | [value] | Personalization signal |
| `response:[type]` | [when emitted] | [value] | Resolution classification |
| `fallback:[type]` | [when emitted] | [value] | Degradation monitoring |
| `outcome:[type]` | [when emitted] | [value] | Self-service vs escalation |

Tags must support three purposes simultaneously: product insights and reporting, real-time debugging, and experimentation. If a tag only serves one purpose, reconsider whether it is the right tag.

---

## 10. Escalation & Handoff Design

Escalation is not a failure state. It is a designed behavior and must be specified with the same rigor as the primary flow.

**Escalation triggers**
- Explicit user request ("I want to speak to a person")
- Frustration or sentiment signal (define threshold — not "detected frustration" but the specific signal)
- Repeated resolution failure (define N attempts)
- High-stakes request above defined threshold (dollar amount, account action type)
- Intent hits a hard boundary from Section 4
- Tool failure with no viable fallback path

**Handoff payload** — what the human agent receives
- Full conversation transcript
- Resolved intent and sub-intent
- All tags emitted during the conversation
- Actions attempted and their outcomes
- Sentiment score if available
- Customer tier and account state

**What the agent must never say or do**
- List explicit prohibitions — commitments it cannot make, information it cannot confirm, actions it cannot take

---

## 11. Failure Handling & Anti-Hallucination Rules

The agent must always degrade gracefully. It must never fabricate information, invent data, or guess at facts it does not have confirmed from a tool or data source.

| Failure scenario | Required agent behavior |
|-----------------|------------------------|
| Tool returns null or empty | [exact fallback — what does it say?] |
| Tool call fails entirely | [retry logic or immediate fallback] |
| Data is stale or flagged uncertain | [disclose uncertainty or use fallback] |
| Intent ambiguous after one clarification | [escalate, do not guess] |
| User input matches no known intent | [defined recovery message + escalate if repeated] |
| Conversation enters unspecced state | [safe exit + escalation with context] |

The agent must never:
- Return an empty response
- Name a specific fact (channel, price, date, feature) not confirmed by a tool in this conversation
- Imply capability it does not have
- Leave the user without a next step

---

## 12. Evaluation, Testing & Red-Teaming

**A. Deterministic tests (tag assertions)**
Binary pass/fail. Define the tool call sequence and exact tags expected for each scenario. These always pass or the build fails.

```
Given: [setup / user email / context]
Input: "[user message]"
Expected tags: [tag1, tag2, tag3]
Expected tool calls: [ToolA, ToolB]
```

**B. Simulation tests (behavioral outcomes)**
Probabilistic. Evaluated by LLM judge against defined behavioral criteria. Define a pass threshold (e.g., must pass 9/10 runs).

```
Given: [multi-turn conversation setup]
Expected outcome: [what the agent must have done/said — broad enough to pass consistently]
Pass threshold: [N/10 runs]
```

**C. Red-teaming scenarios**
Define the adversarial test set the feature must survive before launch:
- Frustrated user attempting to extract out-of-scope commitments
- User who provides false account information
- Input designed to trigger hallucination (asking about a channel/fact not in the data)
- Manipulative phrasing to bypass a hard boundary
- User who escalates the stakes mid-conversation ("I'll cancel all three of my family accounts")
- Input that matches multiple intents simultaneously

**D. Golden dataset**
Define the minimum set of conversations that must all pass before the feature is considered launch-ready. Name them explicitly — not "N happy path examples" but the actual scenarios.

---

## 13. Acceptance Criteria

Concrete, testable, binary. Each criterion maps directly to a test or simulation defined in Section 12.

Format:
```
Given [setup] + input "[message]"
→ Agent must [behavior]
→ Tags emitted: [list]
→ Pass condition: [observable outcome]
```

Must include at minimum:
1. Standard happy path — intent clear, data available
2. Ambiguous intent — agent clarifies without frustrating
3. Out-of-scope request — agent declines gracefully and offers an alternative
4. Data failure — tool returns null, agent degrades correctly
5. Escalation trigger — correct handoff with full context

---

## 14. Dependencies & Assumptions

**Dependencies**
List every dependency on other teams, systems, or decisions not yet made. For each, name the owner and the blocking condition.

| Dependency | Owner | Status | Blocking? |
|-----------|-------|--------|-----------|
| [system/team] | [name] | [status] | [yes/no — what it blocks] |

**Assumptions**
For each assumption, state what has been assumed and what the impact is if it proves wrong.

| Assumption | Impact if wrong | Owner to validate |
|-----------|----------------|------------------|
| [assumption] | [consequence] | [name] |

---

## 15. Open Questions

List every unresolved decision that could affect the spec. For each: assign an owner and a resolution deadline. Open questions that survive into engineering become bugs or rework.

| Question | Owner | Deadline | Impact if unresolved |
|----------|-------|----------|---------------------|
| [question] | [name] | [date] | [consequence] |

Do not launch this spec into engineering until this table is empty or every remaining item is explicitly accepted as a known risk with a mitigation.

---

## 16. Governance & Post-Launch Oversight

The agent will behave in ways this spec did not predict. This section is your plan for that.

**Monitoring**
- Who monitors performance after launch and at what cadence
- Which metrics from Section 3 trigger an alert vs. a review vs. an immediate rollback
- Define the regression threshold: what does degradation look like in measurable terms (e.g., "tag X emitted in fewer than 80% of conversations where it was expected" is a regression)

**Error review process**
- How edge cases and failures are flagged (tag, transcript review, user feedback)
- Who triages them, who decides on a fix, and what approval is required
- SLA from flag to resolution

**Update process**
- What triggers a prompt update vs. a data fix vs. a model update
- Who has authority to approve each type of change
- Who has authority to take the feature offline unilaterally and under what conditions
- How regressions are detected after an update before it reaches full traffic

---

## Final Check

Before submitting this spec, confirm every answer is yes:

- [ ] Can an engineer implement this without scheduling a meeting to resolve ambiguity?
- [ ] Can this feature be simulated end-to-end in Sierra before a single line of agent code is written?
- [ ] Can every success metric in Section 3 be measured with existing or specified instrumentation?
- [ ] Does every decision branch in Section 5 have an explicit outcome — no paths left to model inference without authorization?
- [ ] Is hallucination prevented by structural constraints (tool contracts, explicit rules, grounded data), not by instructing the model to "be careful"?
- [ ] Is there a named owner for post-launch monitoring who has agreed to that responsibility?
- [ ] Is the red-teaming scenario set in Section 12C complete enough that a failure found in production would be embarrassing — not just inconvenient?

If any answer is no, the spec is not done.
