// Copyright Sierra

import { createAgent } from "@sierra/agent/base";
import { AbuseType, addAgentTags, fetch, Goal, jsx, Rule, toolParam, tools, type VoiceCheckOutput } from "@sierra/agent";
import { SierraUniversityAbuseDetection } from "./skills/abuse-detection";
import integrationsRegistry from "./integrations-registry";
import { DynamicCustomerInfo } from "./dynamic-customer-info";
import { DynamicLanguageSwitching } from "./voice-swapper";
import { TAGS } from "./tags";
import { getUserProfileByPhone, getUserProfileByEmail, getUserProfileById, getChannelByKey, getEventsByArtist, type EventRecord } from "./data/synthetic-data";

// ─────────────────────────────────────────────────────────────────────────────
// Phase 0 — Caller Identification Tools
// ─────────────────────────────────────────────────────────────────────────────

/**
 * ResolveCallerByPhone — reads clientPhoneNumber from conversation info,
 * looks up the matching profile, and stores it in root store.
 */
const ResolveCallerByPhone = tools.registerTool({
    name: "ResolveCallerByPhone",
    type: "lookup",
    noCodeId: "resolve-caller-by-phone",
    description:
        "Look up the caller's profile using their phone number from the conversation. " +
        "MUST be called as the very first action at the start of every conversation, before saying anything to the customer.",
    params: {},
    func: (ctx, _params, controls) => {
        const isVoice = ctx.conversationInfo.isVoice;
        addAgentTags([isVoice ? TAGS.channel.voice : TAGS.channel.chat]);

        const phoneNumber = ctx.conversationInfo.clientPhoneNumber;

        if (!phoneNumber || phoneNumber === "Anonymous") {
            addAgentTags([TAGS.stage.emailRequested]);
            return controls.result({
                data: { found: false, reason: "No phone number available for this conversation." },
                instructions: "Ask the customer for their email address to look up their account.",
            });
        }

        const phone = String(phoneNumber);
        const profile = getUserProfileByPhone(phone);

        if (!profile) {
            addAgentTags([TAGS.stage.emailRequested]);
            return controls.result({
                data: { found: false, reason: `No account found for phone number ${phone}.` },
                instructions: "Ask the customer for their email address to look up their account.",
            });
        }

        ctx.store.update(prev => ({
            ...prev,
            customer: {
                first_name: profile.firstName,
                last_name: profile.lastName,
                email: profile.email,
                phone: profile.phone,
            },
            resolvedUserId: profile.userId,
            subscriptionTier: profile.subscriptionTier,
        }));

        addAgentTags([TAGS.stage.callerIdentifiedByPhone]);
        return controls.result({
            data: {
                found: true,
                userId: profile.userId,
                firstName: profile.firstName,
                lastName: profile.lastName,
                email: profile.email,
                subscriptionTier: profile.subscriptionTier,
                trialEndDate: profile.trialEndDate ?? null,
            },
            instructions: `Greet the customer warmly using their first name: ${profile.firstName}.`,
        });
    },
});

/**
 * ResolveCallerByEmail — called when phone lookup is unavailable or returns no match.
 */
const ResolveCallerByEmail = tools.registerTool({
    name: "ResolveCallerByEmail",
    type: "lookup",
    noCodeId: "resolve-caller-by-email",
    description:
        "Look up the caller's profile using their email address. " +
        "Use this ONLY after ResolveCallerByPhone has returned found=false or no phone number is available.",
    params: {
        email: toolParam.string(
            "The email address provided by the customer. Must be a valid email address."
        ),
    },
    func: (ctx, params, controls) => {
        const profile = getUserProfileByEmail(params.email);

        if (!profile) {
            addAgentTags([TAGS.stage.callerUnknown]);
            return controls.result({
                data: { found: false, reason: `No account found for email ${params.email}.` },
            });
        }

        ctx.store.update(prev => ({
            ...prev,
            customer: {
                first_name: profile.firstName,
                last_name: profile.lastName,
                email: profile.email,
                phone: profile.phone,
            },
            resolvedUserId: profile.userId,
            subscriptionTier: profile.subscriptionTier,
        }));

        addAgentTags([TAGS.stage.callerIdentifiedByEmail]);
        return controls.result({
            data: {
                found: true,
                userId: profile.userId,
                firstName: profile.firstName,
                lastName: profile.lastName,
                email: profile.email,
                subscriptionTier: profile.subscriptionTier,
                trialEndDate: profile.trialEndDate ?? null,
            },
            instructions: `Greet the customer warmly using their first name: ${profile.firstName}.`,
        });
    },
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 1 — Subscription Awareness Tool
// ─────────────────────────────────────────────────────────────────────────────

// Premier+ channels not available on Select tier
const PREMIER_PLUS_CHANNELS = ["634ea01e-4ae2-c7e8-7567-138965e8a6fe", "5ad6890a-adaf-48bf-adbf-d0bf28def878", "a44e273d-a7e5-c358-a8ae-39dc91ca9c30"];
const PREMIER_PLUS_NAMES = ["Liquid Metal", "Howard Stern", "SiriusXM Premier"];

const GetSubscriptionDetails = tools.registerTool({
    name: "GetSubscriptionDetails",
    type: "lookup",
    noCodeId: "get-subscription-details",
    description:
        "Get the caller's current subscription tier, trial expiry, and which channels they can " +
        "and cannot access. Call this after identifying the caller to understand their plan.",
    params: {
        customerId: toolParam.string(
            "The userId of the identified caller, as returned by ResolveCallerByPhone or ResolveCallerByEmail."
        ),
    },
    func: (ctx, params, controls) => {
        const isVoice = ctx.conversationInfo.isVoice;
        const profile = getUserProfileById(params.customerId);

        if (!profile) {
            return controls.error(`No profile found for customerId ${params.customerId}.`);
        }

        const tier = profile.subscriptionTier;

        // Emit tier-specific tag
        const tierTagMap: Record<string, string> = {
            trial: TAGS.subscription.trial,
            select: TAGS.subscription.select,
            premier: TAGS.subscription.premier,
            "all-access": TAGS.subscription.allAccess,
            expired: TAGS.subscription.expired,
        };
        if (tierTagMap[tier]) {
            addAgentTags([tierTagMap[tier]]);
        }
        addAgentTags([TAGS.subscription.surfaced]);

        // Determine excluded channels based on tier
        const excludedChannels =
            tier === "select"
                ? PREMIER_PLUS_NAMES
                : tier === "expired"
                  ? ["All channels — subscription inactive"]
                  : [];

        const upgradeAvailable = tier === "select" || tier === "trial" || tier === "expired";

        // Build channel card attachment for channels with artwork
        const channelKeysToShow: string[] =
            tier === "select"
                ? PREMIER_PLUS_CHANNELS                      // show what they're missing
                : profile.topChannels.slice(0, 5);           // show their top channels

        const channelCards = channelKeysToShow
            .map(key => getChannelByKey(key))
            .filter((ch): ch is NonNullable<typeof ch> => !!ch && !!ch.imageUrl)
            .map(ch => ({
                channelKey: ch.channelKey,
                channelName: ch.channelName,
                channelNumber: ch.channelNumber,
                imageUrl: ch.imageUrl as string,
                playerLandingPage: ch.playerLandingPage,
                description: ch.description,
            }));

        const attachments = (!isVoice && channelCards.length > 0)
            ? {
                  id: "channel-cards",
                  description: "SiriusXM channel artwork",
                  data: [{
                      type: "custom" as const,
                      data: {
                          type: "channel-cards" as const,
                          title: tier === "select" ? "Channels unlocked with Premier" : "Your channels",
                          channels: channelCards,
                      },
                  }],
              }
            : undefined;

        return controls.result({
            data: {
                tier,
                trialEndDate: profile.trialEndDate ?? null,
                excludedChannels,
                upgradeAvailable,
                upgradeTarget:
                    tier === "select"
                        ? "Premier (unlocks Howard Stern, Liquid Metal, SiriusXM Premier)"
                        : tier === "trial" || tier === "expired"
                          ? "Paid subscription to keep access"
                          : null,
            },
            ...(attachments ? { attachments } : {}),
        });
    },
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 2 — Audience Affinity Segmentation Tool
// ─────────────────────────────────────────────────────────────────────────────


const GENRE_TAG_MAP: Record<string, string> = {
    "Hip-Hop": TAGS.affinity.genreHipHop,
    "Country": TAGS.affinity.genreCountry,
    "Pop": TAGS.affinity.genrePop,
    "Alternative Rock": TAGS.affinity.genreRock,
    "Hard Rock": TAGS.affinity.genreRock,
    "Heavy Metal": TAGS.affinity.genreRock,
    "Electronic/Dance": TAGS.affinity.genreElectronic,
    "Electronic": TAGS.affinity.genreElectronic,
    "Jazz": TAGS.affinity.genreJazz,
    "Classic Rock": TAGS.affinity.genreClassicRock,
};

const SUPER_CATEGORY_TAG_MAP: Record<string, string> = {
    "Music": TAGS.affinity.superCategoryMusic,
    "Talk": TAGS.affinity.superCategoryTalk,
    "Howard Stern": TAGS.affinity.superCategoryHowardStern,
};

const GetAffinityProfile = tools.registerTool({
    name: "GetAffinityProfile",
    type: "lookup",
    noCodeId: "get-affinity-profile",
    description:
        "Get the caller's audience affinity profile: their top channels, genre segments, super-category, and top artists. " +
        "Call this after retrieving subscription details to personalise content recommendations.",
    params: {
        customerId: toolParam.string(
            "The userId of the identified caller, as returned by ResolveCallerByPhone or ResolveCallerByEmail."
        ),
    },
    func: (_ctx, params, controls) => {
        const profile = getUserProfileById(params.customerId);
        if (!profile) {
            return controls.error(`No profile found for customerId ${params.customerId}.`);
        }

        const genreCounts: Record<string, number> = {};
        const superCategoryCounts: Record<string, number> = {};

        for (const key of profile.topChannels) {
            const channel = getChannelByKey(key);
            if (!channel) continue;

            if (channel.genre) {
                genreCounts[channel.genre] = (genreCounts[channel.genre] ?? 0) + 1;
            }
            if (channel.superCategory) {
                superCategoryCounts[channel.superCategory] = (superCategoryCounts[channel.superCategory] ?? 0) + 1;
            }
        }

        // Emit all genre tags present
        const genres: string[] = [];
        for (const genre of Object.keys(genreCounts)) {
            const tag = GENRE_TAG_MAP[genre];
            if (tag) {
                addAgentTags([tag]);
                genres.push(genre);
            }
        }

        // Emit dominant super-category tag
        let dominantSuperCategory: string | null = null;
        let maxCount = 0;
        for (const [cat, count] of Object.entries(superCategoryCounts)) {
            if (count > maxCount) {
                maxCount = count;
                dominantSuperCategory = cat;
            }
        }
        if (dominantSuperCategory) {
            const tag = SUPER_CATEGORY_TAG_MAP[dominantSuperCategory];
            if (tag) addAgentTags([tag]);
        }

        // Emit artist affinity tags
        for (const artist of profile.topArtists) {
            addAgentTags(["affinity:artist:" + artist.toLowerCase().replace(/\s+/g, "-")]);
        }

        return controls.result({
            data: {
                genres,
                dominantSuperCategory,
                topArtists: profile.topArtists,
                topChannels: profile.topChannels,
            },
        });
    },
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 3 — Content Awareness Tool
// ─────────────────────────────────────────────────────────────────────────────

const GetContentForUser = tools.registerTool({
    name: "GetContentForUser",
    type: "lookup",
    noCodeId: "get-content-for-user",
    description:
        "Find SiriusXM events matching the caller's top artists. Returns upcoming live events " +
        "and past on-demand recordings. Call this after GetAffinityProfile.",
    params: {
        customerId: toolParam.string(
            "The userId of the identified caller."
        ),
    },
    func: (_ctx, params, controls) => {
        const profile = getUserProfileById(params.customerId);
        if (!profile) {
            return controls.error(`No profile found for customerId ${params.customerId}.`);
        }

        const today = new Date().toISOString().split("T")[0];
        const upcomingSeen = new Set<string>();
        const pastSeen = new Set<string>();
        const upcoming: EventRecord[] = [];
        const past: EventRecord[] = [];

        for (const artist of profile.topArtists) {
            for (const event of getEventsByArtist(artist)) {
                if (event.date > today && !upcomingSeen.has(event.eventId)) {
                    upcomingSeen.add(event.eventId);
                    upcoming.push(event);
                } else if (event.date <= today && !pastSeen.has(event.eventId)) {
                    pastSeen.add(event.eventId);
                    past.push(event);
                }
            }
        }

        upcoming.sort((a, b) => a.date.localeCompare(b.date));
        past.sort((a, b) => b.date.localeCompare(a.date));

        const hasLive = upcoming.length > 0;
        const hasOnDemand = past.length > 0;

        if (hasLive && hasOnDemand) {
            addAgentTags([TAGS.response.contentBoth]);
        } else if (hasLive) {
            addAgentTags([TAGS.response.contentLive]);
        } else if (hasOnDemand) {
            addAgentTags([TAGS.response.contentOnDemand]);
        } else {
            addAgentTags([TAGS.response.noContent]);
        }

        return controls.result({
            data: {
                upcomingEvents: upcoming.slice(0, 3).map(e => ({
                    date: e.date,
                    artist: e.artistGuest,
                    channels: e.channels,
                    startTime: e.startTime,
                    type: e.eventType,
                })),
                onDemandEvents: past.slice(0, 3).map(e => ({
                    date: e.date,
                    artist: e.artistGuest,
                    channels: e.channels,
                    type: e.eventType,
                })),
                hasLive,
                hasOnDemand,
            },
        });
    },
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4 — Trialer Conversion Decision Tools
// ─────────────────────────────────────────────────────────────────────────────

const PREMIER_PLUS_KEYS = ["5ad6890a-adaf-48bf-adbf-d0bf28def878", "634ea01e-4ae2-c7e8-7567-138965e8a6fe", "a44e273d-a7e5-c358-a8ae-39dc91ca9c30"];

const GetRetentionOffer = tools.registerTool({
    name: "GetRetentionOffer",
    type: "lookup",
    noCodeId: "get-retention-offer",
    description:
        "Determine the best retention offer for this customer based on their subscription tier, " +
        "trial expiry, and channel affinity. Call this after GetSubscriptionDetails.",
    params: {
        customerId: toolParam.string("The userId of the identified caller."),
    },
    func: (_ctx, params, controls) => {
        const profile = getUserProfileById(params.customerId);
        if (!profile) {
            return controls.error(`No profile found for customerId ${params.customerId}.`);
        }

        const tier = profile.subscriptionTier;
        const today = new Date().toISOString().split("T")[0];
        const missingChannels: string[] = [];
        let offerType: string;
        const talkingPoints: string[] = [];

        if (tier === "trial") {
            const daysLeft = profile.trialEndDate
                ? Math.ceil(
                      (new Date(profile.trialEndDate).getTime() - new Date(today).getTime()) /
                          (1000 * 60 * 60 * 24)
                  )
                : 999;
            if (daysLeft <= 7) {
                offerType = "upgrade-premier";
                talkingPoints.push(
                    `Trial ends in ${daysLeft} day(s) — upgrade to a Premier subscription now to keep full access.`
                );
            } else {
                offerType = "extend-trial";
                talkingPoints.push(`Extend your trial to keep exploring before committing.`);
            }
        } else if (tier === "select") {
            const wantsPremier = profile.topChannels.some(ch => PREMIER_PLUS_KEYS.includes(ch));
            if (wantsPremier) {
                offerType = "upgrade-premier";
                for (const ch of profile.topChannels) {
                    if (PREMIER_PLUS_KEYS.includes(ch)) {
                        const record = getChannelByKey(ch);
                        if (record) missingChannels.push(record.channelName);
                    }
                }
                talkingPoints.push(`Upgrade to Premier to unlock: ${missingChannels.join(", ")}.`);
            } else {
                offerType = "promotional";
                talkingPoints.push("Special promotional rate available for you today.");
            }
        } else if (tier === "expired") {
            offerType = "upgrade-premier";
            talkingPoints.push("Reactivate with a Premier subscription to restore access.");
        } else {
            offerType = "no-offer";
        }

        const tagMap: Record<string, string> = {
            "upgrade-premier": TAGS.offer.upgradePremier,
            "extend-trial": TAGS.offer.extendTrial,
            "promotional": TAGS.offer.promotional,
            "no-offer": TAGS.offer.noOffer,
        };
        addAgentTags([tagMap[offerType]]);

        return controls.result({
            data: {
                offerType,
                talkingPoints,
                missingChannels: missingChannels.length > 0 ? missingChannels : undefined,
            },
        });
    },
});

const AcknowledgeCancellation = tools.registerTool({
    name: "AcknowledgeCancellation",
    type: "lookup",
    noCodeId: "acknowledge-cancellation",
    description:
        "Record that the customer has declined all offers and does not wish to subscribe or continue. " +
        "Call this when the customer explicitly says they are not interested or want to cancel.",
    params: {},
    func: (_ctx, _params, controls) => {
        addAgentTags([TAGS.outcome.cancelled]);
        return controls.result({
            data: { recorded: true },
            instructions: "Thank the customer warmly for their time and wish them well.",
        });
    },
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 5 — Live Agent Escalation Tools
// ─────────────────────────────────────────────────────────────────────────────

const RecordSaveAttempt = tools.registerTool({
    name: "RecordSaveAttempt",
    type: "lookup",
    noCodeId: "record-save-attempt",
    description:
        "Record that a speed-bump save attempt is being made — the agent is acknowledging the " +
        "transfer request and asking about the customer's concern before escalating. " +
        "Call this BEFORE asking the customer what they need help with.",
    params: {},
    func: (_ctx, _params, controls) => {
        addAgentTags([TAGS.transfer.saveAttempted]);
        return controls.result({
            data: { recorded: true },
            instructions:
                "Acknowledge the customer's request warmly (e.g. 'Of course, I can connect you with a team member.'). " +
                "Then ask: 'Before I do, could you tell me what you're hoping to get resolved? " +
                "I may be able to take care of it for you right now.' " +
                "Attempt to resolve the issue using available tools. " +
                "Only call RecordTransfer if the customer explicitly insists or the issue cannot be resolved.",
        });
    },
});

const RecordTransfer = tools.registerTool({
    name: "RecordTransfer",
    type: "lookup",
    noCodeId: "record-transfer",
    description:
        "Record that this conversation is being escalated to a live agent. " +
        "Call this only after a save attempt has been made (or for billing disputes that cannot be resolved).",
    params: {
        reason: toolParam.string(
            "Why the transfer is happening: 'explicit-request' (customer insisted on a human after save attempt), " +
            "'billing-dispute' (charge or refund issue the agent cannot resolve), or " +
            "'unresolved' (issue could not be resolved by available tools)."
        ),
        saveAttempted: toolParam.string(
            "'true' if RecordSaveAttempt was called earlier in this conversation, otherwise 'false'."
        ),
    },
    func: (_ctx, params, controls) => {
        const tags: string[] = [TAGS.outcome.transferred];
        const reasonMap: Record<string, string> = {
            "explicit-request": TAGS.transfer.reasonExplicitRequest,
            "billing-dispute":  TAGS.transfer.reasonBillingDispute,
            "unresolved":       TAGS.transfer.reasonUnresolved,
        };
        if (reasonMap[params.reason]) tags.push(reasonMap[params.reason]);
        if (params.saveAttempted === "true") tags.push(TAGS.transfer.saveFailed);
        addAgentTags(tags);
        return controls.result({
            data: { recorded: true, reason: params.reason },
            instructions:
                "Proceed with transferring the customer to a live agent. " +
                "Let them know they will be connected shortly.",
        });
    },
});

const RecordSelfServed = tools.registerTool({
    name: "RecordSelfServed",
    type: "lookup",
    noCodeId: "record-self-served",
    description:
        "Record that the customer's issue was fully resolved without a live agent transfer. " +
        "Call this when the customer confirms their question has been answered.",
    params: {
        saveAttempted: toolParam.string(
            "'true' if RecordSaveAttempt was called earlier in this conversation (i.e. the speed bump succeeded), otherwise 'false'."
        ),
    },
    func: (_ctx, params, controls) => {
        const tags: string[] = [TAGS.outcome.selfServed];
        if (params.saveAttempted === "true") tags.push(TAGS.transfer.saveSucceeded);
        addAgentTags(tags);
        return controls.result({
            data: { recorded: true },
            instructions:
                "Confirm the issue is resolved and ask if there is anything else you can help with.",
        });
    },
});

// ─────────────────────────────────────────────────────────────────────────────
// Pre-built loyalty tool (day-1 demo)
// ─────────────────────────────────────────────────────────────────────────────

type LoyaltyInfo = {
    id: string;
    customer_id: string;
    tier: string;
    points_balance: number;
    lifetime_points: number;
    tier_expires_at?: string;
    created_at: string;
};

type LoyaltyResponse = {
    success: boolean;
    data: LoyaltyInfo;
};

tools.registerTool({
    name: "PreBuiltGetLoyaltyInfo",
    type: "lookup",
    noCodeId: "pre-built-get-loyalty-info",
    description: "Get information about the Sierra Explorers loyalty program for a given customer",
    params: {
        customerId: toolParam.string(
            "The username or email of the customer we want to get loyalty information for."
        ),
    },
    func: (ctx, params, controls) => {
        const result = fetch.jsonSync<LoyaltyResponse>(
            `https://gosierra.biz/api/v1/customers/${params.customerId}/loyalty`,
            { method: "GET", headers: { "X-API-Key": "sierra_u" } }
        );
        if (result.status !== 200 || !result.body) {
            return controls.error("Failed to get loyalty information");
        }
        return controls.result({ data: { loyaltyInfo: result.body.data } });
    },
});

// ─────────────────────────────────────────────────────────────────────────────
// Agent
// ─────────────────────────────────────────────────────────────────────────────

export default createAgent({
    onVoiceCheck: _vcd => ({
        voiceInputSupported: true,
        persona: "daisy-jordan",
    } satisfies VoiceCheckOutput),

    brand: {
        agentName: "SiriusXM Virtual Assistant",
        organizationName: "SiriusXM",
        customerServiceTeamName: "SiriusXM Customer Care",
        customerNoun: "subscriber",
    },
    config: {
        voiceConfig: {
            enabledEvents: ["start", "inactivity"],
            inactivityTimeoutSeconds: 30,
        },
        textConfig: {
            enabledEvents: ["inactivity"],
            inactivityTimeoutSeconds: 100,
        },
        postConversationDelaySeconds: 60 * 15,
    },
    onClientEvent: (props, next) => {
        //eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { event, conversation } = props;
        switch (event.type) {
            default:
                next(props);
        }
    },

    useCustomGoalAgentProps: () => ({}),

    useWrapper: agent => agent,

    useAdditionalGoalAgentChildren: () => {
        return (
            <>
                {/* Phase 9: Language switching (EN ↔ FR) */}
                <DynamicLanguageSwitching />

                {/* Phase 9: Voice-curated demo journey */}
                <Goal description="Voice channel: curated demo journey — identify silently, recommend content, close gracefully.">
                    <Rule content="On voice (channel=voice_phone): before making any spoken response, silently call ResolveCallerByPhone, then GetSubscriptionDetails, then GetAffinityProfile, then GetContentForUser in sequence. Your first spoken message must combine the greeting and content recommendation in 2 sentences maximum." />
                    <Rule content="On voice: do not make retention offers, do not suggest upgrades, and do not ask for billing information." />
                    <Rule content="On voice: if the customer asks to speak to a human or raises a billing issue, respond with exactly: 'I'll have someone from our team follow up with you shortly' and close the conversation gracefully. Do not call RecordTransfer." />
                    <Rule content="On voice: never use lists, bullet points, channel numbers, or markdown formatting. Speak naturally as if in a real phone conversation." />
                </Goal>

                {/* Phase 0: Render caller info as context for the LLM */}
                <DynamicCustomerInfo />

                {/* Phase 0: Caller identification tools */}
                <ResolveCallerByPhone />
                <ResolveCallerByEmail />

                {/* Phase 0: Identify the caller before asking why they are reaching out */}
                <Goal description="Identify the caller before asking why they are reaching out.">
                    <Rule content="Your very first action MUST be to call ResolveCallerByPhone. Do this before saying anything to the customer." />
                    <Rule content="If ResolveCallerByPhone returns found=false, ask the caller for their email address, then call ResolveCallerByEmail with that email." />
                    <Rule content="If ResolveCallerByEmail also returns found=false, proceed as an anonymous caller without asking for more identification." />
                    <Rule content="After identifying the caller, greet them by their first name if known, then ask why they are reaching out." />
                </Goal>

                {/* Phase 1: Subscription awareness tool */}
                <GetSubscriptionDetails />

                {/* Phase 1: Understand subscription before suggesting anything */}
                <Goal description="Understand the customer's current subscription and identify upgrade paths.">
                    <Rule content="After identifying the caller, call GetSubscriptionDetails with their userId to understand their subscription." />
                    <Rule content="Always know what the caller has before suggesting what they might want." />
                    <Rule content="If the caller is on a trial, acknowledge the trial and mention the expiry date." />
                    <Rule content="If the caller is on Select tier, name ALL excluded channels from GetSubscriptionDetails (Howard Stern, Liquid Metal, and SiriusXM Premier) when explaining the Premier upgrade path." />
                    <Rule content="If the caller's subscription is expired, offer reactivation as the first suggestion." />
                </Goal>

                {/* Phase 2: Audience affinity tool */}
                <GetAffinityProfile />

                {/* Phase 2: Understand listening preferences */}
                <Goal description="Understand what kind of content the caller loves most.">
                    <Rule content="After retrieving subscription details, call GetAffinityProfile with the caller's userId." />
                    <Rule content="Use the returned genres and top artists to personalise your response." />
                    <Rule content="Lead with the caller's dominant genre or artist when recommending content." />
                </Goal>

                {/* Phase 3: Content awareness tool */}
                <GetContentForUser />

                {/* Phase 3: Find matching content */}
                <Goal description="Find content that matches what the caller loves and is actually available.">
                    <Rule content="After identifying the caller's affinity, call GetContentForUser with their userId." />
                    <Rule content="Never mention an artist, show, or channel that cannot be confirmed in the content database." />
                    <Rule content="If upcomingEvents are present, recommend them with specific dates and channel names." />
                    <Rule content="If only onDemandEvents are present, recommend the on-demand recording." />
                    <Rule content="If no content is found, pivot to the subscription value proposition instead of inventing content." />
                </Goal>

                {/* Phase 4: Retention offer tools */}
                <GetRetentionOffer />
                <AcknowledgeCancellation />

                {/* Phase 4: Make a personalised retention offer */}
                <Goal description="Determine the best offer to retain this customer.">
                    <Rule content="After retrieving subscription details, call GetRetentionOffer with the caller's userId." />
                    <Rule content="Only make an offer after you have confirmed their subscription status." />
                    <Rule content="Present the offer naturally as part of the conversation — not as a hard sell." />
                    <Rule content="When offerType is upgrade-premier, always explicitly name the Premier subscription tier." />
                    <Rule content="If the customer explicitly declines all offers or says they are not interested in continuing, call AcknowledgeCancellation." />
                </Goal>

                {/* Phase 5: Escalation tools */}
                <RecordSaveAttempt />
                <RecordTransfer />
                <RecordSelfServed />

                {/* Phase 5: Speed bump — understand concern before transferring */}
                <Goal description="When a customer requests a live agent, apply the speed bump: gather context, attempt resolution, then transfer only if necessary.">
                    <Rule content="When a customer requests a live agent or human representative, call RecordSaveAttempt FIRST, then acknowledge their request warmly and ask what they are hoping to get resolved. Attempt to help using available tools before escalating." />
                    <Rule content="If the customer has a billing dispute or a charge they cannot explain — an issue you cannot resolve — call RecordTransfer with reason='billing-dispute' and saveAttempted='true'." />
                    <Rule content="If the customer explicitly insists on speaking with a human after you have tried to help, call RecordTransfer with reason='explicit-request' and saveAttempted='true'." />
                    <Rule content="If you cannot resolve the issue through any available tool, call RecordTransfer with reason='unresolved' and set saveAttempted based on whether you called RecordSaveAttempt." />
                    <Rule content="When the customer confirms their issue is fully resolved, call RecordSelfServed and set saveAttempted='true' if you called RecordSaveAttempt during this conversation, otherwise 'false'." />
                </Goal>

                <Goal description="Determine why the customer is reaching out to customer support.">
                    <Rule content="If unclear, ask the customer why they are reaching out to customer support." />
                </Goal>
            </>
        );
    },

    useCustomAbuseDetectionProps: () => {
        const allowedBehaviors = [
            "The customer is asking about sports or outdoor activities",
            "The customer has questions about the rules of sports",
            "The customer has a mathematics-related question",
        ];
        return {
            mode: "observe",
            foundAbuseDefendAction: () => <SierraUniversityAbuseDetection />,
            abuseOverrides: {
                [AbuseType.OutOfContext]: { honeypots: allowedBehaviors },
                [AbuseType.OutOfBounds]: { honeypots: allowedBehaviors },
            },
        };
    },

    useTools: () => ({}),

    integrationsRegistry,
});
