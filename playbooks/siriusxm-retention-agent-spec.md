# SiriusXM Personalized Retention Agent — Product Specification

---

## 1. Problem Statement & Business Context

SiriusXM acquires subscribers primarily through free trials bundled with vehicle purchases. The trial-to-paid conversion window is short — typically 3–6 months — and the conversion call is the highest-leverage moment in the subscriber lifecycle. Today that call is handled by a human agent who has access to account data but no real-time view of what the subscriber actually listens to. The result: a generic retention pitch that could apply to any customer, delivered at significant cost per contact.

Three specific problems this agent addresses:

**Personalization gap.** Human agents know a subscriber's tier and payment status. They do not know that this specific caller listens primarily to hip-hop, has Drake as a top artist, and that a live Drake special airs next week on SiriusXM. That connection — between the caller's taste and real content in the catalog — is the most powerful retention argument available, and it goes unmade in most calls today.

**Discovery friction.** Subscribers who might convert often don't know what they'd be paying for. "What channels do you have for country?" requires a human to know the catalog, navigate it live, and translate it to a specific caller's tier. At scale this is inconsistent. An agent with the full genre catalog can answer this question instantly, with visual artwork cards, for every caller.

**Cost and consistency.** Retention calls are high-volume and repetitive. The majority follow one of four content scenarios (live match, on-demand match, both, neither) and one of three offer scenarios (upgrade, promo, extend trial). A well-scoped agent handles these programmatically, reserving human agents for genuinely complex cases.

Every requirement in this spec is traceable to one of these three problems.

---

## 2. Dual User Definition

**End Customer**

A SiriusXM subscriber, most commonly on a free trial bundled with a vehicle purchase, who has initiated a chat or phone support interaction. Typical state: mildly curious ("what do I actually get if I pay?"), mildly skeptical ("is this worth it?"), or mildly frustrated ("my trial is ending and nobody told me"). They are identified — they come with a phone number from the vehicle integration or provide an email. They are not technical and do not want to discuss their "subscription tier." They want to know what's on.

Named profiles (SiriusXM employees) are a secondary user class: identified by corporate email, with real listening data from Databricks HMF recommendations. These profiles demonstrate the personalization ceiling — what the agent looks like when real affinity data drives the conversation.

**Business Operator**

The SiriusXM product and CX team who configure, monitor, and govern the agent. They need:
- Visibility into containment rate and escalation triggers in real time
- Tag-based observability to understand which affinity segments convert and which don't
- Simulation coverage they can run on every deployment to catch regressions
- Clean escalation handoffs with full context so human agents aren't starting blind
- A safe, brand-appropriate agent that never fabricates content, pricing, or channel availability

Success from the operator seat: the agent handles the majority of trial-period support contacts without human involvement, with no hallucinated facts and a measurable lift in trial-to-paid conversion rate.

---

## 3. Goals & Success Metrics

**Business Metrics**
- Containment rate: ≥70% of contacts resolved without live agent transfer
- Trial-to-paid conversion rate: measurable lift vs. control (baseline to be established in production)
- Cost per interaction: target 80% reduction vs. human-handled equivalent

**AI Metrics**
- Resolution accuracy: agent surfaces correct subscription tier and content in ≥95% of identified-user conversations
- Escalation rate: ≤20% of conversations trigger live agent transfer
- Hallucination rate: 0% tolerance for fabricated channel names, event dates, pricing, or account facts — enforced structurally, not by instruction

**System Metrics**
- First token latency: ≤4 seconds
- Tool success rate: ≥99% per tool per deployment
- Tag emission coverage: expected tags present in ≥98% of conversations where trigger conditions are met
- Named profile channel card hit rate: ≥4 of top 5 recommendations resolve to a displayable card

---

## 4. Feature Scope & Guardrails

**In Scope**
- Caller identification by phone number and email address
- Subscription tier surfacing (trial, select, premier, all-access, expired)
- Listening affinity profiling: dominant genre, super-category, top artists/talent
- Content matching: upcoming live events and on-demand recordings matched to affinity
- Personalized retention offers: upgrade to Premier, promotional pricing, trial extension
- Genre catalog discovery: full channel search by genre with artwork cards and browse links
- Channel artwork card display for top personal recommendations at login
- Talent/artist card display for top affinity artists
- Self-service resolution tracking
- Voice channel support (phone-aware behavior, no card attachments on voice)
- Named profile support: real Databricks HMF entity IDs for channels and artists

**Out of Scope (this version)**
- Billing changes or payment processing
- Password reset or account access issues
- Device or vehicle activation support
- Outbound proactive retention (agent initiates contact)

**Hard Boundaries**
- Agent must never quote a specific price or discount without a confirmed promotional offer loaded for the subscriber's account
- Agent must never name a channel, artist, or event not confirmed in the current tool response
- Agent must never tell an expired subscriber they have active access to channels
- Any request involving account deletion, legal dispute, or billing refund above threshold → immediate escalation

---

## 5. Decision Logic

**Caller identification**
```
If clientPhoneNumber present AND matches profile → resolve silently, proceed to subscription
Else if clientPhoneNumber present AND no match  → ask for email
Else (no phone, chat channel)                  → ask for email

If email provided AND matches profile → resolve, proceed
If email provided AND no match        → proceed anonymous, reduced personalization path
```

**Subscription and affinity loading** (runs on every identified caller)
```
If profile resolved → load subscription details, affinity profile, and relevant content simultaneously

If tier = expired     → surface re-activation offer immediately, do not present channel content as available
If tier = select      → surface Premier upgrade path with affinity-relevant examples
If tier = trial       → load trial end date, flag conversion window
If tier = premier
   or all-access      → affinity-driven content recommendations, no upgrade pitch
```

**Content recommendation**
```
If content lookup returns a live event match  → lead with live event, mention date and channel
If content lookup returns on-demand only      → recommend recording
If content lookup returns both                → recommend both, live first
If content lookup returns no match            → pivot to subscription value prop, do not fabricate content

Emit: response:content-live / response:content-on-demand / response:content-both / response:no-content
```

**Genre discovery** (only when user explicitly asks)
```
If user message explicitly asks about a genre or channel availability → query the genre catalog immediately, before any other response
If genre query returns results   → present matching channels with artwork cards and a direct browse link
If genre query returns no match  → offer the user the list of available genres; never suggest channel names from general knowledge

Never query the genre catalog proactively at login or without an explicit user ask
```

**Retention offer**
```
If trial within conversion window → retrieve personalized offer, present using confirmed terms only
If promo offer available          → present with specific terms from the offer response, never invent terms
If no offer available             → pivot to content value prop, emit offer:no-offer
```

**Escalation**
```
If user explicitly requests human           → apply speed bump: acknowledge the request warmly, ask what they
                                              need resolved, attempt one resolution before transferring
If user insists after save attempt          → transfer with full context and save-attempted flag
If hard boundary hit (billing, legal)       → bypass speed bump, transfer immediately
If same intent fails resolution twice       → offer transfer
If sentiment degrades across 3+ turns      → proactively offer transfer
If capability gap with no fallback path    → acknowledge limitation gracefully, offer transfer
```

---

## 6. Agent Capabilities & Data Access Requirements

The agent must have confirmed data before acting on any fact. If the required data is unavailable, the specified fallback applies. The agent must never fill data gaps through inference or general knowledge.

**Caller Identification**
- Data accessed: subscriber identity matched by phone number (from call metadata) or by email address (subscriber-provided)
- If unavailable: proceed anonymous — reduced personalization, no affinity data, no content recommendations
- Anti-hallucination: agent must never infer a subscriber's name, account status, or preferences from the email format or phone number alone

**Subscription Status**
- Data accessed: current subscription tier, trial end date (if applicable), channels included in the subscriber's plan by tier
- If unavailable: do not surface or imply any tier — ask the subscriber to confirm their account
- Anti-hallucination: channel availability must always derive from the confirmed subscription tier; agent must never quote channel access from general knowledge

**Affinity Profile**
- Data accessed: top recommended channels, dominant genre, super-category (Music / Talk / Sports), top artists, top sports teams; channel and artist cards rendered in chat
- If unavailable: omit the personalization layer entirely — proceed with a generic content conversation; do not invent listening preferences
- On voice: suppress all card attachments; all responses must be audio-safe
- Anti-hallucination: agent must only reference artists, genres, and channels confirmed in the returned profile; must never infer preferences from a subscriber's name, location, or tier

**Content Recommendations**
- Data accessed: upcoming live events and on-demand recordings matched to the subscriber's affinity profile, with date, channel, and description
- If unavailable: pivot to subscription value proposition — do not name specific artists, events, or recordings not confirmed in the response
- Anti-hallucination: agent must never recall artist tour dates, show schedules, or on-demand recordings from training knowledge

**Personalized Retention Offer**
- Data accessed: offer type (upgrade / promotional pricing / trial extension), confirmed terms, and pre-approved offer language
- If unavailable: do not present any specific offer; pivot to content value proposition
- Anti-hallucination: agent must present offer terms verbatim from the confirmed offer — never paraphrase pricing, discount percentages, or extension lengths

**Genre Catalog Discovery**
- Data accessed: channel list and artwork cards for the queried genre, filtered to the subscriber's active lineup, with a direct browse link
- If unavailable: present the list of available genres — never suggest channel names from general knowledge
- Anti-hallucination: agent must never name a channel that was not in the confirmed genre catalog response for this conversation

**Conversation Outcome Recording**
- Three outcome states must be tracked: self-served (issue resolved without transfer), transferred (escalated to live agent), save attempted (speed bump completed before transfer)
- One outcome record must be emitted before every conversation end — no silent exits permitted
- The save-attempted flag must accurately reflect whether a speed bump was attempted in the session

---

## 7. Conversation Design & UX Behavior

**Tone and style**
- Warm, direct, knowledgeable — like a music-savvy friend who happens to work at SiriusXM
- On voice: no card references, no URLs, no "I've attached" language — all responses must be audio-safe

**Happy path — trial subscriber, hip-hop fan**
> Agent: I can help — could you share your email address?
> User: hip.hop@test.com
> Agent: Hi [Name], you're on a free trial ending [date]. Based on your listening history you're into hip-hop — and there's a Drake special coming up on Hip-Hop Nation next week. Want to hear more about that?
> User: Yeah definitely
> Agent: [confirms event details, presents channel cards]

**Recovery path — user pushes back on upgrade**
> User: I don't really want to pay for it
> Agent: Totally fair. The one thing I'd hate for you to miss is the Drake special on the 15th — that's only on Premier. I can hold a promotional rate if you want to try it for another month. No pressure either way.

**Edge case — genre question**
> User: What hip-hop channels do you have?
> Agent: [queries genre catalog immediately, before any other response]
> Agent: Here are the hip-hop channels on your plan: [reads confirmed channel list]. I've attached the channel artwork above so you can browse them.

**Edge case — expired subscription**
> User: Can I listen to Howard Stern?
> Agent: Your subscription ended on [date], so Howard 100 isn't currently available. I can get you back on Premier today — want me to walk you through the options?
> *(agent never says "your channels include" or confirms active access for an expired account)*

---

## 8. Observability Requirements

The agent must emit structured signals sufficient to measure every metric defined in Section 3. The specific signal schema is an engineering design decision; the requirements below define what must be measurable, not how.

**Containment and escalation** *(targets: containment rate, escalation rate)*
Every conversation must close with a distinguishable outcome — self-served or transferred — with the reason for transfer captured. Speed bump attempts before transfer must be trackable separately from transfers with no save attempt.

**Conversion funnel** *(target: trial-to-paid conversion rate)*
Conversations where a retention offer was presented must be identifiable by offer type (upgrade / promotional pricing / trial extension / no offer available), so conversion rates can be measured per offer type.

**Identification method** *(target: resolution accuracy)*
Each conversation must record how the subscriber was identified — by phone, by email, or anonymous — to enable funnel drop-off analysis and accuracy sampling by identification path.

**Subscription tier and affinity** *(targets: resolution accuracy, segmentation)*
The subscription tier at conversation start and the affinity categories surfaced (genre, super-category, top artists) must be capturable per conversation, so personalization quality can be correlated with retention outcomes.

**Content match quality** *(target: catalog coverage)*
Whether the agent surfaced a live event, on-demand content, both, or neither must be distinguishable — to measure catalog recommendation coverage over time and identify gaps.

**Hallucination monitoring** *(target: 0% hallucination rate)*
Any conversation where pricing, channel availability, or specific content was mentioned must be available for post-hoc sampling and audit. Channel lineup confirmation (whether a specific channel was confirmed as included in the subscriber's plan) must be observable per conversation.

---

## 9. Escalation & Handoff Design

**Escalation triggers**
- Explicit: user says "I want to speak to someone" / "transfer me" / "talk to a person"
- Repeated failure: same intent attempted twice without resolution
- Hard boundary hit: billing dispute, account deletion, legal claim
- Abuse signal detected: graceful exit, no transfer offered
- Tool failure with no viable fallback
- Expired account requesting actions that require an active subscription

**Handoff payload — what the receiving human agent gets**
- Full conversation transcript
- Resolved customer identity (name, email, account ID)
- Subscription tier and trial status
- All tags emitted (intent, affinity, stage, response, offer)
- Actions attempted (offers presented, content surfaced)
- Transfer reason
- `saveAttempted` flag — whether a retention offer was made before transfer

**The agent must never:**
- Quote a specific price or promotional amount not confirmed in a loaded offer
- Confirm channel availability for an expired account
- Name a specific event, artist appearance, or recording not confirmed in the content response
- Promise a callback, case number, or follow-up action
- Re-engage after an abuse signal is detected

---

## 10. Failure Handling & Anti-Hallucination Rules

| Failure scenario | Required behavior |
|-----------------|------------------|
| Phone lookup returns no match | Silently ask for email — do not mention the failed lookup |
| Email lookup returns no match | "I wasn't able to find an account, but I can still help" — proceed anonymous |
| Affinity data is unavailable | Skip affinity section — do not reference genres or artists; use generic value prop |
| Content lookup returns no match | Pivot to subscription value prop — never name a specific event or recording |
| No eligible offer is available | Do not invent terms; present general Premier value prop |
| Genre catalog returns no results | Present the list of available genres — never suggest channel names from general knowledge |
| A data lookup fails or times out | Acknowledge limitation gracefully, offer to transfer — never surface technical error language |
| Channel cards resolve fewer than expected | Render what's available — do not fabricate channel names to fill empty card slots |
| Artist not found in talent catalog | Suppress artist card silently — do not invent a card or name |

**System-level invariants:**
- Agent never returns an empty response
- Agent never ends a conversation without recording a conversation outcome (self-served or transferred)
- Agent never presents channel content as available for an expired subscription

---

## 11. Dependencies & Assumptions

| Dependency | Owner | Status | Blocking |
|-----------|-------|--------|----------|
| Events data refresh cadence | SiriusXM Content team | Cadence to be defined | Blocks accurate content recommendations |
| Subscriber recommendation data pipeline | Data Engineering | Integration approach to be defined | Blocks real-time personalization for subscribers |
| Channel artwork image URL SLA | SiriusXM Catalog team | URL stability SLA to be established | Blocks card display guarantee |
| Escalation routing target | CX Operations | Routing configuration required | Blocks live agent transfer |

| Assumption | Impact if wrong | Owner to validate |
|-----------|----------------|------------------|
| Subscriber recommendation entity IDs are stable across data refreshes | Personalized channel cards break silently for affected subscribers | Data Engineering |
| Trial end dates are accurate in subscription records | Conversion window logic triggers at the wrong time | CRM / Subscription data team |
| Channel metadata catalog covers all channels surfaced in personalized recommendations | Channel artwork cards unavailable for some subscribers | Catalog team |
| Lineup membership is accurate per subscription tier | Agent confirms wrong channels as included in a subscriber's plan | Platform team |

---

## 12. Open Questions

| Question | Owner | Impact if unresolved |
|----------|-------|---------------------|
| What is the required freshness SLA for events and content data? | SiriusXM Content | Agent surfaces past events as upcoming |
| What is the data freshness SLA for personalized subscriber recommendations? | Data Engineering | Determines how current personalization is for each subscriber |
| Are channel artwork image URLs stable or subject to rotation? | SiriusXM Catalog | Artwork cards silently break after URL rotation |
| What is the escalation routing target for transferred conversations? | CX Operations | Transferred conversations have no destination |
| Should expired subscribers receive a promotional re-activation offer or standard rate? | Product / Finance | Agent presents generic re-activation with no specific terms |

---

## 13. Governance & Post-Launch Oversight

**Monitoring**
- CX Operations reviews containment rate and escalation rate weekly
- Engineering monitors observability signal coverage and capability success rate per deployment
- Regression threshold: any measurable capability dropping below expected performance triggers an engineering review before next deployment

**Error review**
- Conversations flagged by human agents post-transfer reviewed within 48 hours
- Any confirmed hallucination (fabricated channel name, invented pricing) is P0 — immediate rollback
- Behavioral evaluation pass rate drop below 80% triggers a deployment hold

**Update process**
- Behavior or rule changes: Engineering + Product review; full behavioral evaluation suite must pass before deployment
- Data refresh (events, catalog): Engineering-owned; automated regression run required
- Model update: Full behavioral evaluation suite re-run required; must pass at 100% before promotion
- Emergency offline: CX Operations or Product lead may suspend the agent unilaterally; Engineering notified within 1 hour
