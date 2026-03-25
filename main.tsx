// Copyright Sierra

import { createAgent } from "@sierra/agent/base";
import { AbuseType, fetch, Goal, jsx, Rule, toolParam, tools } from "@sierra/agent";
import { SierraUniversityAbuseDetection } from "./skills/abuse-detection";
import {
    TrialerUpgradeOffer,
    TrialerConversionSuccess,
    TrialerConversionDeferred,
    TrialerExtensionOffer,
} from "./skills/trialer-upgrade-offer";
import { TrialerCustomerInfo } from "./dynamic-customer-info";
import { Tags } from "./tags";
import {
    getUserByEmail,
    getAffinityByProfile,
    getListeningHistoryByProfile,
    getFavoritesByProfile,
    searchContentCatalog,
    getPersonalizedRecommendations,
} from "./data/synthetic-data";
import integrationsRegistry from "./integrations-registry";

/**
 * Welcome to Sierra University. Below, you'll
 * find the createAgent function, which takes parameters that can
 * customize your agent.
 *
 * All configuration parameters that start with `use` are compatible with Sierra's SDK hooks.
 */
export default createAgent({
    // General configurations for the agent are available here.
    config: {
        voiceConfig: {
            enabledEvents: ["start", "inactivity"],
            inactivityTimeoutSeconds: 30,
        },
        textConfig: {
            enabledEvents: ["inactivity"],
            inactivityTimeoutSeconds: 100,
        },
        postConversationDelaySeconds: 60 * 15, // 15 minutes
    },
    // Client events are triggered by a sierra client
    // createAgent handles most of these for you.
    onClientEvent: (props, next) => {
        //eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { event, conversation } = props;
        switch (event.type) {
            default:
                next(props);
        }
    },

    // Goal agent props are the properties passed to the GoalAgent component under the hood
    useCustomGoalAgentProps: () => ({
        transferToolProps: "none",
    }),

    // Use `useWrapper` to add contexts needed by your agent and its tools. This enables
    // global state for your agent and its tools.
    useWrapper: agent => {
        return (
            <>
                <TrialerCustomerInfo />
                {agent}
            </>
        );
    },
    // Goal agent children are JSX components that can be used to add additional children to the underlying GoalAgent component.
    useAdditionalGoalAgentChildren: () => {
        return (
            <>
                <Goal description="Determine why the customer is reaching out to customer support.">
                    <Rule content="If unclear, ask the customer why they are reaching out to customer support." />
                </Goal>

                <Goal description="Collect the user's email address at the very start of the conversation, before anything else.">
                    <Rule content="The very first thing you must do in every conversation is ask the user for their email address." />
                    <Rule content="Do not proceed with any other topic until the user has provided their email." />
                    <Rule content="Once the user provides their email, immediately call the ResolveTrialerProfile tool with that email." />
                    <Rule content="If the tool returns a profile, greet the user by their first name and continue the conversation. If no profile is found, greet them generically and continue." />
                </Goal>

                <Goal description="Convert trial users to paid subscribers by surfacing personalized content moments tied to their specific artist affinities and content category interests, then presenting a relevant subscription offer.">
                    <Rule content="Only run this journey if ResolveTrialerProfile confirms the customer is a trialer. Do not pitch upgrades to self-pay, winback, or upsell segments." />
                    <Rule content="Immediately after ResolveTrialerProfile returns a profile, call GetPersonalizedRecommendations using the profileId. Keep the full list of artistMatches and categoryMatches in memory for the entire conversation." />
                    <Rule content="Always lead with a specific content moment before any mention of subscription. Use artistMatches first — they are the highest-confidence match. Example: 'Styx has an exclusive interview on Faction Talk, Channel 103, this Thursday at 5pm ET.'" />
                    <Rule content="If the user responds to an artist match, follow up with other artist matches from their profile before moving to category matches. Keep the conversation anchored to their specific interests." />
                    <Rule content="If no artist match resonates, pivot to category matches — surface content in their top content type (sports, music, podcast, or channel) with specific titles, channels, and air times." />
                    <Rule content="Use GetListeningHistory and GetUserFavorites to make the pitch more personal — reference content they have already listened to or saved. Example: 'I can see you already favorited Metallica Radio.'" />
                    <Rule content="Pitch strategy based on top affinity confidence: 95%+ → present full upgrade offer tied to specific content they love. 70–94% → surface content, gauge interest, then offer. Below 70% → skip upgrade, offer trial extension only." />
                    <Rule content="When presenting the upgrade offer, tie it directly to the content: 'With a subscription you'll never miss a Styx exclusive — plus get on-demand access to everything on Liquid Metal.' Do not make a generic pitch." />
                    <Rule content="Do not repeat the upgrade pitch more than once. If declined, acknowledge gracefully and close without pressure." />
                </Goal>
            </>
        );
    },
    // Abuse detection is a core feature of Sierra. It is used to detect and respond to abuse in a conversation. You can override the default behavior as outlined below.
    useCustomAbuseDetectionProps: () => {
        const allowedBehaviors = [
            "The customer is asking about sports or outdoor activities",
            "The customer has questions about the rules of sports",
            "The customer has a mathematics-related question",
        ];
        return {
            mode: "observe", // Don't do this in an actual app
            foundAbuseDefendAction: () => <SierraUniversityAbuseDetection />,
            abuseOverrides: {
                [AbuseType.OutOfContext]: {
                    honeypots: allowedBehaviors,
                },
                [AbuseType.OutOfBounds]: {
                    honeypots: allowedBehaviors,
                },
            },
        };
    },
    // Use `useTools` to implement custom tools defined in the UI.
    // You can also define tools fully in code in useAdditionalGoalAgentChildren.
    useTools: () => {
        return {};
    },
    // Use `integrationRegistry` to add integrations to your agent.
    // By default, the integrationsRegistry contains all builtin integrations
    // from the @sierra/integrations-builtin package.
    //
    // To add custom integrations:
    // 1. Run `pnpm sierra init-integration` to create a new integration
    // 2. Run `pnpm sierra watch` to upload your code to Agent Studio
    // 3. The imported `integrationRegistry` in this file will pick up the
    //    changes from the rebuilt `integrations-registry.ts` file.
    integrationsRegistry,
});

/**
 * Adding our first tool! We're actually adding this because we want to demonstrate to the
 * day 1 folks what it's like to have a tool already created by engineering and ready to use.
 */
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

// ── Trialer Conversion Tools ───────────────────────────────────────────────────

/**
 * Entry point for the TrialerConversion journey.
 * Resolves the user's email → profile + top affinity from synthetic data.
 * Called immediately after the agent collects the email at conversation start.
 */
tools.registerTool({
    name: "ResolveTrialerProfile",
    type: "lookup",
    noCodeId: "resolve-trialer-profile",
    description:
        "Resolve a user's full trialer profile — segment, profileId, listenerId, name, and top affinity match — from their email address. Call this immediately after the user provides their email.",
    params: {
        email: toolParam.string("The email address the user provided at the start of the conversation."),
    },
    func: (_ctx, params, controls) => {
        const user = getUserByEmail(params.email);
        if (!user) {
            return controls.result({
                data: {
                    found: false,
                    message: `No profile found for ${params.email}. Greet the user generically and continue.`,
                },
            });
        }

        // Load full ranked affinity list from affinity.csv
        const affinities = getAffinityByProfile(user.profileID);
        const top = affinities[0];

        // Pre-compute personalized recommendations across all affinities
        const recommendations = getPersonalizedRecommendations(user.profileID);
        const artistMatches = recommendations.filter(r => r.matchedOn.matchType === "artist");
        const categoryMatches = recommendations.filter(r => r.matchedOn.matchType === "content_type");

        const pitchStrategy =
            !top ? "no_affinity_data" :
            top.confidence >= 0.95 ? "high_confidence_upgrade" :
            top.confidence >= 0.7  ? "medium_confidence_upgrade" :
                                     "low_confidence_extension";

        return controls.result({
            data: {
                found: true,
                firstName: user.firstName,
                lastName: user.lastName,
                profileID: user.profileID,
                listenerID: user.listenerID,
                segment: user.segment,
                isTrialer: user.segment === "trialer",
                // Full ranked affinity list — keep this in memory for the whole conversation
                affinities: affinities.map(a => ({
                    rank: a.rank,
                    artistName: a.artistName,
                    contentType: a.contentType,
                    confidence: a.confidence,
                })),
                // Pre-matched catalog content — use these to surface moments
                artistMatches: artistMatches.slice(0, 3).map(r => ({
                    title: r.contentItem.title,
                    artistHost: r.contentItem.artistHost,
                    channel: r.contentItem.channel,
                    channelNumber: r.contentItem.channelNumber,
                    airTime: r.contentItem.airTime,
                    link: r.contentItem.link,
                    matchedArtist: r.matchedOn.artistName,
                    confidence: r.matchedOn.confidence,
                })),
                categoryMatches: categoryMatches.slice(0, 3).map(r => ({
                    title: r.contentItem.title,
                    artistHost: r.contentItem.artistHost,
                    channel: r.contentItem.channel,
                    channelNumber: r.contentItem.channelNumber,
                    airTime: r.contentItem.airTime,
                    link: r.contentItem.link,
                    contentType: r.contentItem.contentType,
                    confidence: r.matchedOn.confidence,
                })),
                // Pitch strategy derived from top affinity confidence
                pitchStrategy,
                tag: Tags.STAGE_ENTRY,
                instruction: "Store this full profile in memory. Use affinities and matched content throughout the entire conversation — do not forget them between turns.",
            },
        });
    },
});

/**
 * Returns all personalized content recommendations for a trialer ranked by affinity confidence.
 * Matches by both specific artist/talent AND content category (music/sports/podcast/channel).
 * Call this after ResolveTrialerProfile to prime the conversation with relevant content moments.
 * Tags: stage:affinity_resolved, stage:content_surfaced
 */
tools.registerTool({
    name: "GetPersonalizedRecommendations",
    type: "lookup",
    noCodeId: "get-personalized-recommendations",
    description:
        "Retrieve all personalized content recommendations for a trialer based on their full affinity profile. Returns artist-specific matches (highest confidence) and content-category matches (fallback). Use the results to surface content moments before any subscription pitch.",
    params: {
        profileId: toolParam.string("The trialer's profile ID returned by ResolveTrialerProfile."),
    },
    func: (_ctx, params, controls) => {
        const recommendations = getPersonalizedRecommendations(params.profileId);

        if (recommendations.length === 0) {
            return controls.error(
                `No recommendations found for profileId: ${params.profileId}. Tag: ${Tags.OUTCOME_NO_MATCH}`
            );
        }

        const artistMatches = recommendations.filter(r => r.matchedOn.matchType === "artist");
        const categoryMatches = recommendations.filter(r => r.matchedOn.matchType === "content_type");

        return controls.result({
            data: {
                artistMatches: artistMatches.map(r => ({
                    title: r.contentItem.title,
                    artistHost: r.contentItem.artistHost,
                    channel: r.contentItem.channel,
                    channelNumber: r.contentItem.channelNumber,
                    airTime: r.contentItem.airTime,
                    link: r.contentItem.link,
                    imageUrl: r.contentItem.imageUrl,
                    matchedArtist: r.matchedOn.artistName,
                    confidence: r.matchedOn.confidence,
                })),
                categoryMatches: categoryMatches.map(r => ({
                    title: r.contentItem.title,
                    artistHost: r.contentItem.artistHost,
                    channel: r.contentItem.channel,
                    channelNumber: r.contentItem.channelNumber,
                    airTime: r.contentItem.airTime,
                    link: r.contentItem.link,
                    contentType: r.contentItem.contentType,
                    confidence: r.matchedOn.confidence,
                })),
                tags: [Tags.STAGE_AFFINITY_RESOLVED, Tags.STAGE_CONTENT_SURFACED],
                instruction: "Lead with artistMatches — they are highest confidence. Use categoryMatches as secondary suggestions if the user wants more. Always mention specific channel numbers and air times.",
            },
        });
    },
});

/**
 * Fetches the full affinity profile for a trialer from the affinity.csv-backed API.
 * Returns ranked artist/content-type affinities with confidence scores.
 * Tags: affinity:artist_match_high/medium/low, affinity:content_type_*
 */
tools.registerTool({
    name: "GetAffinityProfile",
    type: "lookup",
    noCodeId: "get-affinity-profile",
    description:
        "Retrieve the ranked affinity profile for a trialer — their top artists, content types, and confidence scores from the ML model. Use the profileId from the Trialer Profile context.",
    params: {
        profileId: toolParam.string(
            "The trialer's profile ID, available in the Trialer Profile context injected at conversation start."
        ),
    },
    func: (_ctx, params, controls) => {
        const affinities = getAffinityByProfile(params.profileId);
        if (affinities.length === 0) {
            return controls.error(
                `No affinity data found for profileId: ${params.profileId}. Tag: ${Tags.OUTCOME_NO_MATCH}`
            );
        }
        const top = affinities[0];
        const confidenceTag =
            top.confidence >= 0.95
                ? Tags.AFFINITY_HIGH
                : top.confidence >= 0.7
                  ? Tags.AFFINITY_MEDIUM
                  : Tags.AFFINITY_LOW;
        const contentTypeTag = `affinity:content_type_${top.contentType}` as const;
        return controls.result({
            data: {
                affinities,
                topArtist: top.artistName,
                topContentType: top.contentType,
                topConfidence: top.confidence,
                tags: [Tags.STAGE_AFFINITY_RESOLVED, confidenceTag, contentTypeTag],
            },
        });
    },
});

/**
 * Fetches recent listening history for a trialer from the listening_history.csv-backed API.
 * Used to enrich the personalized pitch with specific shows the user has already engaged with.
 * Tags: stage:history_fetched
 */
tools.registerTool({
    name: "GetListeningHistory",
    type: "lookup",
    noCodeId: "get-listening-history",
    description:
        "Retrieve recent listening history for a trialer to enrich the personalized pitch. Returns content titles, artists, and listen duration sorted by recency.",
    params: {
        profileId: toolParam.string("The trialer's profile ID from the Trialer Profile context."),
        limit: toolParam.number(
            "Maximum number of history records to return. Defaults to 10."
        ),
    },
    func: (_ctx, params, controls) => {
        const limit = params.limit ?? 10;
        const history = getListeningHistoryByProfile(params.profileId, limit);
        return controls.result({
            data: {
                history,
                tag: Tags.STAGE_HISTORY_FETCHED,
            },
        });
    },
});

/**
 * Fetches saved favorites for a trialer from the favorites.csv-backed API.
 * Used to identify strong engagement signals beyond passive listening.
 */
tools.registerTool({
    name: "GetUserFavorites",
    type: "lookup",
    noCodeId: "get-user-favorites",
    description:
        "Retrieve saved favorites for a trialer. Favorited content indicates stronger engagement than listen history alone and should be prioritized when crafting the personalized pitch.",
    params: {
        profileId: toolParam.string("The trialer's profile ID from the Trialer Profile context."),
    },
    func: (_ctx, params, controls) => {
        const favorites = getFavoritesByProfile(params.profileId);
        return controls.result({
            data: { favorites },
        });
    },
});

/**
 * Finds live or upcoming content in the catalog matching the trialer's top artist or content type.
 * Draws from the "Upcoming Artist Content" knowledge base (content_catalog.csv).
 * Tags: stage:content_surfaced
 */
tools.registerTool({
    name: "GetUpcomingContent",
    type: "lookup",
    noCodeId: "get-upcoming-content",
    description:
        "Find live or upcoming content in the catalog that matches a specific artist name or content type. Use this to surface the personalized content moment before presenting the upgrade offer.",
    params: {
        artistName: toolParam.string(
            "The artist or host name to search for. Use the topArtist from GetAffinityProfile or the Trialer Profile context."
        ),
        contentType: toolParam.string(
            "Optional content type filter: music, podcast, sports, or channel."
        ),
    },
    func: (_ctx, params, controls) => {
        const matches = searchContentCatalog(params.artistName, params.contentType);
        if (matches.length === 0) {
            return controls.error(
                `No upcoming content found for artist: ${params.artistName}. Tag: ${Tags.OUTCOME_NO_MATCH}`
            );
        }
        return controls.result({
            data: {
                matches,
                tag: Tags.STAGE_CONTENT_SURFACED,
            },
        });
    },
});

// ── Loyalty Tool (pre-built) ───────────────────────────────────────────────────

tools.registerTool({
    name: "PreBuiltGetLoyaltyInfo",
    type: "lookup",
    noCodeId: "pre-built-get-loyalty-info",
    description: "Get information about the Sierra Explorers loyalty program for a given customer",
    params: {
        customerId: toolParam.string(
            "The username or email of the customer we want to get loyalty information for. This must be a valid customer ID and not something generic like 'customer' or 'user'"
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
        return controls.result({
            data: { loyaltyInfo: result.body.data },
        });
    },
});
