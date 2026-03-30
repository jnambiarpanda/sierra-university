// Copyright Sierra
// Synthetic data layer — user profiles generated from data/users.csv.
// All tools query these helpers instead of hitting live APIs.

import { GENERATED_USER_PROFILES } from "./users-data";

export type SubscriptionTier = "trial" | "select" | "premier" | "all-access" | "expired";

export type UserProfileRecord = {
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string; // E.164 format, empty string if unknown
    subscriptionTier: SubscriptionTier;
    trialEndDate?: string; // ISO date string, present when tier = "trial"
    topChannels: string[]; // top_recommendation entity IDs from users.csv
    topArtists: string[];  // artist names (test users) or entity IDs (named profiles) — Phase 1
    topTeams: string[];    // team entity IDs from users.csv
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
    playerLandingPage?: string;
};

function resolveChannelName(key: string): string {
    return CHANNELS.find(c => c.channelKey === key)?.channelName ?? key;
}

// ─────────────────────────────────────────────────────────────────────────────
// User Profiles — generated at build time from data/users.csv
// Run: node generate-users-csv.mjs   to regenerate users-data.ts + users.csv
// ─────────────────────────────────────────────────────────────────────────────
export const USER_PROFILES: UserProfileRecord[] = GENERATED_USER_PROFILES;

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
    { channelKey: "194adbca-34d6-cb94-b153-3488ee563308", channelName: "SiriusXM Hits 1", channelNumber: "2", superCategory: "Music", genre: "Pop", description: "Today's biggest pop hits", packages: "All", imageUrl: "https://imgsrv-sxm-prod-device.streaming.siriusxm.com/eyJrZXkiOiJpZi8zMy8zM2RkZGExNDFlYjAzMTllYTJmMzY1Y2NlZmM5YzcxOV8xNzU2MzQ1OTQ1LnBuZyIsImVkaXRzIjpbeyJmb3JtYXQiOnsidHlwZSI6ImpwZWcifX0seyJyZXNpemUiOnsid2lkdGgiOjYwMCwiaGVpZ2h0Ijo2MDB9fV19", playerLandingPage: "https://www.siriusxm.com/player/channel-linear/entity/194adbca-34d6-cb94-b153-3488ee563308" },
    { channelKey: "6adef1b5-d812-9c10-7c6c-f05af4e27077", channelName: "BPM", channelNumber: "51", superCategory: "Music", genre: "Electronic/Dance", description: "Non-stop dance and EDM", packages: "All", imageUrl: "https://imgsrv-sxm-prod-device.streaming.siriusxm.com/eyJrZXkiOiJhZW0vOTAvOTBmNGZjYzg5YzQ3NmE3ZTYyNDgzN2E0Y2I2ZWI3MTNfMTczMjAzOTk0Mi5qcGVnIiwiZWRpdHMiOlt7ImZvcm1hdCI6eyJ0eXBlIjoianBlZyJ9fSx7InJlc2l6ZSI6eyJ3aWR0aCI6NjAwLCJoZWlnaHQiOjYwMH19XX0=", playerLandingPage: "https://www.siriusxm.com/player/channel-linear/entity/6adef1b5-d812-9c10-7c6c-f05af4e27077" },
    { channelKey: "89c9bcb8-704a-435e-a047-30840e7ee70d", channelName: "Diplo's Revolution", channelNumber: "52", superCategory: "Music", genre: "Electronic/Dance", description: "Diplo's curated dance music", packages: "All", imageUrl: "https://imgsrv-sxm-prod-device.streaming.siriusxm.com/eyJrZXkiOiJlbnRpdHktbWFuYWdlbWVudC9mYS9mYTZjOWI1NTM2ZDg4OWY0NGU0MjA1NTkwMjY0MzVjZl8xNzAyMjMyNzk4NjkzLnBuZyIsImVkaXRzIjpbeyJmb3JtYXQiOnsidHlwZSI6ImpwZWcifX0seyJyZXNpemUiOnsid2lkdGgiOjUzMCwiaGVpZ2h0Ijo1MzB9fV19", playerLandingPage: "https://www.siriusxm.com/player/talent/entity/89c9bcb8-704a-435e-a047-30840e7ee70d" },
    { channelKey: "687f841b-a76e-35ef-98de-022afe72566e", channelName: "Country Roads", channelNumber: "56", superCategory: "Music", genre: "Country", description: "Today's country hits", packages: "All", imageUrl: "https://imgsrv-sxm-prod-device.streaming.siriusxm.com/eyJrZXkiOiJwb2RjYXN0LzI0NzFiN2I5ODc1NTAzOWQ1YTdiMjFlNzUxN2M3NGFhZDk4ZGQ4MjE1M2ViZTZjNWYwMTliNzJjMjRhNTkzM2IiLCJlZGl0cyI6W3siZm9ybWF0Ijp7InR5cGUiOiJqcGVnIn19LHsicmVzaXplIjp7IndpZHRoIjo2MDAsImhlaWdodCI6NjAwfX1dfQ==", playerLandingPage: "https://www.siriusxm.com/player/show-podcast/entity/687f841b-a76e-35ef-98de-022afe72566e" },
    { channelKey: "176daca5-6810-3a1c-49e9-39b69055e811", channelName: "Outlaw Country", channelNumber: "60", superCategory: "Music", genre: "Country", description: "Outlaw and alternative country", packages: "All", imageUrl: "https://imgsrv-sxm-prod-device.streaming.siriusxm.com/eyJrZXkiOiJhZW0vNjIvNjI4YmNmYmI0ZGVjODRkODE3MzQ5M2VlNjY3MjFiYjhfMTY5OTM3NTQ4NS5qcGVnIiwiZWRpdHMiOlt7ImZvcm1hdCI6eyJ0eXBlIjoianBlZyJ9fSx7InJlc2l6ZSI6eyJ3aWR0aCI6NjAwLCJoZWlnaHQiOjYwMH19XX0=", playerLandingPage: "https://www.siriusxm.com/player/channel-linear/entity/176daca5-6810-3a1c-49e9-39b69055e811" },
    { channelKey: "ffd94bb6-5368-67ae-91be-5b2bababeca0", channelName: "The Highway", channelNumber: "55", superCategory: "Music", genre: "Country", description: "New country hits", packages: "All", imageUrl: "https://imgsrv-sxm-prod-device.streaming.siriusxm.com/eyJrZXkiOiJpZi80MS80MTU0MDczOWJiZmMzNzEwYjg2NDM4ODc1NDFmZmZiZV8xNzY4NDA1NjEzLnBuZyIsImVkaXRzIjpbeyJmb3JtYXQiOnsidHlwZSI6ImpwZWcifX0seyJyZXNpemUiOnsid2lkdGgiOjYwMCwiaGVpZ2h0Ijo2MDB9fV19", playerLandingPage: "https://www.siriusxm.com/player/channel-linear/entity/ffd94bb6-5368-67ae-91be-5b2bababeca0" },
    { channelKey: "fd5740ec-7f11-0ecf-f676-46f9dc056d2c", channelName: "Alt Nation", channelNumber: "36", superCategory: "Music", genre: "Alternative Rock", description: "Alternative rock hits", packages: "All", imageUrl: "https://imgsrv-sxm-prod-device.streaming.siriusxm.com/eyJrZXkiOiJhZW0vOTcvOTdiZmJjM2YzM2ZkMTQ0MTFmMjQyOWViYmRiYTc3YTJfMTczMjAzOTkzOS5qcGVnIiwiZWRpdHMiOlt7ImZvcm1hdCI6eyJ0eXBlIjoianBlZyJ9fSx7InJlc2l6ZSI6eyJ3aWR0aCI6NjAwLCJoZWlnaHQiOjYwMH19XX0=", playerLandingPage: "https://www.siriusxm.com/player/channel-linear/entity/fd5740ec-7f11-0ecf-f676-46f9dc056d2c" },
    { channelKey: "634ea01e-4ae2-c7e8-7567-138965e8a6fe", channelName: "Liquid Metal", channelNumber: "40", superCategory: "Music", genre: "Heavy Metal", description: "Metal and hard rock", packages: "Premier+", imageUrl: "https://imgsrv-sxm-prod-device.streaming.siriusxm.com/eyJrZXkiOiJhZW0vZGQvZGQxN2M0NTc1YmQzMjdlMjY2MGJkNDVhODc0ZWY3ZWVfMTczMjAzOTkzMi5qcGVnIiwiZWRpdHMiOlt7ImZvcm1hdCI6eyJ0eXBlIjoianBlZyJ9fSx7InJlc2l6ZSI6eyJ3aWR0aCI6NjAwLCJoZWlnaHQiOjYwMH19XX0=", playerLandingPage: "https://www.siriusxm.com/player/channel-linear/entity/634ea01e-4ae2-c7e8-7567-138965e8a6fe" },
    { channelKey: "0fed9647-cc82-24d7-526d-98762e8a52cd", channelName: "Octane", channelNumber: "37", superCategory: "Music", genre: "Hard Rock", description: "Hard rock and metal", packages: "All", imageUrl: "https://imgsrv-sxm-prod-device.streaming.siriusxm.com/eyJrZXkiOiJhZW0vMjgvMjhmMDczY2JjZGY0YWVmNWE5MGMwNjNiNDcxZTkwNDhfMTczMjAzOTk2My5qcGVnIiwiZWRpdHMiOlt7ImZvcm1hdCI6eyJ0eXBlIjoianBlZyJ9fSx7InJlc2l6ZSI6eyJ3aWR0aCI6NjAwLCJoZWlnaHQiOjYwMH19XX0=", playerLandingPage: "https://www.siriusxm.com/player/channel-linear/entity/0fed9647-cc82-24d7-526d-98762e8a52cd" },
    { channelKey: "5ad6890a-adaf-48bf-adbf-d0bf28def878", channelName: "Howard Stern", channelNumber: "100", superCategory: "Howard Stern", genre: "Talk", description: "Howard Stern Show channels", packages: "Premier+", imageUrl: "https://imgsrv-sxm-prod-device.streaming.siriusxm.com/eyJrZXkiOiJhZW0vZDYvZDZmOGE1NTcwZjcxMGZhNzM1OGVmNWU3YjZmM2I0ZGNfMTcwMTM2MDU4OS5qcGVnIiwiZWRpdHMiOlt7ImZvcm1hdCI6eyJ0eXBlIjoianBlZyJ9fSx7InJlc2l6ZSI6eyJ3aWR0aCI6NjAwLCJoZWlnaHQiOjYwMH19XX0=", playerLandingPage: "https://www.siriusxm.com/player/show/entity/5ad6890a-adaf-48bf-adbf-d0bf28def878" },
    { channelKey: "6739babb-7975-e60e-1835-fbacd4bbd855", channelName: "SiriusXM Patriot", channelNumber: "125", superCategory: "Talk", genre: "News/Talk", description: "Conservative talk radio", packages: "Select+", imageUrl: "https://imgsrv-sxm-prod-device.streaming.siriusxm.com/eyJrZXkiOiJhZW0vMmMvMmM1NTM2MmJmYWNmY2Y2YmZkODIxODRkNTBmMDlmNGRfMTY5OTM3NTc2MS5qcGVnIiwiZWRpdHMiOlt7ImZvcm1hdCI6eyJ0eXBlIjoianBlZyJ9fSx7InJlc2l6ZSI6eyJ3aWR0aCI6NjAwLCJoZWlnaHQiOjYwMH19XX0=", playerLandingPage: "https://www.siriusxm.com/player/channel-linear/entity/6739babb-7975-e60e-1835-fbacd4bbd855" },
    { channelKey: "43993462-1c73-efb8-29e5-0c4652cf8e4f", channelName: "P.O.T.U.S.", channelNumber: "124", superCategory: "Talk", genre: "News", description: "Politics and government", packages: "Select+", imageUrl: "https://imgsrv-sxm-prod-device.streaming.siriusxm.com/eyJrZXkiOiJpZi9jNi9jNmJiNDg2ZTllNDEzYzY4YjhjYWNjZDAwYzBkNzZjMF8xNzUzODE3MzE5LmpwZyIsImVkaXRzIjpbeyJmb3JtYXQiOnsidHlwZSI6ImpwZWcifX0seyJyZXNpemUiOnsid2lkdGgiOjYwMCwiaGVpZ2h0Ijo2MDB9fV19", playerLandingPage: "https://www.siriusxm.com/player/channel-linear/entity/43993462-1c73-efb8-29e5-0c4652cf8e4f" },
    { channelKey: "3c7b2421-7ce4-0ecb-bc70-7f60f15d3d29", channelName: "CNN", channelNumber: "116", superCategory: "Talk", genre: "News", description: "CNN news coverage", packages: "Select+", imageUrl: "https://imgsrv-sxm-prod-device.streaming.siriusxm.com/eyJrZXkiOiJhZW0vNWMvNWM2MmFjNDFmNDg2Yzc0OGE2YzU1MmI1Yzk0ZmQxMjFfMTczOTIwMzIxNy5wbmciLCJlZGl0cyI6W3siZm9ybWF0Ijp7InR5cGUiOiJqcGVnIn19LHsicmVzaXplIjp7IndpZHRoIjo2MDAsImhlaWdodCI6NjAwfX1dfQ==", playerLandingPage: "https://www.siriusxm.com/player/channel-linear/entity/3c7b2421-7ce4-0ecb-bc70-7f60f15d3d29" },
    { channelKey: "5f8894e9-d615-21d0-a114-ecd08e7fa75c", channelName: "Fox News", channelNumber: "205", superCategory: "Talk", genre: "News", description: "Fox News coverage", packages: "Select+", imageUrl: "https://imgsrv-sxm-prod-device.streaming.siriusxm.com/eyJrZXkiOiJhZW0vYWIvYWJjOTA1NzcxNjEwN2VkOWRmYzhjMzAyYzZiMzBjYzFfMTY5OTM3NTg3OS5qcGVnIiwiZWRpdHMiOlt7ImZvcm1hdCI6eyJ0eXBlIjoianBlZyJ9fSx7InJlc2l6ZSI6eyJ3aWR0aCI6NjAwLCJoZWlnaHQiOjYwMH19XX0=", playerLandingPage: "https://www.siriusxm.com/player/channel-linear/entity/5f8894e9-d615-21d0-a114-ecd08e7fa75c" },
    { channelKey: "e6333906-2e89-6c07-59d6-36d09248b8dc", channelName: "Real Jazz", channelNumber: "67", superCategory: "Music", genre: "Jazz", description: "Classic and contemporary jazz", packages: "All", imageUrl: "https://imgsrv-sxm-prod-device.streaming.siriusxm.com/eyJrZXkiOiJpZi82Mi82MmU4ZTkyZTIwYmEzMDAzODdhN2MyN2I5ODk0NTVjY18xNzcwNzQ5MTcxLmpwZyIsImVkaXRzIjpbeyJmb3JtYXQiOnsidHlwZSI6ImpwZWcifX0seyJyZXNpemUiOnsid2lkdGgiOjYwMCwiaGVpZ2h0Ijo2MDB9fV19", playerLandingPage: "https://www.siriusxm.com/player/channel-linear/entity/e6333906-2e89-6c07-59d6-36d09248b8dc" },
    { channelKey: "5ad8659a-414a-9e26-b973-f5a229d788dd", channelName: "Classic Vinyl", channelNumber: "26", superCategory: "Music", genre: "Classic Rock", description: "Classic rock from the 60s-80s", packages: "All", imageUrl: "https://imgsrv-sxm-prod-device.streaming.siriusxm.com/eyJrZXkiOiJhZW0vZTgvZThkOGE4YzQ3ZmNjMTc2M2I4YWY1NjIwYTBiNTNmZTRfMTY5OTM3NTI1MC5qcGVnIiwiZWRpdHMiOlt7ImZvcm1hdCI6eyJ0eXBlIjoianBlZyJ9fSx7InJlc2l6ZSI6eyJ3aWR0aCI6NjAwLCJoZWlnaHQiOjYwMH19XX0=", playerLandingPage: "https://www.siriusxm.com/player/channel-linear/entity/5ad8659a-414a-9e26-b973-f5a229d788dd" },
    { channelKey: "a44e273d-a7e5-c358-a8ae-39dc91ca9c30", channelName: "SiriusXM Premier", channelNumber: "1", superCategory: "Music", genre: "Pop", description: "Premium curated pop hits", packages: "Premier+", imageUrl: "https://imgsrv-sxm-prod-device.streaming.siriusxm.com/eyJrZXkiOiJpZi9kMy9kM2RkNzY5Nzg4MGEzN2M5OWU5MTc2NjBkMmFkMzZiZV8xNzU5MjM2NDY0LmpwZyIsImVkaXRzIjpbeyJmb3JtYXQiOnsidHlwZSI6ImpwZWcifX0seyJyZXNpemUiOnsid2lkdGgiOjYwMCwiaGVpZ2h0Ijo2MDB9fV19", playerLandingPage: "https://www.siriusxm.com/player/channel-linear/PGA%20Radio/a44e273d-a7e5-c358-a8ae-39dc91ca9c30" },
    { channelKey: "44f9129f-579a-3d23-218f-3c3518036fc6", channelName: "Pop Rocks", channelNumber: "14", superCategory: "Music", genre: "Pop", description: "Pop and rock crossover", packages: "All", imageUrl: "https://imgsrv-sxm-prod-device.streaming.siriusxm.com/eyJrZXkiOiJhZW0vMmQvMmQ4YmYyNGIzNTZlODkzMDUzY2Q4NTdlMGY4MDAxZThfMTczMjAzOTk2Ni5qcGVnIiwiZWRpdHMiOlt7ImZvcm1hdCI6eyJ0eXBlIjoianBlZyJ9fSx7InJlc2l6ZSI6eyJ3aWR0aCI6NjAwLCJoZWlnaHQiOjYwMH19XX0=", playerLandingPage: "https://www.siriusxm.com/player/channel-linear/entity/44f9129f-579a-3d23-218f-3c3518036fc6" },
    { channelKey: "84d0d860-f65a-3184-9e29-335d4da505e8", channelName: "Venus", channelNumber: "72", superCategory: "Music", genre: "Pop", description: "Music by women artists", packages: "All", imageUrl: "https://imgsrv-sxm-prod-device.streaming.siriusxm.com/eyJrZXkiOiJwb2RjYXN0LzNlYTNlYWNiYTViNWZiZDNmNjMxMjY5ZTgxNWYzZTQ4YWU1YmQxOTc1NzUwNmMzMjdlMmJlNTQ5MjMxZWFiM2IiLCJlZGl0cyI6W3siZm9ybWF0Ijp7InR5cGUiOiJqcGVnIn19LHsicmVzaXplIjp7IndpZHRoIjo2MDAsImhlaWdodCI6NjAwfX1dfQ==", playerLandingPage: "https://www.siriusxm.com/player/show-podcast/entity/84d0d860-f65a-3184-9e29-335d4da505e8" },
    { channelKey: "bd54fc02-e063-0e3e-0cbb-4ceafef734e7", channelName: "Hip-Hop Nation", channelNumber: "44", superCategory: "Music", genre: "Hip-Hop", description: "Hip-hop and rap", packages: "All", imageUrl: "https://imgsrv-sxm-prod-device.streaming.siriusxm.com/eyJrZXkiOiJhZW0vOTcvOTc4M2EwY2Q3MzkzOWNmYzcyOWIwMTMyYmY3NWVkZmNfMTY5OTM3NjA4MC5qcGVnIiwiZWRpdHMiOlt7ImZvcm1hdCI6eyJ0eXBlIjoianBlZyJ9fSx7InJlc2l6ZSI6eyJ3aWR0aCI6NjAwLCJoZWlnaHQiOjYwMH19XX0=", playerLandingPage: "https://www.siriusxm.com/player/channel-linear/entity/bd54fc02-e063-0e3e-0cbb-4ceafef734e7" },
    { channelKey: "834383dd-9a7e-d59e-81a2-dd13e0377af2", channelName: "Chill", channelNumber: "53", superCategory: "Music", genre: "Electronic", description: "Chill and ambient electronic", packages: "All", imageUrl: "https://imgsrv-sxm-prod-device.streaming.siriusxm.com/eyJrZXkiOiJhZW0vNWEvNWE5NGU4OTk1MjM1MTIyMWM5YTJjNDY0MDBjYmZiMjNfMTcxMjY3NjQ3OC5qcGVnIiwiZWRpdHMiOlt7ImZvcm1hdCI6eyJ0eXBlIjoianBlZyJ9fSx7InJlc2l6ZSI6eyJ3aWR0aCI6NjAwLCJoZWlnaHQiOjYwMH19XX0=", playerLandingPage: "https://www.siriusxm.com/player/channel-linear/entity/834383dd-9a7e-d59e-81a2-dd13e0377af2" },
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
