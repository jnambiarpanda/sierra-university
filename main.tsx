// Copyright Sierra

import { createAgent } from "@sierra/agent/base";
import { AbuseType, addAgentTags, fetch, Goal, jsx, Rule, toolParam, tools, type VoiceCheckOutput } from "@sierra/agent";
import { SierraUniversityAbuseDetection } from "./skills/abuse-detection";
import integrationsRegistry from "./integrations-registry";
import { DynamicCustomerInfo } from "./dynamic-customer-info";
import { DynamicLanguageSwitching } from "./voice-swapper";
import { TAGS } from "./tags";
import { getUserProfileByPhone, getUserProfileByEmail, getUserProfileById, getChannelByKey, getEventsByArtist, type EventRecord } from "./data/synthetic-data";
import { searchChannelsByGenre, getAllGenreNames, TIER_TO_LINEUP_ID, getTalentBySlug, getTalentById } from "./data/sxm-catalog";

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
    func: (ctx, params, controls) => {
        const isVoice = ctx.channel === "voice_phone";
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
        for (const artistId of profile.topArtists) {
            const talent = getTalentById(artistId);
            if (talent) addAgentTags(["affinity:artist:" + talent.slug]);
        }

        // Build combined attachment (chat only): talent circles + channel squares in one block
        const tier = profile.subscriptionTier;
        const talentCards = !isVoice
            ? profile.topArtists
                .map(artistId => getTalentById(artistId))
                .filter((t): t is NonNullable<typeof t> => t !== null)
                .map(t => ({
                    entityId: t.entityId,
                    name: t.name,
                    imageUrl: t.imageUrl,
                    playerLandingPage: t.playerLandingPage,
                    imageShape: "circle" as const,
                }))
            : [];

        const channelKeysToShow: string[] =
            tier === "select"
                ? PREMIER_PLUS_CHANNELS
                : profile.topChannels.slice(0, 5);
        const channelCards = !isVoice
            ? channelKeysToShow
                .map(key => getChannelByKey(key))
                .filter((ch): ch is NonNullable<typeof ch> => !!ch && !!ch.imageUrl)
                .map(ch => ({
                    channelKey: ch.channelKey,
                    channelName: ch.channelName,
                    channelNumber: ch.channelNumber,
                    imageUrl: ch.imageUrl as string,
                    playerLandingPage: ch.playerLandingPage,
                    description: ch.description,
                    imageShape: "square" as const,
                }))
            : [];

        // Both talent and channel cards use "channel-cards" type (registered Sierra renderer).
        // imageShape: "circle" → talent  |  imageShape: "square" → channel
        const talentAsCards = talentCards.map(t => ({
            channelKey: t.entityId,
            channelName: t.name,
            channelNumber: "",
            imageUrl: t.imageUrl,
            playerLandingPage: t.playerLandingPage,
            description: "",
            imageShape: "circle" as const,
        }));
        const attachmentData = [
            ...(talentAsCards.length > 0 ? [{ type: "custom" as const, data: { type: "channel-cards" as const, title: "Talent you might like", channels: talentAsCards } }] : []),
            ...(channelCards.length > 0 ? [{ type: "custom" as const, data: { type: "channel-cards" as const, title: tier === "select" ? "Channels unlocked with Premier" : "Your channels", channels: channelCards } }] : []),
        ];
        const attachments = attachmentData.length > 0
            ? { id: "profile-cards", description: "SiriusXM talent and channel artwork", data: attachmentData }
            : undefined;

        return controls.result({
            data: {
                genres,
                dominantSuperCategory,
                topArtists: profile.topArtists,
                topChannels: profile.topChannels,
            },
            ...(attachments ? { attachments } : {}),
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

        for (const artistId of profile.topArtists) {
            const talent = getTalentById(artistId);
            if (!talent) continue;
            for (const event of getEventsByArtist(talent.name)) {
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
                talkingPoints.push("Promotional rate available: Select plan at $4.99/month for the first 3 months (regular price $9.99/month). This is a confirmed offer — present it directly and ask the customer if they would like to proceed.");
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

        const instructions = offerType === "promotional"
            ? "Present the promotional rate from talkingPoints directly to the customer. State the price clearly, confirm you can apply this offer today, and ask if they would like to proceed. Do NOT say someone will follow up or transfer the call."
            : undefined;

        return controls.result({
            data: {
                offerType,
                talkingPoints,
                missingChannels: missingChannels.length > 0 ? missingChannels : undefined,
            },
            ...(instructions ? { instructions } : {}),
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
// Phase 10 — Genre Discovery, Confidence Gating & Entitlement Filtering
// ─────────────────────────────────────────────────────────────────────────────


const SearchChannelsByGenre = tools.registerTool({
    name: "SearchChannelsByGenre",
    type: "lookup",
    noCodeId: "search-channels-by-genre",
    description:
        "Search the SiriusXM channel catalog by genre or mood (e.g. 'hip-hop', 'classic rock', 'relax'). " +
        "Returns only channels that exist in the catalog, filtered by the user's subscription entitlement " +
        "when a userId is provided. Never fabricates channel names — if the list is empty, there are no matches.",
    params: {
        genre: toolParam.string(
            "The genre or mood the user is looking for (e.g. 'hip-hop', 'country', 'relax', 'workout')."
        ),
        userId: toolParam.string(
            "The userId of the identified caller. Pass the resolved userId to filter results to channels the user can access. Pass an empty string for anonymous / unidentified callers."
        ),
    },
    func: (ctx, params, controls) => {
        const isVoice = ctx.conversationInfo.isVoice;

        // Resolve entitlement lineup ID from the user's subscription tier
        let lineupId: number | null | undefined;
        let tier: string | undefined;
        if (params.userId) {
            const profile = getUserProfileById(params.userId);
            if (profile) {
                lineupId = TIER_TO_LINEUP_ID[profile.subscriptionTier];
                tier = profile.subscriptionTier;
            }
        }

        const { channels, genreMatched, genreLandingPage } = searchChannelsByGenre(params.genre, {
            lineupId,
            scoreThreshold: 0.5,
        });

        // Observability tags — always emit search-called, then branch on outcome
        addAgentTags([TAGS.genre.searchCalled]);
        if (lineupId === null) {
            addAgentTags([TAGS.genre.expiredNoAccess]);
        } else {
            if (genreMatched !== null) {
                addAgentTags([TAGS.genre.genreFound]);
            } else {
                addAgentTags([TAGS.genre.genreNotFound]);
            }
            if (lineupId !== undefined) {
                addAgentTags([TAGS.genre.entitlementFiltered]);
                // Debug: emit lineup ID so it's visible in the agent trace
                addAgentTags([`entitlement:lineup:${lineupId}`]);
            }
        }
        // Landing page is independent of entitlement — emit even for expired users
        if (genreLandingPage) {
            addAgentTags([TAGS.genre.landingPageFound]);
        }

        // Classify confidence level for each result
        const classified = channels.map(e => ({
            name: e.channel.name,
            channelNumber: e.channel.number,
            description: e.channel.description,
            playerLandingPage: e.channel.playerLandingPage,
            score: e.score,
            relevance: e.score === 1.0 ? "dedicated" : e.score >= 0.7 ? "related" : "partial",
        }));

        // Determine if user has no subscription access (null = expired)
        const isExpired = params.userId && lineupId === null;

        // Build a human-readable message for the agent
        let message: string;
        if (isExpired) {
            const browseLink = genreLandingPage
                ? ` Browse the ${genreMatched ?? params.genre} genre page here: ${genreLandingPage}`
                : "";
            message = `Subscription expired — no channels currently accessible. Actively offer to help the user reactivate today. ${browseLink ? `You can still share this genre page so they can explore: ${genreLandingPage}` : ""}`;
        } else if (classified.length === 0) {
            const available = getAllGenreNames().slice(0, 8).join(", ");
            if (!genreMatched) {
                message = `No genre matching "${params.genre}" found in the catalog. Available genres include: ${available}.`;
            } else {
                message = `No channels for "${genreMatched}" are available in this user's subscription. Channels may require an upgrade.`;
            }
        } else {
            const names = classified.map(c => c.name).join(", ");
            const filtered = lineupId != null ? " in your plan" : "";
            const hasCards = !isVoice && channels.some(e => e.channel.imageUrl);
            // Lead with artwork cards so agent includes them; follow with URL
            const cardsIntro = hasCards
                ? `I've pulled up the ${genreMatched} channels${filtered} and attached artwork cards above for visual browsing`
                : `Here are the ${genreMatched} channels available${filtered}`;
            const browseLink = genreLandingPage ? ` Browse the full ${genreMatched} lineup: ${genreLandingPage}` : "";
            message = `${cardsIntro}: ${names}.${browseLink}`;
        }

        // Build channel card attachments (chat only; skip on voice)
        const channelCards = !isVoice
            ? channels
                  .filter(e => e.channel.imageUrl)
                  .map(e => ({
                      channelKey: e.channel.entityId,
                      channelName: e.channel.name,
                      channelNumber: e.channel.number,
                      imageUrl: e.channel.imageUrl,
                      playerLandingPage: e.channel.playerLandingPage,
                      description: e.channel.description,
                      imageShape: "square" as const,
                  }))
            : [];

        // Genre landing page card — shown when the genre matched a catalog entry
        const genreLandingCard = !isVoice && genreLandingPage && genreMatched
            ? {
                  type: "custom" as const,
                  data: {
                      type: "genre-landing" as const,
                      genreName: genreMatched,
                      landingPage: genreLandingPage,
                  },
              }
            : null;

        const attachmentData = [
            ...(channelCards.length > 0 ? [{
                type: "custom" as const,
                data: {
                    type: "channel-cards" as const,
                    title: genreMatched ? `${genreMatched} channels` : "Channels for you",
                    channels: channelCards,
                },
            }] : []),
            ...(genreLandingCard ? [genreLandingCard] : []),
        ];

        const attachments = attachmentData.length > 0
            ? { id: "channel-cards", description: "SiriusXM channel artwork", data: attachmentData }
            : undefined;

        // Build talkingPoints following the PromotionalOffer pattern — agent presents these directly
        let talkingPoints: string;
        if (isExpired) {
            const browseNote = genreLandingPage ? ` You can explore the genre here: ${genreLandingPage}` : "";
            talkingPoints = `Your subscription is currently expired so I can't show you live channels right now. I'd love to help you reactivate today — shall I walk you through the options?${browseNote}`;
        } else if (classified.length === 0) {
            const available = getAllGenreNames().slice(0, 6).join(", ");
            talkingPoints = genreMatched
                ? `No ${genreMatched} channels are available in your current plan. Available genres include: ${available}.`
                : `I couldn't find a genre matching "${params.genre}". Available genres include: ${available}.`;
        } else {
            const names = classified.map(c => c.name).join(", ");
            const filtered = lineupId != null ? " in your plan" : "";
            const cardsText = channelCards.length > 0
                ? "I've attached channel artwork cards above so you can browse each channel visually. "
                : "";
            const browseText = genreLandingPage
                ? ` Browse the full ${genreMatched} lineup here: ${genreLandingPage}`
                : "";
            talkingPoints = `${cardsText}Here are the ${genreMatched} channels available${filtered}: ${names}.${browseText}`;
        }

        const instructions = `Present the talkingPoints directly to the customer. Do not paraphrase or omit any part, including URLs.`;

        return controls.result({
            data: {
                genreMatched,
                talkingPoints,
                hasArtworkCards: channelCards.length > 0,
                genreLandingPage,
                // channels and message excluded so agent uses talkingPoints as primary content
            },
            instructions,
            ...(attachments ? { attachments } : {}),
        });
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
                    <Rule content="After identifying the caller, call GetSubscriptionDetails with their userId to understand their subscription. Always use the userId value returned in the data field of ResolveCallerByEmail or ResolveCallerByPhone — do not call GetSubscriptionDetails until that tool has returned successfully. You MUST call GetSubscriptionDetails for every identified caller, even if the customer has already stated their intent (e.g. to cancel)." />
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
                    <Rule content="GetAffinityProfile returns personal listening HISTORY. The topChannels field lists the user's personal favourite channels — it is NOT a complete list of SiriusXM channels for any genre. When the user asks 'what [genre] channels do you have?', do NOT cite topChannels from this result — call SearchChannelsByGenre." />
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
                    <Rule content="When offerType is promotional, you have the authority to confirm the promotional rate directly — state the price from talkingPoints and ask the customer if they would like to proceed. Do NOT say someone will follow up or transfer the call for a promotional rate offer." />
                    <Rule content="If the customer explicitly declines all offers or says they are not interested in continuing, call AcknowledgeCancellation." />
                </Goal>

                {/* Phase 5: Escalation tools */}
                <RecordSaveAttempt />
                <RecordTransfer />
                <RecordSelfServed />

                {/* Phase 5: Billing disputes — always escalate, never resolve inline */}
                <Goal description="Billing disputes, unexpected charges, and refund requests cannot be resolved by the virtual agent.">
                    <Rule content="If the customer reports an unexpected charge, a billing error, or requests a refund: you cannot process this. Call RecordTransfer with reason='billing-dispute' and saveAttempted='false' immediately. Never tell the customer 'the team will follow up' without having first called RecordTransfer." />
                </Goal>

                {/* Phase 5: Speed bump — understand concern before transferring */}
                <Goal description="When a customer explicitly requests a live agent, apply the speed bump: gather context, attempt resolution, then transfer only if necessary.">
                    <Rule content="When a customer requests a live agent or human representative, call RecordSaveAttempt FIRST, then acknowledge their request warmly and ask what they are hoping to get resolved. Attempt to help using available tools before escalating." />
                    <Rule content="If the customer explicitly insists on speaking with a human after you have tried to help, call RecordTransfer with reason='explicit-request' and saveAttempted='true'." />
                    <Rule content="If you cannot resolve the issue through any available tool, call RecordTransfer with reason='unresolved' and set saveAttempted based on whether you called RecordSaveAttempt. NOTE: A customer asking which channels SiriusXM has for a genre is resolvable via SearchChannelsByGenre — do NOT transfer for channel availability questions." />
                    <Rule content="When the customer confirms their issue is fully resolved, call RecordSelfServed and set saveAttempted='true' if you called RecordSaveAttempt during this conversation, otherwise 'false'." />
                </Goal>

                {/* Phase 10: Genre catalog search tool — placed before the generic "why are you calling" goal so genre questions are routed here first */}
                <SearchChannelsByGenre />

                {/* Phase 10: Genre-based channel discovery */}
                <Goal description="When the user mentions a music genre or asks about channel availability — including 'what hip-hop channels do you have for me?', 'what hip-hop channels are included in my plan?', 'what channels are available for [genre]?', 'show me [genre] channels', or any mention of a genre name — your immediate next action MUST be to call SearchChannelsByGenre before saying anything else.">
                    <Rule content="When the user mentions a music genre or asks about channel availability, your immediate next action MUST be to call SearchChannelsByGenre. Do this before saying anything else to the customer. This is required for ALL genres including: hip-hop, country, rock, bhangra, bossanova, tropical house, relax, workout, or any other genre. Pass the resolved userId." />
                    <Rule content="Never skip the SearchChannelsByGenre tool call based on your training knowledge. Even if you believe a genre may not exist on SiriusXM, you MUST call the tool first — your knowledge may be outdated." />
                    <Rule content="You always have access to the SiriusXM channel catalog via SearchChannelsByGenre. Do NOT tell the user you cannot access the channel list — call SearchChannelsByGenre instead." />
                    <Rule content="If account lookup fails or you cannot identify the user's account, this does NOT prevent you from answering genre questions. Call SearchChannelsByGenre immediately — without userId if needed — to answer channel availability questions. Never transfer a user to a live agent because of a failed account lookup when they asked about genre/channel availability." />
                    <Rule content="Do NOT use SearchPoliciesReference, GetSubscriptionDetails, or any other tool to answer channel availability questions. Do NOT use topChannels from GetAffinityProfile (those are personal favorites, not the full genre catalog). SearchChannelsByGenre is the ONLY authoritative source for what channels are available for a genre." />
                    <Rule content="When SearchChannelsByGenre returns results, read the `talkingPoints` field to the customer. The talkingPoints already contains all required text including any artwork card mentions and URLs — do not rewrite or summarize it." />
                    <Rule content="Never name a channel that was not in the talkingPoints returned by SearchChannelsByGenre. If talkingPoints says no channels were found, do not suggest channel names." />
                    <Rule content="The SearchChannelsByGenre talkingPoints includes a direct URL when available. Read talkingPoints directly to the customer — do not paraphrase or omit the URL." />
                    <Rule content="Do NOT call SearchChannelsByGenre for individual artist or talent names (e.g. 'Morgan Wallen', 'Rachel Maddow'). For artist queries use GetAffinityProfile and GetContentForUser." />
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
