#!/usr/bin/env node
// Generates data/users.csv from:
//   - 20 existing test users (hardcoded with exact entity IDs from synthetic-data.ts)
//   - Named SiriusXM employee profiles merged from 4 CSVs:
//       data/named_profile_users.csv
//       data/named_profile_team_hmf_for_you_recommendations.csv
//       data/named_profile_team_hmf_arstists_recommendations.csv
//       data/named_profile_team_recommendations.csv
// Usage: node generate-users-csv.mjs

import { readFileSync, writeFileSync } from "fs";
import { createHash } from "crypto";

// ── CSV helpers ───────────────────────────────────────────────────────────────

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

/** Deterministic UUID from MD5 of seed string */
function makeUUID(seed) {
    const h = createHash("md5").update(seed).digest("hex");
    return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`;
}

/** CSV-encode a single field (quote if it contains commas, quotes, or newlines) */
function csvCell(value) {
    const s = String(value ?? "");
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
        return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
}

// ── Existing 20 test users — source of truth is data/synthetic-data.ts ───────
// topArtists remain as names in Phase 1 (entity ID migration is Phase 6).
// topChannels are already entity IDs (unchanged from synthetic-data.ts).

const EXISTING_USERS = [
    { userId: "USR001", firstName: "Phone",    lastName: "Known",      email: "phone.known@test.com",       phone: "+15550010001", subscriptionTier: "trial",   trialEndDate: "2026-04-10", topChannels: ["194adbca-34d6-cb94-b153-3488ee563308", "6adef1b5-d812-9c10-7c6c-f05af4e27077", "89c9bcb8-704a-435e-a047-30840e7ee70d"], topArtists: ["Drake", "Doja Cat", "Future"] },
    { userId: "USR002", firstName: "Email",    lastName: "Only",       email: "email.only@test.com",        phone: "",             subscriptionTier: "trial",   trialEndDate: "2026-04-15", topChannels: ["687f841b-a76e-35ef-98de-022afe72566e", "176daca5-6810-3a1c-49e9-39b69055e811"], topArtists: ["Morgan Wallen", "Luke Combs", "Zach Bryan"] },
    { userId: "USR003", firstName: "Unknown",  lastName: "Caller",     email: "unknown.caller@test.com",    phone: "",             subscriptionTier: "select",  trialEndDate: "",           topChannels: ["fd5740ec-7f11-0ecf-f676-46f9dc056d2c", "634ea01e-4ae2-c7e8-7567-138965e8a6fe", "0fed9647-cc82-24d7-526d-98762e8a52cd"], topArtists: ["Foo Fighters", "Metallica", "Tool"] },
    { userId: "USR004", firstName: "Phone",    lastName: "Unknown",    email: "phone.unknown@test.com",     phone: "+15550010099", subscriptionTier: "premier", trialEndDate: "",           topChannels: ["5ad6890a-adaf-48bf-adbf-d0bf28def878", "43993462-1c73-efb8-29e5-0c4652cf8e4f", "3c7b2421-7ce4-0ecb-bc70-7f60f15d3d29"], topArtists: ["Howard Stern"] },
    { userId: "USR005", firstName: "Select",   lastName: "Subscriber", email: "select.subscriber@test.com", phone: "+15550010005", subscriptionTier: "select",  trialEndDate: "",           topChannels: ["194adbca-34d6-cb94-b153-3488ee563308", "5ad6890a-adaf-48bf-adbf-d0bf28def878", "44f9129f-579a-3d23-218f-3c3518036fc6"], topArtists: ["Taylor Swift", "Olivia Rodrigo"] },
    { userId: "USR006", firstName: "All",      lastName: "Access",     email: "all.access@test.com",        phone: "+15550010006", subscriptionTier: "trial",   trialEndDate: "2026-04-01", topChannels: ["a44e273d-a7e5-c358-a8ae-39dc91ca9c30", "e6333906-2e89-6c07-59d6-36d09248b8dc", "5ad8659a-414a-9e26-b973-f5a229d788dd"], topArtists: ["Miles Davis", "John Coltrane"] },
    { userId: "USR007", firstName: "Expired",  lastName: "Trialer",    email: "expired.trialer@test.com",   phone: "+15550010007", subscriptionTier: "expired", trialEndDate: "",           topChannels: ["6adef1b5-d812-9c10-7c6c-f05af4e27077", "89c9bcb8-704a-435e-a047-30840e7ee70d", "834383dd-9a7e-d59e-81a2-dd13e0377af2"], topArtists: ["Calvin Harris", "Diplo"] },
    { userId: "USR008", firstName: "Hip",      lastName: "Hop",        email: "hip.hop@test.com",           phone: "+15550010008", subscriptionTier: "trial",   trialEndDate: "2026-04-20", topChannels: ["194adbca-34d6-cb94-b153-3488ee563308", "6adef1b5-d812-9c10-7c6c-f05af4e27077", "bd54fc02-e063-0e3e-0cbb-4ceafef734e7"], topArtists: ["Drake", "Kendrick Lamar", "21 Savage"] },
    { userId: "USR009", firstName: "Talk",     lastName: "Radio",      email: "talk.radio@test.com",        phone: "+15550010009", subscriptionTier: "select",  trialEndDate: "",           topChannels: ["43993462-1c73-efb8-29e5-0c4652cf8e4f", "3c7b2421-7ce4-0ecb-bc70-7f60f15d3d29", "5f8894e9-d615-21d0-a114-ecd08e7fa75c", "6739babb-7975-e60e-1835-fbacd4bbd855"], topArtists: ["Rachel Maddow", "Sean Hannity"] },
    { userId: "USR010", firstName: "Country",  lastName: "Devotee",    email: "country.devotee@test.com",   phone: "+15550010010", subscriptionTier: "trial",   trialEndDate: "2026-04-08", topChannels: ["687f841b-a76e-35ef-98de-022afe72566e", "176daca5-6810-3a1c-49e9-39b69055e811", "ffd94bb6-5368-67ae-91be-5b2bababeca0"], topArtists: ["Morgan Wallen", "Luke Combs"] },
    { userId: "USR011", firstName: "Balanced", lastName: "Listener",   email: "balanced.listener@test.com", phone: "+15550010011", subscriptionTier: "premier", trialEndDate: "",           topChannels: ["194adbca-34d6-cb94-b153-3488ee563308", "687f841b-a76e-35ef-98de-022afe72566e", "e6333906-2e89-6c07-59d6-36d09248b8dc", "43993462-1c73-efb8-29e5-0c4652cf8e4f"], topArtists: ["Taylor Swift", "Morgan Wallen"] },
    { userId: "USR012", firstName: "Live",     lastName: "Event",      email: "live.event@test.com",        phone: "+15550010012", subscriptionTier: "trial",   trialEndDate: "2026-04-12", topChannels: ["194adbca-34d6-cb94-b153-3488ee563308", "6adef1b5-d812-9c10-7c6c-f05af4e27077"], topArtists: ["Kendrick Lamar"] },
    { userId: "USR013", firstName: "On",       lastName: "Demand",     email: "on.demand@test.com",         phone: "+15550010013", subscriptionTier: "trial",   trialEndDate: "2026-04-18", topChannels: ["6adef1b5-d812-9c10-7c6c-f05af4e27077", "834383dd-9a7e-d59e-81a2-dd13e0377af2"], topArtists: ["Calvin Harris"] },
    { userId: "USR014", firstName: "Both",     lastName: "Available",  email: "both.available@test.com",    phone: "+15550010014", subscriptionTier: "trial",   trialEndDate: "2026-04-05", topChannels: ["194adbca-34d6-cb94-b153-3488ee563308", "6adef1b5-d812-9c10-7c6c-f05af4e27077"], topArtists: ["Drake", "Future"] },
    { userId: "USR015", firstName: "No",       lastName: "Content",    email: "no.content@test.com",        phone: "+15550010015", subscriptionTier: "trial",   trialEndDate: "2026-04-22", topChannels: ["5ad8659a-414a-9e26-b973-f5a229d788dd", "e6333906-2e89-6c07-59d6-36d09248b8dc"], topArtists: ["Miles Davis"] },
    { userId: "USR016", firstName: "Trial",    lastName: "Ends",       email: "trial.ends@test.com",        phone: "+15550010016", subscriptionTier: "trial",   trialEndDate: "2026-03-28", topChannels: ["194adbca-34d6-cb94-b153-3488ee563308", "6adef1b5-d812-9c10-7c6c-f05af4e27077", "89c9bcb8-704a-435e-a047-30840e7ee70d"], topArtists: ["Drake", "Doja Cat"] },
    { userId: "USR017", firstName: "Budget",   lastName: "Conscious",  email: "budget.conscious@test.com",  phone: "+15550010017", subscriptionTier: "select",  trialEndDate: "",           topChannels: ["194adbca-34d6-cb94-b153-3488ee563308", "44f9129f-579a-3d23-218f-3c3518036fc6"], topArtists: ["Taylor Swift"] },
    { userId: "USR018", firstName: "Feature",  lastName: "Seeker",     email: "feature.seeker@test.com",    phone: "+15550010018", subscriptionTier: "select",  trialEndDate: "",           topChannels: ["5ad6890a-adaf-48bf-adbf-d0bf28def878", "a44e273d-a7e5-c358-a8ae-39dc91ca9c30"], topArtists: ["Howard Stern"] },
    { userId: "USR019", firstName: "Happy",    lastName: "Cancel",     email: "happy.cancel@test.com",      phone: "+15550010019", subscriptionTier: "trial",   trialEndDate: "2026-04-01", topChannels: ["194adbca-34d6-cb94-b153-3488ee563308"], topArtists: ["Taylor Swift"] },
    { userId: "USR020", firstName: "Select",   lastName: "Upgrade",    email: "select.upgrade@test.com",    phone: "+15550010020", subscriptionTier: "select",  trialEndDate: "",           topChannels: ["5ad6890a-adaf-48bf-adbf-d0bf28def878", "6adef1b5-d812-9c10-7c6c-f05af4e27077", "194adbca-34d6-cb94-b153-3488ee563308"], topArtists: ["Howard Stern", "Drake"] },
];

// ── Load named profile users (sorted by last_name, first_name) ────────────────
const namedProfileUsersCSV = readFileSync("data/named_profile_users.csv", "utf-8");
const namedProfileUsers = namedProfileUsersCSV
    .split("\n")
    .slice(1)
    .filter(l => l.trim())
    .map(l => {
        const [profile_id, first_name, last_name, email_address] = parseCSVLine(l);
        return { profile_id, first_name, last_name, email_address };
    })
    .filter(u => u.profile_id);

// ── Load for-you recommendations: profile_id → entity_id[] ───────────────────
const forYouRecs = new Map();
const forYouCSV = readFileSync("data/named_profile_team_hmf_for_you_recommendations.csv", "utf-8");
for (const line of forYouCSV.split("\n").slice(1)) {
    if (!line.trim()) continue;
    const fields = parseCSVLine(line);
    if (!fields[0]) continue;
    try {
        const items = JSON.parse(fields[1] || "[]");
        forYouRecs.set(fields[0], items.map(o => o.entity_id));
    } catch {
        forYouRecs.set(fields[0], []);
    }
}

// ── Load artist recommendations: profileId (camelCase) → entity_id[] ─────────
const artistRecs = new Map();
const artistCSV = readFileSync("data/named_profile_team_hmf_arstists_recommendations.csv", "utf-8");
const artistLines = artistCSV.split("\n").filter(l => l.trim());
const artistHeader = parseCSVLine(artistLines[0]);
const artistProfileIdCol = artistHeader.indexOf("profileId");
const artistArrayCol = artistHeader.indexOf("entity_id_array");
for (const line of artistLines.slice(1)) {
    const fields = parseCSVLine(line);
    const profileId = fields[artistProfileIdCol];
    if (!profileId) continue;
    try {
        const items = JSON.parse(fields[artistArrayCol] || "[]");
        artistRecs.set(profileId, items.map(o => o.entity_id));
    } catch {
        artistRecs.set(profileId, []);
    }
}

// ── Load team recommendations: profile_id → entity_id[] ──────────────────────
const teamRecs = new Map();
const teamCSV = readFileSync("data/named_profile_team_recommendations.csv", "utf-8");
const teamLines = teamCSV.split("\n").filter(l => l.trim());
const teamHeader = parseCSVLine(teamLines[0]);
const teamArrayCol = teamHeader.indexOf("teams_entity_id_array");
const teamProfileIdCol = teamHeader.indexOf("profile_id");
for (const line of teamLines.slice(1)) {
    const fields = parseCSVLine(line);
    const profileId = fields[teamProfileIdCol];
    if (!profileId) continue;
    try {
        const items = JSON.parse(fields[teamArrayCol] || "[]");
        teamRecs.set(profileId, items.map(o => o.entity_id));
    } catch {
        teamRecs.set(profileId, []);
    }
}

// ── Build output rows ─────────────────────────────────────────────────────────

const HEADER = "profile_id,first_name,last_name,email_address,phone,subscription_tier,trial_end_date,top_recommendation,top_artists,top_teams";
const rows = [HEADER];

// Existing test users (deterministic UUID from userId)
for (const u of EXISTING_USERS) {
    const profile_id = makeUUID(u.userId);
    rows.push([
        csvCell(profile_id),
        csvCell(u.firstName),
        csvCell(u.lastName),
        csvCell(u.email),
        csvCell(u.phone),
        csvCell(u.subscriptionTier),
        csvCell(u.trialEndDate),
        csvCell(JSON.stringify(u.topChannels)),
        csvCell(JSON.stringify(u.topArtists)),
        csvCell("[]"),
    ].join(","));
}

// Named profiles (phones assigned incrementally from +15550010100)
let phoneCounter = 15550010100;
for (const u of namedProfileUsers) {
    const phone = "+" + phoneCounter++;
    const topRec = JSON.stringify(forYouRecs.get(u.profile_id) ?? []);
    const topArtists = JSON.stringify(artistRecs.get(u.profile_id) ?? []);
    const topTeams = JSON.stringify(teamRecs.get(u.profile_id) ?? []);
    rows.push([
        csvCell(u.profile_id),
        csvCell(u.first_name),
        csvCell(u.last_name),
        csvCell(u.email_address),
        csvCell(phone),
        csvCell("premier"),
        csvCell(""),
        csvCell(topRec),
        csvCell(topArtists),
        csvCell(topTeams),
    ].join(","));
}

writeFileSync("data/users.csv", rows.join("\n") + "\n", "utf-8");
console.log(`Written ${rows.length - 1} users to data/users.csv (${EXISTING_USERS.length} test + ${namedProfileUsers.length} named)`);

// Log UUID mapping for existing users (useful for debugging)
console.log("\nExisting user UUID mapping:");
for (const u of EXISTING_USERS) {
    console.log(`  ${u.userId} → ${makeUUID(u.userId)}`);
}

// ── Emit users-data.ts (TypeScript, bundler-safe — no runtime fs reads) ───────
// Sierra bundles for a browser-like environment that can't resolve Node.js
// built-ins (fs/path) at runtime. Embedding the data at build time mirrors
// how sxm-catalog.ts works.

const esc = s => String(s ?? "").replace(/\\/g, "\\\\").replace(/"/g, '\\"');
const qArr = arr => "[" + arr.map(s => `"${esc(s)}"`).join(", ") + "]";

// Collect all user objects we built above
const allUsers = [];

// Re-parse users.csv to collect in canonical order
const csvContent = readFileSync("data/users.csv", "utf-8");
const csvLines = csvContent.split("\n").filter(l => l.trim()).slice(1);
for (const line of csvLines) {
    const [
        profile_id, first_name, last_name, email_address, phone,
        subscription_tier, trial_end_date,
        top_recommendation, top_artists, top_teams,
    ] = parseCSVLine(line);
    if (!profile_id) continue;
    let topChannels = [], topArtistsArr = [], topTeamsArr = [];
    try { topChannels   = JSON.parse(top_recommendation || "[]"); } catch { /* ok */ }
    try { topArtistsArr = JSON.parse(top_artists        || "[]"); } catch { /* ok */ }
    try { topTeamsArr   = JSON.parse(top_teams          || "[]"); } catch { /* ok */ }
    allUsers.push({ profile_id, first_name, last_name, email_address, phone, subscription_tier, trial_end_date, topChannels, topArtistsArr, topTeamsArr });
}

let ts = `// Copyright Sierra
// User profiles — generated from data/users.csv.
// Do not edit by hand — re-run generate-users-csv.mjs to regenerate.

import type { SubscriptionTier, UserProfileRecord } from "./synthetic-data";

export const GENERATED_USER_PROFILES: UserProfileRecord[] = [
`;

for (const u of allUsers) {
    ts += `    { userId: "${esc(u.profile_id)}", firstName: "${esc(u.first_name)}", lastName: "${esc(u.last_name)}", email: "${esc(u.email_address)}", phone: "${esc(u.phone)}", subscriptionTier: "${esc(u.subscription_tier)}" as SubscriptionTier, trialEndDate: ${u.trial_end_date ? `"${esc(u.trial_end_date)}"` : "undefined"}, topChannels: ${qArr(u.topChannels)}, topArtists: ${qArr(u.topArtistsArr)}, topTeams: ${qArr(u.topTeamsArr)} },\n`;
}

ts += `];\n`;

writeFileSync("data/users-data.ts", ts, "utf-8");
console.log(`\nWritten ${allUsers.length} users to data/users-data.ts`);
