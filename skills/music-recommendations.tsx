interface Recommendation {
  title: string;
  type: string;
}

interface RecommendationSkill {
  name: string;
  description: string;
  execute: () => Recommendation[];
}

export const getMusicRecommendations: RecommendationSkill = {
  name: 'getMusicRecommendations',
  description: 'Get personalized music recommendations',
  execute: (): Recommendation[] => {
    // Mock data
    return [
      { title: 'Chill Hits', type: 'station' },
      { title: 'Top 100', type: 'playlist' },
      { title: 'Jazz Vibes', type: 'station' },
    ];
  },
};
