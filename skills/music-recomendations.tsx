import { Skill } from '@sierra/agent';

// Define types for recommendations
interface Recommendation {
  title: string;
  type: string;
}

// Refactored as a function export (if Skill is not a class)
export const getMusicRecommendations: Skill = {
  name: 'getMusicRecommendations',
  description: 'Get personalized music recommendations',
  execute: async (): Promise<Recommendation[]> => {
    // Mock data
    return [
      { title: 'Chill Hits', type: 'station' },
      { title: 'Top 100', type: 'playlist' },
      { title: 'Jazz Vibes', type: 'station' },
    ];
  },
};