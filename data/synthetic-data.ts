// Copyright Sierra
// Synthetic in-memory data module — sourced from the CSV files in this directory.
// Tools import from here instead of calling an external API, making the mock
// self-contained and runnable without a live backend.
//
// Source CSVs (single source of truth):
//   data/users.csv              emailAddress → listenerID / profileID / segment
//   data/affinity.csv           profileID → artist affinities + confidence scores
//   data/listening-history.csv  profileID → recent listen history
//   data/favorites.csv          profileID → saved favorites
//   data/content-catalog.csv    contentID → title / artistHost / channel / airTime / link

// ── Types ──────────────────────────────────────────────────────────────────────

export type UserRecord = {
    emailAddress: string;
    listenerID: string;
    profileID: string;
    segment: "trialer" | "self-pay" | "winback" | "upsell";
    firstName: string;
    lastName: string;
};

export type AffinityRecord = {
    profileID: string;
    rank: number;
    artistName: string;
    contentType: "music" | "podcast" | "sports" | "channel";
    affinityScore: number;
    confidence: number;
};

export type ListeningHistoryRecord = {
    profileID: string;
    contentID: string;
    title: string;
    artistHost: string;
    contentType: string;
    listenDurationSeconds: number;
    lastListened: string;
};

export type FavoriteRecord = {
    profileID: string;
    contentID: string;
    title: string;
    contentType: string;
    favoritedAt: string;
};

export type ContentCatalogItem = {
    contentID: string;
    title: string;
    artistHost: string;
    contentType: "music" | "podcast" | "sports" | "channel";
    channel: string;
    channelNumber: string;
    airTime: string;
    imageUrl: string;
    link: string;
};

// ── Users ─────────────────────────────────────────────────────────────────────
// Source: data/users.csv

export const USERS: UserRecord[] = [
    {
        emailAddress: "sarah.mitchell@sxm-test.com",
        listenerID: "LID001",
        profileID: "PID001",
        segment: "trialer",
        firstName: "Sarah",
        lastName: "Mitchell",
    },
    {
        emailAddress: "marcus.johnson@sxm-test.com",
        listenerID: "LID002",
        profileID: "PID002",
        segment: "trialer",
        firstName: "Marcus",
        lastName: "Johnson",
    },
    {
        emailAddress: "priya.patel@sxm-test.com",
        listenerID: "LID003",
        profileID: "PID003",
        segment: "trialer",
        firstName: "Priya",
        lastName: "Patel",
    },
    {
        emailAddress: "carlos.rivera@sxm-test.com",
        listenerID: "LID004",
        profileID: "PID004",
        segment: "trialer",
        firstName: "Carlos",
        lastName: "Rivera",
    },
    {
        emailAddress: "alex.kim@sxm-test.com",
        listenerID: "LID005",
        profileID: "PID005",
        segment: "trialer",
        firstName: "Alex",
        lastName: "Kim",
    },
];

// ── Affinity ──────────────────────────────────────────────────────────────────
// Source: data/affinity.csv
// PID001 (Sarah)  — Styx / music            — confidence 0.97 (high)
// PID002 (Marcus) — Mad Dog Sports Radio     — confidence 0.96 (high)
// PID003 (Priya)  — John Mayer / music       — confidence 0.96 (high)
// PID004 (Carlos) — Megadeth / music         — confidence 0.98 (high)
// PID005 (Alex)   — Indie Rock / channel     — confidence 0.48 (low → triggers extension)

export const AFFINITY: AffinityRecord[] = [
    { profileID: "PID001", rank: 1, artistName: "Styx",               contentType: "music",   affinityScore: 0.97, confidence: 0.97 },
    { profileID: "PID001", rank: 2, artistName: "Classic Rewind",     contentType: "channel", affinityScore: 0.85, confidence: 0.85 },
    { profileID: "PID001", rank: 3, artistName: "Led Zeppelin",       contentType: "music",   affinityScore: 0.72, confidence: 0.72 },
    { profileID: "PID002", rank: 1, artistName: "Mad Dog Sports Radio", contentType: "sports", affinityScore: 0.96, confidence: 0.96 },
    { profileID: "PID002", rank: 2, artistName: "NFL Radio",          contentType: "sports",  affinityScore: 0.88, confidence: 0.88 },
    { profileID: "PID002", rank: 3, artistName: "Howard Stern",       contentType: "podcast", affinityScore: 0.74, confidence: 0.74 },
    { profileID: "PID003", rank: 1, artistName: "John Mayer",         contentType: "music",   affinityScore: 0.96, confidence: 0.96 },
    { profileID: "PID003", rank: 2, artistName: "Harry Styles",       contentType: "music",   affinityScore: 0.91, confidence: 0.91 },
    { profileID: "PID003", rank: 3, artistName: "Pop Hits",           contentType: "channel", affinityScore: 0.82, confidence: 0.82 },
    { profileID: "PID004", rank: 1, artistName: "Megadeth",           contentType: "music",   affinityScore: 0.98, confidence: 0.98 },
    { profileID: "PID004", rank: 2, artistName: "Liquid Metal",       contentType: "channel", affinityScore: 0.93, confidence: 0.93 },
    { profileID: "PID004", rank: 3, artistName: "Metallica",          contentType: "music",   affinityScore: 0.86, confidence: 0.86 },
    { profileID: "PID005", rank: 1, artistName: "Indie Rock",         contentType: "channel", affinityScore: 0.48, confidence: 0.48 },
    { profileID: "PID005", rank: 2, artistName: "Pop Hits",           contentType: "channel", affinityScore: 0.42, confidence: 0.42 },
    { profileID: "PID005", rank: 3, artistName: "Talk Radio",         contentType: "podcast", affinityScore: 0.38, confidence: 0.38 },
];

// ── Listening History ─────────────────────────────────────────────────────────
// Source: data/listening-history.csv

export const LISTENING_HISTORY: ListeningHistoryRecord[] = [
    { profileID: "PID001", contentID: "CNT001", title: "Styx Exclusive Interview",                      artistHost: "Styx",                        contentType: "music",   listenDurationSeconds: 2847, lastListened: "2026-03-20T18:32:00Z" },
    { profileID: "PID001", contentID: "CNT010", title: "Classic Rock Rewind",                           artistHost: "Various Artists",             contentType: "channel", listenDurationSeconds: 5400, lastListened: "2026-03-22T09:15:00Z" },
    { profileID: "PID001", contentID: "CNT008", title: "Metallica Radio",                               artistHost: "Metallica",                   contentType: "music",   listenDurationSeconds: 1200, lastListened: "2026-03-18T21:00:00Z" },
    { profileID: "PID001", contentID: "CNT009", title: "Pop Hits Weekly",                               artistHost: "Various Artists",             contentType: "music",   listenDurationSeconds: 600,  lastListened: "2026-03-15T19:45:00Z" },
    { profileID: "PID002", contentID: "CNT005", title: "Mad Dog Sports Radio",                          artistHost: "Chris Mad Dog Russo",         contentType: "sports",  listenDurationSeconds: 7200, lastListened: "2026-03-24T14:00:00Z" },
    { profileID: "PID002", contentID: "CNT006", title: "NFL Radio Live",                                artistHost: "Various Hosts",               contentType: "sports",  listenDurationSeconds: 5400, lastListened: "2026-03-23T16:30:00Z" },
    { profileID: "PID002", contentID: "CNT007", title: "Howard Stern Show",                             artistHost: "Howard Stern",                contentType: "podcast", listenDurationSeconds: 3600, lastListened: "2026-03-21T08:00:00Z" },
    { profileID: "PID002", contentID: "CNT005", title: "Mad Dog Sports Radio",                          artistHost: "Chris Mad Dog Russo",         contentType: "sports",  listenDurationSeconds: 6800, lastListened: "2026-03-19T13:00:00Z" },
    { profileID: "PID003", contentID: "CNT004", title: "John Mayer & Harry Styles Joint Interview",     artistHost: "John Mayer & Harry Styles",   contentType: "music",   listenDurationSeconds: 3200, lastListened: "2026-03-23T20:00:00Z" },
    { profileID: "PID003", contentID: "CNT009", title: "Pop Hits Weekly",                               artistHost: "Various Artists",             contentType: "channel", listenDurationSeconds: 4800, lastListened: "2026-03-22T17:00:00Z" },
    { profileID: "PID003", contentID: "CNT004", title: "John Mayer & Harry Styles Joint Interview",     artistHost: "John Mayer & Harry Styles",   contentType: "music",   listenDurationSeconds: 1800, lastListened: "2026-03-20T15:30:00Z" },
    { profileID: "PID004", contentID: "CNT002", title: "Megadeth Exclusive Interview",                  artistHost: "Megadeth",                    contentType: "music",   listenDurationSeconds: 4200, lastListened: "2026-03-24T22:00:00Z" },
    { profileID: "PID004", contentID: "CNT008", title: "Metallica Radio",                               artistHost: "Metallica",                   contentType: "music",   listenDurationSeconds: 6600, lastListened: "2026-03-23T21:00:00Z" },
    { profileID: "PID004", contentID: "CNT002", title: "Megadeth Exclusive Interview",                  artistHost: "Megadeth",                    contentType: "music",   listenDurationSeconds: 3800, lastListened: "2026-03-21T19:00:00Z" },
    { profileID: "PID005", contentID: "CNT009", title: "Pop Hits Weekly",                               artistHost: "Various Artists",             contentType: "channel", listenDurationSeconds: 900,  lastListened: "2026-03-22T11:00:00Z" },
    { profileID: "PID005", contentID: "CNT010", title: "Classic Rock Rewind",                           artistHost: "Various Artists",             contentType: "channel", listenDurationSeconds: 720,  lastListened: "2026-03-20T10:00:00Z" },
];

// ── Favorites ─────────────────────────────────────────────────────────────────
// Source: data/favorites.csv

export const FAVORITES: FavoriteRecord[] = [
    { profileID: "PID001", contentID: "CNT001", title: "Styx Exclusive Interview",                   contentType: "music",   favoritedAt: "2026-03-20T18:45:00Z" },
    { profileID: "PID001", contentID: "CNT010", title: "Classic Rock Rewind",                        contentType: "channel", favoritedAt: "2026-03-22T09:30:00Z" },
    { profileID: "PID002", contentID: "CNT005", title: "Mad Dog Sports Radio",                       contentType: "sports",  favoritedAt: "2026-03-24T14:30:00Z" },
    { profileID: "PID002", contentID: "CNT006", title: "NFL Radio Live",                             contentType: "sports",  favoritedAt: "2026-03-23T17:00:00Z" },
    { profileID: "PID002", contentID: "CNT007", title: "Howard Stern Show",                          contentType: "podcast", favoritedAt: "2026-03-21T08:45:00Z" },
    { profileID: "PID003", contentID: "CNT004", title: "John Mayer & Harry Styles Joint Interview",  contentType: "music",   favoritedAt: "2026-03-23T20:20:00Z" },
    { profileID: "PID003", contentID: "CNT009", title: "Pop Hits Weekly",                            contentType: "channel", favoritedAt: "2026-03-22T17:30:00Z" },
    { profileID: "PID004", contentID: "CNT002", title: "Megadeth Exclusive Interview",               contentType: "music",   favoritedAt: "2026-03-24T22:15:00Z" },
    { profileID: "PID004", contentID: "CNT008", title: "Metallica Radio",                            contentType: "music",   favoritedAt: "2026-03-23T21:30:00Z" },
];

// ── Content Catalog ───────────────────────────────────────────────────────────
// Source: data/content-catalog.csv

export const CONTENT_CATALOG: ContentCatalogItem[] = [
    { contentID: "CNT001", title: "Styx Exclusive Interview",                   artistHost: "Styx",                      contentType: "music",   channel: "Faction Talk",         channelNumber: "103", airTime: "2026-03-27T17:00:00Z",  imageUrl: "https://img.siriusxm.com/content/styx-interview.jpg",          link: "https://www.siriusxm.com/content/styx-exclusive-interview" },
    { contentID: "CNT002", title: "Megadeth Exclusive Interview",               artistHost: "Megadeth",                  contentType: "music",   channel: "Liquid Metal",         channelNumber: "40",  airTime: "2026-03-27T20:00:00Z",  imageUrl: "https://img.siriusxm.com/content/megadeth-interview.jpg",      link: "https://www.siriusxm.com/content/megadeth-exclusive-interview" },
    { contentID: "CNT003", title: "Bono Live Special Re-air",                   artistHost: "Bono",                      contentType: "music",   channel: "U2-X Radio",           channelNumber: "32",  airTime: "2026-04-15T21:00:00Z",  imageUrl: "https://img.siriusxm.com/content/bono-live.jpg",               link: "https://www.siriusxm.com/content/bono-live-special" },
    { contentID: "CNT004", title: "John Mayer & Harry Styles Joint Interview",  artistHost: "John Mayer & Harry Styles", contentType: "music",   channel: "Hits",                 channelNumber: "1",   airTime: "2026-04-20T19:00:00Z",  imageUrl: "https://img.siriusxm.com/content/mayer-styles-interview.jpg",  link: "https://www.siriusxm.com/content/john-mayer-harry-styles" },
    { contentID: "CNT005", title: "Mad Dog Sports Radio",                       artistHost: "Chris Mad Dog Russo",       contentType: "sports",  channel: "Mad Dog Sports Radio", channelNumber: "82",  airTime: "Daily 6:00 AM - 10:00 AM ET", imageUrl: "https://img.siriusxm.com/content/mad-dog-sports.jpg",       link: "https://www.siriusxm.com/content/mad-dog-sports-radio" },
    { contentID: "CNT006", title: "NFL Radio Live",                             artistHost: "Various Hosts",             contentType: "sports",  channel: "NFL Radio",            channelNumber: "88",  airTime: "Daily 8:00 AM - 8:00 PM ET",  imageUrl: "https://img.siriusxm.com/content/nfl-radio.jpg",            link: "https://www.siriusxm.com/content/nfl-radio-live" },
    { contentID: "CNT007", title: "Howard Stern Show",                          artistHost: "Howard Stern",              contentType: "podcast", channel: "Howard 100",           channelNumber: "100", airTime: "Mon-Wed 7:00 AM ET",    imageUrl: "https://img.siriusxm.com/content/howard-stern.jpg",            link: "https://www.siriusxm.com/content/howard-stern-show" },
    { contentID: "CNT008", title: "Metallica Radio",                            artistHost: "Metallica",                 contentType: "music",   channel: "Liquid Metal",         channelNumber: "40",  airTime: "Weekends 8:00 PM ET",   imageUrl: "https://img.siriusxm.com/content/metallica-radio.jpg",         link: "https://www.siriusxm.com/content/metallica-radio" },
    { contentID: "CNT009", title: "Pop Hits Weekly",                            artistHost: "Various Artists",           contentType: "music",   channel: "Hits",                 channelNumber: "1",   airTime: "Fridays 8:00 PM ET",    imageUrl: "https://img.siriusxm.com/content/pop-hits.jpg",                link: "https://www.siriusxm.com/content/pop-hits-weekly" },
    { contentID: "CNT010", title: "Classic Rock Rewind",                        artistHost: "Various Artists",           contentType: "music",   channel: "Classic Rewind",       channelNumber: "25",  airTime: "Daily 9:00 AM ET",      imageUrl: "https://img.siriusxm.com/content/classic-rock-rewind.jpg",     link: "https://www.siriusxm.com/content/classic-rock-rewind" },
];

// ── Query helpers ─────────────────────────────────────────────────────────────

export function getUserByEmail(email: string): UserRecord | undefined {
    return USERS.find(u => u.emailAddress.toLowerCase() === email.toLowerCase());
}

export function getAffinityByProfile(profileID: string): AffinityRecord[] {
    return AFFINITY.filter(a => a.profileID === profileID).sort((a, b) => a.rank - b.rank);
}

export function getListeningHistoryByProfile(profileID: string, limit = 10): ListeningHistoryRecord[] {
    return LISTENING_HISTORY
        .filter(h => h.profileID === profileID)
        .sort((a, b) => new Date(b.lastListened).getTime() - new Date(a.lastListened).getTime())
        .slice(0, limit);
}

export function getFavoritesByProfile(profileID: string): FavoriteRecord[] {
    return FAVORITES.filter(f => f.profileID === profileID);
}

export function searchContentCatalog(artistName: string, contentType?: string): ContentCatalogItem[] {
    const artistLower = artistName.toLowerCase();
    return CONTENT_CATALOG.filter(c => {
        const artistMatch = c.artistHost.toLowerCase().includes(artistLower) ||
                            c.title.toLowerCase().includes(artistLower);
        const typeMatch = contentType ? c.contentType === contentType : true;
        return artistMatch && typeMatch;
    });
}

// ── Personalized recommendations ──────────────────────────────────────────────

export type PersonalizedRecommendation = {
    contentItem: ContentCatalogItem;
    matchedOn: {
        artistName: string;
        contentType: string;
        confidence: number;
        matchType: "artist" | "content_type";
    };
};

/**
 * Core memory function for the TrialerConversion journey.
 * Takes a profileID, loads all their ranked affinities, then finds matching
 * content from the catalog in two passes:
 *   1. Artist/talent match  — exact artist name match (full confidence)
 *   2. Content-type match   — same category (sports/music/podcast/channel),
 *                             scored at 80% of the affinity confidence
 * Returns deduplicated results ranked highest confidence first.
 */
export function getPersonalizedRecommendations(profileID: string): PersonalizedRecommendation[] {
    const affinities = getAffinityByProfile(profileID);
    const seen = new Set<string>();
    const results: PersonalizedRecommendation[] = [];

    for (const affinity of affinities) {
        // Pass 1 — artist/talent-specific match
        for (const item of CONTENT_CATALOG) {
            if (seen.has(item.contentID)) continue;
            const artistMatch =
                item.artistHost.toLowerCase().includes(affinity.artistName.toLowerCase()) ||
                item.title.toLowerCase().includes(affinity.artistName.toLowerCase());
            if (artistMatch) {
                seen.add(item.contentID);
                results.push({
                    contentItem: item,
                    matchedOn: {
                        artistName: affinity.artistName,
                        contentType: affinity.contentType,
                        confidence: affinity.confidence,
                        matchType: "artist",
                    },
                });
            }
        }

        // Pass 2 — content-type category match (lower weight)
        for (const item of CONTENT_CATALOG) {
            if (seen.has(item.contentID)) continue;
            if (item.contentType === affinity.contentType) {
                seen.add(item.contentID);
                results.push({
                    contentItem: item,
                    matchedOn: {
                        artistName: affinity.artistName,
                        contentType: affinity.contentType,
                        confidence: affinity.confidence * 0.8,
                        matchType: "content_type",
                    },
                });
            }
        }
    }

    return results.sort((a, b) => b.matchedOn.confidence - a.matchedOn.confidence);
}
