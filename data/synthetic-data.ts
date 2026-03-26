// Copyright Sierra
// Synthetic data layer — in-memory arrays backed by CSV files.
// All tools query these helpers instead of hitting live APIs.

export type SubscriptionTier = "trial" | "select" | "premier" | "all-access" | "expired";

export type UserProfileRecord = {
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string; // E.164 format, empty string if unknown
    subscriptionTier: SubscriptionTier;
    trialEndDate?: string; // ISO date string, present when tier = "trial"
    topChannels: string[]; // channel_key values from channel-catalog.csv
    topArtists: string[];
};

export type EventRecord = {
    eventId: string;
    date: string; // ISO date string
    artistGuest: string;
    eventType: "interview" | "performance" | "interview+performance" | "audience_event" | "front_row" | "event";
    category: string;
    location: string;
    channels: string[]; // channel display names
    startTime: string;
    endTime: string;
};

export type ChannelRecord = {
    channelKey: string;
    channelName: string;
    channelNumber: string;
    superCategory: string;
    genre: string;
    description: string;
    packages: string; // "All" | "Select+" | "Premier+"
    imageUrl?: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// Channel alias map: abbreviated CSV key → display name used in events
// ─────────────────────────────────────────────────────────────────────────────
const CHANNEL_ALIAS: Record<string, string> = {
    Hits1: "SiriusXM Hits 1",
    BPM: "BPM",
    Diplo: "Diplo's Revolution",
    CountryRoads: "Country Roads",
    OutlawCountry: "Outlaw Country",
    TheHighway: "The Highway",
    AltNation: "Alt Nation",
    LiquidMetal: "Liquid Metal",
    Octane: "Octane",
    HowardStern: "Howard Stern",
    SiriusXMPatriot: "SiriusXM Patriot",
    POTUS: "P.O.T.U.S.",
    CNN: "CNN",
    FoxNews: "Fox News",
    Jazz: "Real Jazz",
    ClassicVinyl: "Classic Vinyl",
    Premier1: "SiriusXM Premier",
    PopRocks: "Pop Rocks",
    Venus: "Venus",
    HipHopNation: "Hip-Hop Nation",
    Chill: "Chill",
    RapCaviar: "Hip-Hop Nation",
};

function resolveChannelName(key: string): string {
    return CHANNEL_ALIAS[key] ?? key;
}

// ─────────────────────────────────────────────────────────────────────────────
// User Profiles
// ─────────────────────────────────────────────────────────────────────────────
export const USER_PROFILES: UserProfileRecord[] = [
    {
        userId: "USR001",
        firstName: "Phone",
        lastName: "Known",
        email: "phone.known@test.com",
        phone: "+15550010001",
        subscriptionTier: "trial",
        trialEndDate: "2026-04-10",
        topChannels: ["Hits1", "BPM", "Diplo"],
        topArtists: ["Drake", "Doja Cat", "Future"],
    },
    {
        userId: "USR002",
        firstName: "Email",
        lastName: "Only",
        email: "email.only@test.com",
        phone: "",
        subscriptionTier: "trial",
        trialEndDate: "2026-04-15",
        topChannels: ["CountryRoads", "OutlawCountry"],
        topArtists: ["Morgan Wallen", "Luke Combs", "Zach Bryan"],
    },
    {
        userId: "USR003",
        firstName: "Unknown",
        lastName: "Caller",
        email: "unknown.caller@test.com",
        phone: "",
        subscriptionTier: "select",
        topChannels: ["AltNation", "LiquidMetal", "Octane"],
        topArtists: ["Foo Fighters", "Metallica", "Tool"],
    },
    {
        userId: "USR004",
        firstName: "Phone",
        lastName: "Unknown",
        email: "phone.unknown@test.com",
        phone: "+15550010099",
        subscriptionTier: "premier",
        topChannels: ["HowardStern", "POTUS", "CNN"],
        topArtists: ["Howard Stern"],
    },
    {
        userId: "USR005",
        firstName: "Select",
        lastName: "Subscriber",
        email: "select.subscriber@test.com",
        phone: "+15550010005",
        subscriptionTier: "select",
        topChannels: ["Hits1", "HowardStern", "PopRocks"],
        topArtists: ["Taylor Swift", "Olivia Rodrigo"],
    },
    {
        userId: "USR006",
        firstName: "All",
        lastName: "Access",
        email: "all.access@test.com",
        phone: "+15550010006",
        subscriptionTier: "trial",
        trialEndDate: "2026-04-01",
        topChannels: ["Premier1", "Jazz", "ClassicVinyl"],
        topArtists: ["Miles Davis", "John Coltrane"],
    },
    {
        userId: "USR007",
        firstName: "Expired",
        lastName: "Trialer",
        email: "expired.trialer@test.com",
        phone: "+15550010007",
        subscriptionTier: "expired",
        topChannels: ["BPM", "Diplo", "Chill"],
        topArtists: ["Calvin Harris", "Diplo"],
    },
    {
        userId: "USR008",
        firstName: "Hip",
        lastName: "Hop",
        email: "hip.hop@test.com",
        phone: "+15550010008",
        subscriptionTier: "trial",
        trialEndDate: "2026-04-20",
        topChannels: ["Hits1", "BPM", "RapCaviar"],
        topArtists: ["Drake", "Kendrick Lamar", "21 Savage"],
    },
    {
        userId: "USR009",
        firstName: "Talk",
        lastName: "Radio",
        email: "talk.radio@test.com",
        phone: "+15550010009",
        subscriptionTier: "select",
        topChannels: ["POTUS", "CNN", "FoxNews", "SiriusXMPatriot"],
        topArtists: ["Rachel Maddow", "Sean Hannity"],
    },
    {
        userId: "USR010",
        firstName: "Country",
        lastName: "Devotee",
        email: "country.devotee@test.com",
        phone: "+15550010010",
        subscriptionTier: "trial",
        trialEndDate: "2026-04-08",
        topChannels: ["CountryRoads", "OutlawCountry", "TheHighway"],
        topArtists: ["Morgan Wallen", "Luke Combs"],
    },
    {
        userId: "USR011",
        firstName: "Balanced",
        lastName: "Listener",
        email: "balanced.listener@test.com",
        phone: "+15550010011",
        subscriptionTier: "premier",
        topChannels: ["Hits1", "CountryRoads", "Jazz", "POTUS"],
        topArtists: ["Taylor Swift", "Morgan Wallen"],
    },
    {
        userId: "USR012",
        firstName: "Live",
        lastName: "Event",
        email: "live.event@test.com",
        phone: "+15550010012",
        subscriptionTier: "trial",
        trialEndDate: "2026-04-12",
        topChannels: ["Hits1", "BPM"],
        topArtists: ["Kendrick Lamar"],
    },
    {
        userId: "USR013",
        firstName: "On",
        lastName: "Demand",
        email: "on.demand@test.com",
        phone: "+15550010013",
        subscriptionTier: "trial",
        trialEndDate: "2026-04-18",
        topChannels: ["BPM", "Chill"],
        topArtists: ["Calvin Harris"],
    },
    {
        userId: "USR014",
        firstName: "Both",
        lastName: "Available",
        email: "both.available@test.com",
        phone: "+15550010014",
        subscriptionTier: "trial",
        trialEndDate: "2026-04-05",
        topChannels: ["Hits1", "BPM"],
        topArtists: ["Drake", "Future"],
    },
    {
        userId: "USR015",
        firstName: "No",
        lastName: "Content",
        email: "no.content@test.com",
        phone: "+15550010015",
        subscriptionTier: "trial",
        trialEndDate: "2026-04-22",
        topChannels: ["ClassicVinyl", "Jazz"],
        topArtists: ["Miles Davis"],
    },
    {
        userId: "USR016",
        firstName: "Trial",
        lastName: "Ends",
        email: "trial.ends@test.com",
        phone: "+15550010016",
        subscriptionTier: "trial",
        trialEndDate: "2026-03-28",
        topChannels: ["Hits1", "BPM", "Diplo"],
        topArtists: ["Drake", "Doja Cat"],
    },
    {
        userId: "USR017",
        firstName: "Budget",
        lastName: "Conscious",
        email: "budget.conscious@test.com",
        phone: "+15550010017",
        subscriptionTier: "select",
        topChannels: ["Hits1", "PopRocks"],
        topArtists: ["Taylor Swift"],
    },
    {
        userId: "USR018",
        firstName: "Feature",
        lastName: "Seeker",
        email: "feature.seeker@test.com",
        phone: "+15550010018",
        subscriptionTier: "select",
        topChannels: ["HowardStern", "Premier1"],
        topArtists: ["Howard Stern"],
    },
    {
        userId: "USR019",
        firstName: "Happy",
        lastName: "Cancel",
        email: "happy.cancel@test.com",
        phone: "+15550010019",
        subscriptionTier: "trial",
        trialEndDate: "2026-04-01",
        topChannels: ["Hits1"],
        topArtists: ["Taylor Swift"],
    },
    {
        userId: "USR020",
        firstName: "Select",
        lastName: "Upgrade",
        email: "select.upgrade@test.com",
        phone: "+15550010020",
        subscriptionTier: "select",
        topChannels: ["HowardStern", "BPM", "Hits1"],
        topArtists: ["Howard Stern", "Drake"],
    },
];

// ─────────────────────────────────────────────────────────────────────────────
// Events (subset of 35 events — see data/events.csv for full list)
// ─────────────────────────────────────────────────────────────────────────────
export const EVENTS: EventRecord[] = [
    {
        eventId: "EVT001",
        date: "2026-03-16",
        artistGuest: "Diplo",
        eventType: "interview+performance",
        category: "Music",
        location: "New York",
        channels: ["Diplo's Revolution", "BPM", "Pandora"],
        startTime: "14:00",
        endTime: "16:00",
    },
    {
        eventId: "EVT003",
        date: "2026-03-17",
        artistGuest: "Drake",
        eventType: "performance",
        category: "Music",
        location: "Toronto",
        channels: ["SiriusXM Hits 1", "BPM"],
        startTime: "20:00",
        endTime: "22:00",
    },
    {
        eventId: "EVT005",
        date: "2026-03-18",
        artistGuest: "Taylor Swift",
        eventType: "interview+performance",
        category: "Music",
        location: "New York",
        channels: ["SiriusXM Hits 1", "The Pulse"],
        startTime: "19:00",
        endTime: "21:00",
    },
    {
        eventId: "EVT009",
        date: "2026-03-20",
        artistGuest: "Zach Bryan",
        eventType: "interview+performance",
        category: "Music",
        location: "Tulsa",
        channels: ["Country Roads", "Outlaw Country"],
        startTime: "18:00",
        endTime: "20:00",
    },
    {
        eventId: "EVT010",
        date: "2026-03-20",
        artistGuest: "Calvin Harris",
        eventType: "performance",
        category: "Music",
        location: "Las Vegas",
        channels: ["BPM", "Chill"],
        startTime: "22:00",
        endTime: "00:00",
    },
    {
        eventId: "EVT015",
        date: "2026-03-23",
        artistGuest: "Future",
        eventType: "interview",
        category: "Music",
        location: "Atlanta",
        channels: ["SiriusXM Hits 1", "BPM"],
        startTime: "14:00",
        endTime: "15:30",
    },
    {
        eventId: "EVT017",
        date: "2026-03-24",
        artistGuest: "Drake",
        eventType: "interview",
        category: "Music",
        location: "Toronto",
        channels: ["SiriusXM Hits 1"],
        startTime: "10:00",
        endTime: "11:30",
    },
    {
        eventId: "EVT018",
        date: "2026-03-24",
        artistGuest: "Diplo",
        eventType: "performance",
        category: "Music",
        location: "Miami",
        channels: ["Diplo's Revolution", "BPM"],
        startTime: "22:00",
        endTime: "00:00",
    },
    {
        eventId: "EVT019",
        date: "2026-03-25",
        artistGuest: "Zach Bryan",
        eventType: "performance",
        category: "Music",
        location: "Austin",
        channels: ["Country Roads", "Outlaw Country"],
        startTime: "20:00",
        endTime: "22:00",
    },
    {
        eventId: "EVT026",
        date: "2026-04-02",
        artistGuest: "Diplo",
        eventType: "performance",
        category: "Music",
        location: "Los Angeles",
        channels: ["Diplo's Revolution", "BPM"],
        startTime: "21:00",
        endTime: "23:00",
    },
    {
        eventId: "EVT027",
        date: "2026-04-03",
        artistGuest: "Morgan Wallen",
        eventType: "performance",
        category: "Music",
        location: "Nashville",
        channels: ["Country Roads"],
        startTime: "20:00",
        endTime: "22:00",
    },
    {
        eventId: "EVT028",
        date: "2026-04-04",
        artistGuest: "Drake",
        eventType: "performance",
        category: "Music",
        location: "New York",
        channels: ["SiriusXM Hits 1"],
        startTime: "21:00",
        endTime: "23:00",
    },
    {
        eventId: "EVT030",
        date: "2026-04-05",
        artistGuest: "Zach Bryan",
        eventType: "performance",
        category: "Music",
        location: "Austin",
        channels: ["Country Roads", "Outlaw Country"],
        startTime: "20:00",
        endTime: "22:00",
    },
    {
        eventId: "EVT032",
        date: "2026-04-07",
        artistGuest: "Kendrick Lamar",
        eventType: "interview+performance",
        category: "Music",
        location: "Los Angeles",
        channels: ["SiriusXM Hits 1"],
        startTime: "20:00",
        endTime: "22:00",
    },
    {
        eventId: "EVT035",
        date: "2026-04-10",
        artistGuest: "Doja Cat",
        eventType: "interview+performance",
        category: "Music",
        location: "Los Angeles",
        channels: ["SiriusXM Hits 1", "BPM"],
        startTime: "19:00",
        endTime: "21:00",
    },
];

// ─────────────────────────────────────────────────────────────────────────────
// Channels
// ─────────────────────────────────────────────────────────────────────────────
export const CHANNELS: ChannelRecord[] = [
    { channelKey: "Hits1", channelName: "SiriusXM Hits 1", channelNumber: "2", superCategory: "Music", genre: "Pop", description: "Today's biggest pop hits", packages: "All", imageUrl: "https://d17waft5a6sywo.cloudfront.net/eyJrZXkiOiJpZi8zMy8zM2FlMmNkNTAzODgzNjg5YTdiYjViYWE2YjY5YmU4Ml8xNzYxMDU5MTQ1LnBuZyIsImVkaXRzIjpbeyJmb3JtYXQiOnsidHlwZSI6ImpwZWcifX0seyJyZXNpemUiOnsid2lkdGgiOjMwMCwiaGVpZ2h0IjozMDB9fV19" },
    { channelKey: "BPM", channelName: "BPM", channelNumber: "51", superCategory: "Music", genre: "Electronic/Dance", description: "Non-stop dance and EDM", packages: "All", imageUrl: "https://d17waft5a6sywo.cloudfront.net/eyJrZXkiOiJhZW0vOTAvOTBmNGZjYzg5YzQ3NmE3ZTYyNDgzN2E0Y2I2ZWI3MTNfMTczMjAzOTk0Mi5qcGVnIiwiZWRpdHMiOlt7ImZvcm1hdCI6eyJ0eXBlIjoianBlZyJ9fSx7InJlc2l6ZSI6eyJ3aWR0aCI6MzAwLCJoZWlnaHQiOjMwMH19XX0=" },
    { channelKey: "Diplo", channelName: "Diplo's Revolution", channelNumber: "52", superCategory: "Music", genre: "Electronic/Dance", description: "Diplo's curated dance music", packages: "All" },
    { channelKey: "CountryRoads", channelName: "Country Roads", channelNumber: "56", superCategory: "Music", genre: "Country", description: "Today's country hits", packages: "All" },
    { channelKey: "OutlawCountry", channelName: "Outlaw Country", channelNumber: "60", superCategory: "Music", genre: "Country", description: "Outlaw and alternative country", packages: "All", imageUrl: "https://d17waft5a6sywo.cloudfront.net/eyJrZXkiOiJhZW0vNjIvNjI4YmNmYmI0ZGVjODRkODE3MzQ5M2VlNjY3MjFiYjhfMTY5OTM3NTQ4NS5qcGVnIiwiZWRpdHMiOlt7ImZvcm1hdCI6eyJ0eXBlIjoianBlZyJ9fSx7InJlc2l6ZSI6eyJ3aWR0aCI6MzAwLCJoZWlnaHQiOjMwMH19XX0=" },
    { channelKey: "TheHighway", channelName: "The Highway", channelNumber: "55", superCategory: "Music", genre: "Country", description: "New country hits", packages: "All", imageUrl: "https://d17waft5a6sywo.cloudfront.net/eyJrZXkiOiJpZi9hOS9hOWZhODlmOGE4ODczODI0OGU5YzMwMTY0NjJiZDE3YV8xNzUwMTY4MTAyLmpwZyIsImVkaXRzIjpbeyJmb3JtYXQiOnsidHlwZSI6ImpwZWcifX0seyJyZXNpemUiOnsid2lkdGgiOjMwMCwiaGVpZ2h0IjozMDB9fV19" },
    { channelKey: "AltNation", channelName: "Alt Nation", channelNumber: "36", superCategory: "Music", genre: "Alternative Rock", description: "Alternative rock hits", packages: "All", imageUrl: "https://d17waft5a6sywo.cloudfront.net/eyJrZXkiOiJhZW0vOTcvOTdiZmJjM2YzM2ZkMTQ0MTFmMjQyOWViYmRiYTc3YTJfMTczMjAzOTkzOS5qcGVnIiwiZWRpdHMiOlt7ImZvcm1hdCI6eyJ0eXBlIjoianBlZyJ9fSx7InJlc2l6ZSI6eyJ3aWR0aCI6MzAwLCJoZWlnaHQiOjMwMH19XX0=" },
    { channelKey: "LiquidMetal", channelName: "Liquid Metal", channelNumber: "40", superCategory: "Music", genre: "Heavy Metal", description: "Metal and hard rock", packages: "Premier+", imageUrl: "https://d17waft5a6sywo.cloudfront.net/eyJrZXkiOiJhZW0vZGQvZGQxN2M0NTc1YmQzMjdlMjY2MGJkNDVhODc0ZWY3ZWVfMTczMjAzOTkzMi5qcGVnIiwiZWRpdHMiOlt7ImZvcm1hdCI6eyJ0eXBlIjoianBlZyJ9fSx7InJlc2l6ZSI6eyJ3aWR0aCI6MzAwLCJoZWlnaHQiOjMwMH19XX0=" },
    { channelKey: "Octane", channelName: "Octane", channelNumber: "37", superCategory: "Music", genre: "Hard Rock", description: "Hard rock and metal", packages: "All", imageUrl: "https://d17waft5a6sywo.cloudfront.net/eyJrZXkiOiJpZi82Mi82MmVjOTIyOGQ2MzIzNTJjOWY4YjliZjI0YTQ4OTUzN18xNzUwMTY4MjU5LmpwZyIsImVkaXRzIjpbeyJmb3JtYXQiOnsidHlwZSI6ImpwZWcifX0seyJyZXNpemUiOnsid2lkdGgiOjMwMCwiaGVpZ2h0IjozMDB9fV19" },
    { channelKey: "HowardStern", channelName: "Howard Stern", channelNumber: "100", superCategory: "Howard Stern", genre: "Talk", description: "Howard Stern Show channels", packages: "Premier+", imageUrl: "https://d17waft5a6sywo.cloudfront.net/eyJrZXkiOiJlbnRpdHktbWFuYWdlbWVudC9mMS9mMTkyZDk4YWEyZTU3ZjUzNWY3ZjU5Mzc1OWYxZTA2ZV8xNzAyMDA5MDkzODU2LnBuZyIsImVkaXRzIjpbeyJmb3JtYXQiOnsidHlwZSI6ImpwZWcifX0seyJyZXNpemUiOnsid2lkdGgiOjMwMCwiaGVpZ2h0IjozMDB9fV19" },
    { channelKey: "POTUS", channelName: "P.O.T.U.S.", channelNumber: "124", superCategory: "Talk", genre: "News", description: "Politics and government", packages: "Select+" },
    { channelKey: "Jazz", channelName: "Real Jazz", channelNumber: "67", superCategory: "Music", genre: "Jazz", description: "Classic and contemporary jazz", packages: "All" },
    { channelKey: "ClassicVinyl", channelName: "Classic Vinyl", channelNumber: "26", superCategory: "Music", genre: "Classic Rock", description: "Classic rock from the 60s-80s", packages: "All", imageUrl: "https://d17waft5a6sywo.cloudfront.net/eyJrZXkiOiJhZW0vOGQvOGQ4Y2M2MmI4NWM4YTQ2YWQ5NmU4YWI3NTZiOGJhYzlfMTY5OTM3NTk2MS5qcGVnIiwiZWRpdHMiOlt7ImZvcm1hdCI6eyJ0eXBlIjoianBlZyJ9fSx7InJlc2l6ZSI6eyJ3aWR0aCI6MzAwLCJoZWlnaHQiOjMwMH19XX0=" },
    { channelKey: "Premier1", channelName: "SiriusXM Premier", channelNumber: "1", superCategory: "Music", genre: "Pop", description: "Premium curated pop hits", packages: "Premier+", imageUrl: "https://d17waft5a6sywo.cloudfront.net/eyJrZXkiOiJhZW0vYjgvYjgzZWMyMGI1YmI5NTFmOGNhOTE1N2I0NzI4NjY1YmVfMTcxMTk5NjM2MC5qcGVnIiwiZWRpdHMiOlt7ImZvcm1hdCI6eyJ0eXBlIjoianBlZyJ9fSx7InJlc2l6ZSI6eyJ3aWR0aCI6MzAwLCJoZWlnaHQiOjMwMH19XX0=" },
    { channelKey: "PopRocks", channelName: "Pop Rocks", channelNumber: "14", superCategory: "Music", genre: "Pop", description: "Pop and rock crossover", packages: "All", imageUrl: "https://d17waft5a6sywo.cloudfront.net/eyJrZXkiOiJhZW0vNDMvNDMyZDgxYjg2ODkzMzZhZWJiNjE5ZmY4MDYzNDljOGNfMTY5OTM3NTQyMi5qcGVnIiwiZWRpdHMiOlt7ImZvcm1hdCI6eyJ0eXBlIjoianBlZyJ9fSx7InJlc2l6ZSI6eyJ3aWR0aCI6MzAwLCJoZWlnaHQiOjMwMH19XX0=" },
    { channelKey: "Venus", channelName: "Venus", channelNumber: "72", superCategory: "Music", genre: "Pop", description: "Music by women artists", packages: "All" },
    { channelKey: "HipHopNation", channelName: "Hip-Hop Nation", channelNumber: "44", superCategory: "Music", genre: "Hip-Hop", description: "Hip-hop and rap", packages: "All", imageUrl: "https://d17waft5a6sywo.cloudfront.net/eyJrZXkiOiJpZi9kYy9kYzNkMjkzYmIwMzYzY2U3YjY1ZmZlMTdhM2U5MzFkZl8xNzUwMTY4MDg3LmpwZyIsImVkaXRzIjpbeyJmb3JtYXQiOnsidHlwZSI6ImpwZWcifX0seyJyZXNpemUiOnsid2lkdGgiOjMwMCwiaGVpZ2h0IjozMDB9fV19" },
    { channelKey: "Chill", channelName: "Chill", channelNumber: "53", superCategory: "Music", genre: "Electronic", description: "Chill and ambient electronic", packages: "All", imageUrl: "https://d17waft5a6sywo.cloudfront.net/eyJrZXkiOiJhZW0vNWEvNWE5NGU4OTk1MjM1MTIyMWM5YTJjNDY0MDBjYmZiMjNfMTcxMjY3NjQ3OC5qcGVnIiwiZWRpdHMiOlt7ImZvcm1hdCI6eyJ0eXBlIjoianBlZyJ9fSx7InJlc2l6ZSI6eyJ3aWR0aCI6MzAwLCJoZWlnaHQiOjMwMH19XX0=" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Query Helpers
// ─────────────────────────────────────────────────────────────────────────────

export function getUserProfileById(userId: string): UserProfileRecord | undefined {
    return USER_PROFILES.find(u => u.userId === userId);
}

export function getUserProfileByPhone(phone: string): UserProfileRecord | undefined {
    if (!phone) return undefined;
    const normalized = phone.replace(/\s/g, "");
    return USER_PROFILES.find(u => u.phone && u.phone.replace(/\s/g, "") === normalized);
}

export function getUserProfileByEmail(email: string): UserProfileRecord | undefined {
    if (!email) return undefined;
    return USER_PROFILES.find(u => u.email.toLowerCase() === email.toLowerCase());
}

export function getEventsByArtist(artistName: string): EventRecord[] {
    const lower = artistName.toLowerCase();
    return EVENTS.filter(e => e.artistGuest.toLowerCase().includes(lower));
}

export function getEventsByChannel(channelKey: string): EventRecord[] {
    const displayName = resolveChannelName(channelKey).toLowerCase();
    return EVENTS.filter(e => e.channels.some(c => c.toLowerCase() === displayName));
}

export type ScoredEvent = EventRecord & { score: number };

export function getEventsForUser(userId: string): ScoredEvent[] {
    const profile = getUserProfileById(userId);
    if (!profile) return [];

    const scored = new Map<string, ScoredEvent>();

    // Direct artist match: 100 points
    for (const artist of profile.topArtists) {
        for (const event of getEventsByArtist(artist)) {
            const existing = scored.get(event.eventId);
            if (existing) {
                existing.score += 100;
            } else {
                scored.set(event.eventId, { ...event, score: 100 });
            }
        }
    }

    // Channel overlap: 20 points per matching channel
    for (const channelKey of profile.topChannels) {
        for (const event of getEventsByChannel(channelKey)) {
            const existing = scored.get(event.eventId);
            if (existing) {
                existing.score += 20;
            } else {
                scored.set(event.eventId, { ...event, score: 20 });
            }
        }
    }

    return Array.from(scored.values()).sort((a, b) => b.score - a.score);
}

export function getChannelByKey(key: string): ChannelRecord | undefined {
    return CHANNELS.find(c => c.channelKey === key);
}

export function getChannelByName(name: string): ChannelRecord | undefined {
    const lower = name.toLowerCase();
    return CHANNELS.find(c => c.channelName.toLowerCase() === lower);
}

export function getChannelsByArtist(artistName: string): ChannelRecord[] {
    const events = getEventsByArtist(artistName);
    const channelNames = new Set(events.flatMap(e => e.channels));
    return CHANNELS.filter(c => channelNames.has(c.channelName));
}
