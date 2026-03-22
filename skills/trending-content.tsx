import { Skill } from '@sierra/agent';

// Define types for recommendations
interface Recommendation {
  title: string;
  type: string;
}

// Refactored as a function export
export const getTrendingContent: Skill = {
  name: 'getTrendingContent',
  description: 'Get trending content',
  execute: async (): Promise<Recommendation[]> => {
    return [
      { title: 'Trending Now', type: 'playlist' },
      { title: 'Hot Topics', type: 'show' },
    ];
  },
};