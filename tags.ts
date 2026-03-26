// Copyright Sierra
// Tag schema for the SiriusXM trialer conversion agent.
// Emit tags via emitTag(TAG) inside tool func or JSX via agentTags prop.

import { addAgentTags } from "@sierra/agent";

export const TAGS = {
    // ── Phase 0: Caller Identification ────────────────────────────────────
    stage: {
        callerIdentifiedByPhone: "stage:caller-identified-phone",
        callerIdentifiedByEmail: "stage:caller-identified-email",
        callerUnknown: "stage:caller-unknown",
        emailRequested: "stage:email-requested",
    },

    // ── Phase 1: Subscription Awareness ───────────────────────────────────
    subscription: {
        trial: "subscription:trial",
        select: "subscription:select",
        premier: "subscription:premier",
        allAccess: "subscription:all-access",
        expired: "subscription:expired",
        surfaced: "stage:subscription-surfaced",
    },

    // ── Phase 2: Affinity Segmentation ────────────────────────────────────
    affinity: {
        genreHipHop: "affinity:genre:hip-hop",
        genreCountry: "affinity:genre:country",
        genrePop: "affinity:genre:pop",
        genreRock: "affinity:genre:rock",
        genreElectronic: "affinity:genre:electronic",
        genreJazz: "affinity:genre:jazz",
        genreClassicRock: "affinity:genre:classic-rock",
        superCategoryMusic: "affinity:super-category:music",
        superCategoryTalk: "affinity:super-category:talk",
        superCategoryHowardStern: "affinity:super-category:howard-stern",
        superCategoryComedy: "affinity:super-category:comedy",
        superCategorySports: "affinity:super-category:sports",
    },

    // ── Phase 3: Content Recommendations ──────────────────────────────────
    response: {
        contentLive: "response:content-live",
        contentOnDemand: "response:content-on-demand",
        contentBoth: "response:content-both",
        noContent: "response:no-content",
    },

    // ── Phase 4: Retention Offers ──────────────────────────────────────────
    offer: {
        upgradePremier: "offer:upgrade-premier",
        extendTrial: "offer:extend-trial",
        promotional: "offer:promotional",
        noOffer: "offer:no-offer",
    },

    // ── Phase 5: Outcomes ──────────────────────────────────────────────────
    outcome: {
        transferred: "outcome:transferred",
        selfServed: "outcome:self-served",
        converted: "outcome:converted",
        cancelled: "outcome:cancelled",
    },

    // ── Phase 5: Transfer Observability ───────────────────────────────────
    transfer: {
        reasonExplicitRequest: "transfer:reason:explicit-request",
        reasonBillingDispute:  "transfer:reason:billing-dispute",
        reasonUnresolved:      "transfer:reason:unresolved",
        saveAttempted:         "transfer:save-attempted",
        saveSucceeded:         "transfer:save-succeeded",
        saveFailed:            "transfer:save-failed",
    },

    // ── Phase 9: Channel Observability ────────────────────────────────────
    channel: {
        voice: "channel:voice",
        chat:  "channel:chat",
    },
} as const;

export type TagValue = (typeof TAGS)[keyof typeof TAGS][keyof (typeof TAGS)[keyof typeof TAGS]];

export function emitTag(tag: TagValue): void {
    addAgentTags([tag]);
}
