import { ConvexHttpClient } from "convex/browser";

/**
 * Convex Testing Utilities
 *
 * Direct API calls for seeding test data and verifying state
 */

export function createConvexClient(url: string): ConvexHttpClient {
  return new ConvexHttpClient(url);
}

// Seed test bowlers
export async function seedTestBowlers(
  _client: ConvexHttpClient,
  count = 8
): Promise<string[]> {
  const _bowlers = Array.from({ length: count }, (_, i) => ({
    name: `Test Bowler ${i + 1}`,
    average: 150 + Math.floor(Math.random() * 50),
    handicap: Math.floor(Math.random() * 30),
  }));

  // Note: This requires auth - use in authenticated context
  // const ids = await client.mutation(api.bowlers.createBulk, { bowlers });
  // return ids;
  return [];
}

// Generate random scores for testing
export function generateTestScores(
  bowlerIds: string[],
  games = 3
): Array<{
  bowlerId: string;
  gameNumber: number;
  pinsKnocked: number;
  handicap: number;
}> {
  const scores = [];
  for (const bowlerId of bowlerIds) {
    for (let game = 1; game <= games; game++) {
      scores.push({
        bowlerId,
        gameNumber: game,
        pinsKnocked: 120 + Math.floor(Math.random() * 80),
        handicap: 20,
      });
    }
  }
  return scores;
}

// Simulate a full bracket tournament
export function simulateBracketResults(bracketSize: 4 | 8 | 16): Array<{
  matchPosition: number;
  bowler1Score: number;
  bowler2Score: number;
}> {
  const results = [];
  let matchesInRound = bracketSize / 2;
  let position = 1;

  while (matchesInRound >= 1) {
    for (let i = 0; i < matchesInRound; i++) {
      const score1 = 150 + Math.floor(Math.random() * 100);
      const score2 = 150 + Math.floor(Math.random() * 100);
      results.push({
        matchPosition: position,
        bowler1Score: score1,
        bowler2Score: score2 === score1 ? score2 + 1 : score2, // Avoid ties
      });
      position++;
    }
    matchesInRound /= 2;
  }

  return results;
}
