import { fetch } from "@sierra/agent";

interface RecommendedItem {
  id: string;
  title: string;
}

interface RecommenderResponse {
  container: {
    sets: Array<{
      items: Array<{
        entity: {
          id: string;
          texts: {
            title: {
              default: string;
            };
          };
        };
      }>;
    }>;
  };
}

const USE_MOCK = true; // set to false when running in an environment with VPN access

const MOCK_RECOMMENDATIONS: RecommendedItem[] = [
  { id: "show-001", title: "Conan O'Brien Needs a Friend" },
  { id: "show-002", title: "Crime Junkie" },
  { id: "show-003", title: "The Daily" },
];

export function getSimilarShowsRecommendations(): RecommendedItem[] {
  if (USE_MOCK) {
    return MOCK_RECOMMENDATIONS;
  }

  const result = fetch.jsonSync<RecommenderResponse>(
    "http://recommender-service.us-east-1.cnt-svcs.prod.cloud.siriusxm.com/public/v1/recommender/v1/container/similar-shows-podcasts?containerId=2twLNoJRLY89RPwbLx48wo&useCuratedContext=false&currentPage=0&setStyle=circles&preferredImageVariant=default&locale=en-US&supportedMediaType=AUDIO&supportedMediaType=VIDEO&unentitledContent=lock&responseThreshold=1&providerSetId=dsps_for_you_1",
    {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "Accept-Language": "en-US",
        "Content-Type": "application/json",
        "x-sxm-ent-channel-lineup-id": "400",
        "x-sxm-profile-id": "0b0f6f5e-0701-4498-a20b-c0c46fc50c21",
        "x-sxm-upsell-channel-lineup-id": "400",
      },
    }
  );

  if (result.status !== 200 || !result.body) {
    return [];
  }

  const items = result.body.container.sets[0]?.items ?? [];
  return items.slice(0, 3).map((item) => ({
    id: item.entity.id,
    title: item.entity.texts.title.default,
  }));
}
