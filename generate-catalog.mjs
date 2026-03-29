// Generator script — run once to produce data/sxm-catalog.ts
// Usage: node generate-catalog.mjs
// Note: channel_image_url in both CSVs are full CDN URLs — no conversion needed.

import { readFileSync, writeFileSync, statSync } from "fs";

function parseCSVLine(line) {
    const fields = [];
    let field = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (inQuotes) {
            if (ch === '"' && line[i + 1] === '"') { field += '"'; i++; }
            else if (ch === '"') { inQuotes = false; }
            else { field += ch; }
        } else if (ch === '"') { inQuotes = true; }
        else if (ch === ',') { fields.push(field); field = ""; }
        else { field += ch; }
    }
    fields.push(field);
    return fields;
}

// ── Parse genre landing reference ────────────────────────────────────────────
const genreCSV = readFileSync("data/sxm_channel_genre_landing_reference.csv", "utf-8");
const genreLines = genreCSV.split("\n").filter(l => l.trim());
const genreRows = genreLines.slice(1).map(parseCSVLine);

const genreIndex = {};   // lowercased genre name → [{entityId, score, genreName}]
const channelDetails = {}; // entityId → detail object

for (const row of genreRows) {
    if (row.length < 12) continue;
    const [entityId, entityType, name, number, superCat, category, , genreName, description, imageUrl, playerPage, scoreStr] = row;
    const score = parseFloat(scoreStr);
    if (!entityId || !name || !genreName || isNaN(score)) continue;

    if (!channelDetails[entityId]) {
        channelDetails[entityId] = { entityId, entityType, name, number, superCat: superCat || null, category: category || null, description, imageUrl, playerPage };
    }

    const key = genreName.toLowerCase();
    if (!genreIndex[key]) genreIndex[key] = [];
    genreIndex[key].push({ entityId, score, genreName });
}

for (const k of Object.keys(genreIndex)) {
    genreIndex[k].sort((a, b) => b.score - a.score);
}

// ── Parse genre select landing reference (genre entity IDs + landing pages) ──
const genreSelectCSV = readFileSync("data/sxm_genre_select_channel_landing_ref.csv", "utf-8");
const genreSelectLines = genreSelectCSV.split("\n").filter(l => l.trim());
const genreEntities = {}; // lowercased genre name → { entityId, name, landingPage }

for (const line of genreSelectLines.slice(1)) {
    const fields = parseCSVLine(line);
    if (fields.length < 3) continue;
    const [entityId, , name] = fields;
    if (!entityId || !name) continue;
    const landingPage = `https://www.siriusxm.com/player/genre/${encodeURIComponent(name)}/${entityId}`;
    genreEntities[name.toLowerCase()] = { entityId, name, landingPage };
}

// ── Parse talent reference ────────────────────────────────────────────────────
// Only include talents that have an image URL (i.e., have a dedicated player page)
const talentBySlug = {}; // slug → { entityId, name, imageUrl, playerLandingPage }

const talentCSV = readFileSync("data/sxm_talent_reference.csv", "utf-8").replace(/\r/g, "");
for (const line of talentCSV.split("\n").slice(1)) {
    const fields = parseCSVLine(line);
    if (fields.length < 5) continue;
    const [entityId, name, slug, imageUrl, playerLandingPage] = fields;
    if (!entityId || !slug || !imageUrl) continue; // skip entries with no image
    talentBySlug[slug] = { entityId, name, slug, imageUrl, playerLandingPage };
}

// ── Parse lineup bridge ───────────────────────────────────────────────────────
const LINEUP_IDS = [100, 200, 300, 320];
const lineupSets = {};
for (const id of LINEUP_IDS) lineupSets[id] = [];

const bridgeCSV = readFileSync("data/sxm_channel_lineup_bridge.csv", "utf-8");
for (const line of bridgeCSV.split("\n").slice(1)) {
    const comma = line.indexOf(",");
    if (comma < 0) continue;
    const entityId = line.slice(0, comma).trim();
    const lineupId = parseInt(line.slice(comma + 1).trim(), 10);
    if (LINEUP_IDS.includes(lineupId) && entityId) {
        lineupSets[lineupId].push(entityId);
    }
}

// ── Generate TypeScript ───────────────────────────────────────────────────────
const esc = s => (s ?? "").replace(/\\/g, "\\\\").replace(/"/g, '\\"');
const q = s => s == null ? "null" : `"${esc(s)}"`;

let ts = `// Copyright Sierra
// SXM channel catalog — genre index, lineup membership, talent reference, and search function.
// Generated from: sxm_channel_genre_landing_reference.csv + sxm_channel_lineup_bridge.csv + sxm_talent_reference.csv
// Do not edit by hand — re-run generate-catalog.mjs to regenerate.

import type { SubscriptionTier } from "./synthetic-data";

export type SxmChannelDetail = {
    entityId: string;
    entityType: string;
    name: string;
    number: string;
    superCategory: string | null;
    category: string | null;
    description: string;
    imageUrl: string;
    playerLandingPage: string;
};

export type ChannelGenreEntry = {
    channel: SxmChannelDetail;
    score: number;
    genreName: string;
};

export type GenreSearchResult = {
    channels: ChannelGenreEntry[];
    genreMatched: string | null;
    genreLandingPage: string | null;
};

export type GenreLandingEntry = {
    entityId: string;
    name: string;
    landingPage: string;
};

export type SxmTalentDetail = {
    entityId: string;
    name: string;
    slug: string;
    imageUrl: string;
    playerLandingPage: string;
};

// Maps subscription tier to channel_lineup_id from sxm_package_reference.csv
export const TIER_TO_LINEUP_ID: Record<SubscriptionTier, number | null> = {
    "trial":      100,  // Trial (100) — US sirius streaming
    "select":     200,  // Select (200) — US sirius satellite+streaming
    "premier":    300,  // Premier (300) — US sirius satellite+streaming
    "all-access": 320,  // Elite (320) — US sirius satellite+streaming
    "expired":    null, // No active subscription
};

// Channel details indexed by entity ID
const CHANNEL_DETAILS: Record<string, SxmChannelDetail> = {
`;

for (const [id, d] of Object.entries(channelDetails)) {
    ts += `    "${esc(id)}": { entityId: "${esc(d.entityId)}", entityType: "${esc(d.entityType)}", name: "${esc(d.name)}", number: "${esc(d.number)}", superCategory: ${q(d.superCat)}, category: ${q(d.category)}, description: "${esc(d.description)}", imageUrl: "${esc(d.imageUrl)}", playerLandingPage: "${esc(d.playerPage)}" },\n`;
}

ts += `};

// Genre landing pages indexed by lowercased genre name
const GENRE_LANDING_PAGES: Record<string, GenreLandingEntry> = {
`;

for (const [key, g] of Object.entries(genreEntities)) {
    ts += `    "${esc(key)}": { entityId: "${esc(g.entityId)}", name: "${esc(g.name)}", landingPage: "${esc(g.landingPage)}" },\n`;
}

ts += `};

// Talent reference indexed by slug — only entries with a resolved image URL
const TALENT_BY_SLUG: Record<string, SxmTalentDetail> = {
`;

for (const [slug, t] of Object.entries(talentBySlug)) {
    ts += `    "${esc(slug)}": { entityId: "${esc(t.entityId)}", name: "${esc(t.name)}", slug: "${esc(t.slug)}", imageUrl: "${esc(t.imageUrl)}", playerLandingPage: "${esc(t.playerLandingPage)}" },\n`;
}

ts += `};

/** Look up a talent by their URL slug (e.g. "rachel-maddow"). Returns null if not found or no image. */
export function getTalentBySlug(slug: string): SxmTalentDetail | null {
    return TALENT_BY_SLUG[slug] ?? null;
}

// Genre index: lowercased genre name → sorted channel entries (score desc)
const GENRE_RAW: Record<string, Array<{entityId: string; score: number; genreName: string}>> = {
`;

for (const [key, entries] of Object.entries(genreIndex)) {
    const entriesJson = entries.map(e => `{entityId:"${esc(e.entityId)}",score:${e.score},genreName:"${esc(e.genreName)}"}`).join(",");
    ts += `    "${esc(key)}": [${entriesJson}],\n`;
}

ts += `};

`;

// Lineup sets — write as arrays chunked for readability
for (const id of LINEUP_IDS) {
    const ids = lineupSets[id];
    ts += `// Lineup ${id} — ${ids.length} channels\n`;
    ts += `const LINEUP_${id} = new Set<string>([\n`;
    for (let i = 0; i < ids.length; i += 6) {
        ts += `    "${ids.slice(i, i + 6).join('","')}",\n`;
    }
    ts += `]);\n\n`;
}

ts += `const LINEUP_MAP: Map<number, Set<string>> = new Map([
${LINEUP_IDS.map(id => `    [${id}, LINEUP_${id}],`).join("\n")}
]);

// Materialized genre index with full channel details
const GENRE_INDEX: Map<string, ChannelGenreEntry[]> = new Map(
    Object.entries(GENRE_RAW).map(([key, entries]) => [
        key,
        entries
            .map(e => ({ channel: CHANNEL_DETAILS[e.entityId]!, score: e.score, genreName: e.genreName }))
            .filter(e => e.channel != null),
    ])
);

const CONFIDENCE_THRESHOLD = 0.5;

export function searchChannelsByGenre(
    genreQuery: string,
    options?: { lineupId?: number | null; scoreThreshold?: number }
): GenreSearchResult {
    const threshold = options?.scoreThreshold ?? CONFIDENCE_THRESHOLD;
    const query = genreQuery.toLowerCase().trim();

    // 1. Exact match, then substring match
    let matched = GENRE_INDEX.get(query) ?? null;
    let matchedGenreName: string | null = matched?.[0]?.genreName ?? null;

    if (!matched) {
        for (const [key, entries] of GENRE_INDEX) {
            if (key.includes(query) || query.includes(key)) {
                matched = entries;
                matchedGenreName = entries[0]?.genreName ?? null;
                break;
            }
        }
    }

    if (!matched || matched.length === 0) return { channels: [], genreMatched: null, genreLandingPage: null };

    // 2. Confidence gate
    let results = matched.filter(e => e.score >= threshold);

    // 3. Entitlement filter
    const lineupId = options?.lineupId;
    if (lineupId !== undefined) {
        if (lineupId === null) {
            results = []; // expired subscription — no channel access
        } else {
            const allowed = LINEUP_MAP.get(lineupId);
            results = allowed ? results.filter(e => allowed.has(e.channel.entityId)) : [];
        }
    }

    // 4. Genre landing page
    const genreKey = matchedGenreName?.toLowerCase() ?? query;
    const genreLandingPage = GENRE_LANDING_PAGES[genreKey]?.landingPage ?? null;

    return { channels: results, genreMatched: matchedGenreName, genreLandingPage };
}

/** Returns all known genre names — used to suggest alternatives when a query does not match. */
export function getAllGenreNames(): string[] {
    return Array.from(GENRE_INDEX.keys())
        .map(k => GENRE_INDEX.get(k)?.[0]?.genreName ?? k)
        .sort();
}
`;

writeFileSync("data/sxm-catalog.ts", ts);
console.log("Generated data/sxm-catalog.ts —", statSync("data/sxm-catalog.ts").size, "bytes");
console.log("Genres:", Object.keys(genreIndex).length);
console.log("Channels:", Object.keys(channelDetails).length);
for (const id of LINEUP_IDS) console.log(`Lineup ${id}:`, lineupSets[id].length, "channels");
