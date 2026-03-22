interface Recommendation {
  title: string;
  type: string;
}

interface RecommendationSkill {
  name: string;
  description: string;
  execute: () => Recommendation[];
}

export const getTalkRecommendations: RecommendationSkill = {
  name: 'getTalkRecommendations',
  description: 'Get talk/news recommendations',
  execute: (): Recommendation[] => {
    return [
      { title: 'News Roundup', type: 'show' },
      { title: 'Sports Talk', type: 'station' },
    ];
  },
};