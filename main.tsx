// Copyright Sierra

import { createAgent } from "@sierra/agent/base";
import { AbuseType, addAgentTags, fetch, Goal, jsx, Rule, toolParam, tools } from "@sierra/agent";
import { SierraUniversityAbuseDetection } from "./skills/abuse-detection";
import integrationsRegistry from "./integrations-registry";
import { DynamicCustomerInfo } from "./dynamic-customer-info";
import { TAGS } from "./tags";
import { getUserProfileByPhone, getUserProfileByEmail, getUserProfileById, getChannelByKey } from "./data/synthetic-data";

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
const PREMIER_PLUS_CHANNELS = ["LiquidMetal", "HowardStern", "Premier1"];
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
        });
    },
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 2 — Audience Affinity Segmentation Tool
// ─────────────────────────────────────────────────────────────────────────────

// Local alias: channel keys in user profiles that differ from canonical CSV keys
const CHANNEL_KEY_ALIAS: Record<string, string> = {
    RapCaviar: "HipHopNation",
};

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

        for (const rawKey of profile.topChannels) {
            const key = CHANNEL_KEY_ALIAS[rawKey] ?? rawKey;
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
                    <Rule content="If the caller is on Select tier, mention that Premier channels (Howard Stern, Liquid Metal) are available as an upgrade." />
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
