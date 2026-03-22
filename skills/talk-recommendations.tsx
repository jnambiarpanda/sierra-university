import { Skill } from '@sierra/agent';

// Define types for recommendations
interface Recommendation {
  title: string;
  type: string;
}

// Refactored as a function export
export const getTalkRecommendations: Skill = {
  name: 'getTalkRecommendations',
  description: 'Get talk/news recommendations',
  execute: async (): Promise<Recommendation[]> => {
    return [
      { title: 'News Roundup', type: 'show' },
      { title: 'Sports Talk', type: 'station' },
    ];
  },
};