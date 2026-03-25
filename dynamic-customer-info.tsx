// Copyright Sierra

import { PromptContext, jsx, useRootStore } from "@sierra/agent";
import { getUserByEmail, getAffinityByProfile, getPersonalizedRecommendations } from "./data/synthetic-data";

// ── Existing customer info ─────────────────────────────────────────────────────
// This won't work yet until you add the customer info to the root store.
// We'll be showing you how to do that during the workshop.
export function DynamicCustomerInfo() {
    const [rootStore, _] = useRootStore();
    const customer = rootStore["customer"] as
        | {
              first_name: string;
              last_name: string;
              email: string;
              phone: string;
          }
        | undefined;
    if (!customer) {
        return null;
    }
    const namePrompt =
        customer.first_name && customer.last_name
            ? `The customer's name is ${customer.first_name} ${customer.last_name}.`
            : "";
    const emailPrompt = `The customer's email is ${customer.email}.`;
    const phonePrompt = `The customer's phone number is ${customer.phone}.`;

    return (
        <PromptContext
            heading="Caller Information"
            content={`${namePrompt} ${emailPrompt} ${phonePrompt}`}
        />
    );
}

// ── Trialer Affinity Memory ────────────────────────────────────────────────────
// Resolves email → profileID → full ranked affinity list + personalized content
// recommendations and holds them in PromptContext for the entire conversation.
//
// This is the memory layer for the TrialerConversion journey. Every Goal and
// Rule has persistent access to:
//   • All ranked affinities (artist + content-type, with confidence scores)
//   • Pre-matched content catalog items for each affinity
//   • A clear instruction on which pitch strategy to use per confidence tier
//
// Populated when rootStore["customer_email"] is set pre-conversation.
// For mid-conversation email collection, ResolveTrialerProfile + GetPersonalizedRecommendations
// tools serve the same data via LLM context.
export function TrialerCustomerInfo() {
    const [rootStore] = useRootStore();

    const email = rootStore["customer_email"] as string | undefined;
    if (!email) return null;

    const user = getUserByEmail(email);
    if (!user) return null;

    const affinities = getAffinityByProfile(user.profileID);
    const recommendations = getPersonalizedRecommendations(user.profileID);

    if (affinities.length === 0) return null;

    const top = affinities[0];
    const isTrialer = user.segment === "trialer";

    // ── Identity block ─────────────────────────────────────────────────────────
    const identityBlock = [
        `Customer: ${user.firstName} ${user.lastName} (${user.segment})`,
        `Profile ID: ${user.profileID} | Listener ID: ${user.listenerID}`,
        `Email: ${user.emailAddress}`,
    ].join("\n");

    // ── Affinity block — all ranked affinities ─────────────────────────────────
    const affinityBlock = affinities.map((a, i) =>
        `  ${i + 1}. "${a.artistName}" — ${a.contentType} — confidence ${(a.confidence * 100).toFixed(0)}%`
    ).join("\n");

    // ── Strategy block — how to pitch based on top confidence ─────────────────
    const strategyBlock = !isTrialer
        ? "NOT A TRIALER — do not run the TrialerConversion journey."
        : top.confidence >= 0.95
          ? `HIGH CONFIDENCE (${(top.confidence * 100).toFixed(0)}%): Lead with "${top.artistName}" content. Present full upgrade offer after engagement.`
          : top.confidence >= 0.7
            ? `MEDIUM CONFIDENCE (${(top.confidence * 100).toFixed(0)}%): Surface "${top.artistName}" content, gauge interest before pitching upgrade.`
            : `LOW CONFIDENCE (${(top.confidence * 100).toFixed(0)}%): No strong artist match. Do NOT pitch upgrade — offer a trial extension instead.`;

    // ── Recommendations block — pre-matched catalog content ───────────────────
    const artistMatches = recommendations
        .filter(r => r.matchedOn.matchType === "artist")
        .slice(0, 3)
        .map(r =>
            `  • [${r.matchedOn.matchType.toUpperCase()}] "${r.contentItem.title}" — ${r.contentItem.channel} Ch.${r.contentItem.channelNumber} — ${r.contentItem.airTime} — ${r.contentItem.link}`
        ).join("\n");

    const categoryMatches = recommendations
        .filter(r => r.matchedOn.matchType === "content_type")
        .slice(0, 3)
        .map(r =>
            `  • [${r.matchedOn.contentType.toUpperCase()}] "${r.contentItem.title}" — ${r.contentItem.channel} Ch.${r.contentItem.channelNumber} — ${r.contentItem.airTime}`
        ).join("\n");

    const content = [
        "=== TRIALER AFFINITY MEMORY ===",
        "",
        "IDENTITY:",
        identityBlock,
        "",
        "RANKED AFFINITIES (from affinity.csv):",
        affinityBlock,
        "",
        "PITCH STRATEGY:",
        strategyBlock,
        "",
        "ARTIST/TALENT MATCHES (use these first):",
        artistMatches || "  None found in catalog",
        "",
        "CONTENT CATEGORY MATCHES (use as fallback):",
        categoryMatches || "  None found in catalog",
        "",
        "INSTRUCTIONS:",
        "- Reference specific content titles, channels, and air times when surfacing moments.",
        "- Use artist matches before category matches — they are higher confidence.",
        "- Always lead with content before mentioning subscription.",
        "- Keep affinity context in mind for every turn of the conversation.",
    ].join("\n");

    return <PromptContext heading="Trialer Affinity Memory" content={content} />;
}
