interface Recommendation {
  title: string;
  type: string;
}

interface RecommendationSkill {
  name: string;
  description: string;
  execute: () => Recommendation[];
}

export const getTrendingContent: RecommendationSkill = {
  name: 'getTrendingContent',
  description: 'Get trending content',
  execute: (): Recommendation[] => {
    return [
      { title: 'Trending Now', type: 'playlist' },
      { title: 'Hot Topics', type: 'show' },
    ];
  },
};