// Copyright Sierra
// Structured tag schema for the Trialer Conversion journey.
// Tags are emitted via output.send() and surface in Sierra's Explorer for
// querying conversion rates, drop-offs, affinity performance, and offer outcomes.

import { useOutput } from "@sierra/agent";

export const Tags = {
    // ── Intent ────────────────────────────────────────────────────────────────
    INTENT_TRIALER_CONVERSION: "intent:trialer_conversion",
    INTENT_BROWSING:           "intent:browsing",
    INTENT_CHURN_RISK:         "intent:churn_risk",

    // ── Affinity ──────────────────────────────────────────────────────────────
    AFFINITY_HIGH:             "affinity:artist_match_high",   // confidence >= 0.95
    AFFINITY_MEDIUM:           "affinity:artist_match_medium", // confidence 0.70–0.94
    AFFINITY_LOW:              "affinity:artist_match_low",    // confidence < 0.70
    AFFINITY_TYPE_MUSIC:       "affinity:content_type_music",
    AFFINITY_TYPE_PODCAST:     "affinity:content_type_podcast",
    AFFINITY_TYPE_SPORTS:      "affinity:content_type_sports",
    AFFINITY_TYPE_CHANNEL:     "affinity:content_type_channel",

    // ── Stage ─────────────────────────────────────────────────────────────────
    STAGE_ENTRY:               "stage:entry",
    STAGE_HISTORY_FETCHED:     "stage:history_fetched",
    STAGE_AFFINITY_RESOLVED:   "stage:affinity_resolved",
    STAGE_CONTENT_SURFACED:    "stage:content_surfaced",
    STAGE_OFFER_PRESENTED:     "stage:offer_presented",
    STAGE_FOLLOW_UP:           "stage:follow_up",

    // ── Responses ─────────────────────────────────────────────────────────────
    RESPONSE_ENGAGED:          "response:engaged",
    RESPONSE_HESITANT:         "response:hesitant",
    RESPONSE_DISMISSED:        "response:dismissed",
    RESPONSE_NO_RESPONSE:      "response:no_response",

    // ── Offers ────────────────────────────────────────────────────────────────
    OFFER_UPGRADE_FULL:        "offer:upgrade_full",
    OFFER_TRIAL_EXTENDED:      "offer:trial_extended",
    OFFER_DISCOUNT:            "offer:discount",

    // ── Outcomes ──────────────────────────────────────────────────────────────
    OUTCOME_CONVERTED:         "outcome:converted",
    OUTCOME_DEFERRED:          "outcome:deferred",
    OUTCOME_DROPPED_OFF:       "outcome:dropped_off",
    OUTCOME_TRANSFERRED:       "outcome:transferred",
    OUTCOME_NO_MATCH:          "outcome:no_match",
} as const;

export type Tag = (typeof Tags)[keyof typeof Tags];

/**
 * Emit a structured conversation tag via Sierra's output system.
 * Tags surface in Explorer for querying conversion rates, drop-offs, and funnel analysis.
 */
export function emitTag(output: ReturnType<typeof useOutput>, tag: Tag): void {
    output.send({ type: "label", value: tag });
}
