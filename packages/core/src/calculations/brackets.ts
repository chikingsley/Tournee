import type { Bowler, BracketMatch, BracketSize } from "../types/index.js";

/**
 * Shuffle array using Fisher-Yates algorithm
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = shuffled[i];
    shuffled[i] = shuffled[j] as T;
    shuffled[j] = temp as T;
  }
  return shuffled;
}

/**
 * Calculate the number of rounds needed for a bracket
 */
export function calculateRounds(size: number): number {
  return Math.ceil(Math.log2(size));
}

/**
 * Calculate number of BYEs needed for non-power-of-2 brackets
 */
export function calculateByes(entrants: number, bracketSize: number): number {
  const nextPowerOf2 = 2 ** Math.ceil(Math.log2(bracketSize));
  return nextPowerOf2 - entrants;
}

/**
 * Generate bracket matches for single elimination
 * Supports any size (4, 8, 12, 16, 32, 64)
 */
export function generateBracketMatches(
  bowlerIds: string[],
  bracketSize: BracketSize
): BracketMatch[] {
  const matches: BracketMatch[] = [];

  // For non-power-of-2 (like 12), round up to next power of 2
  const effectiveSize = 2 ** Math.ceil(Math.log2(bracketSize));
  const numRounds = Math.log2(effectiveSize);

  // Shuffle bowlers for random seeding
  const shuffledBowlers = shuffleArray([...bowlerIds]);

  // Pad with nulls if not enough bowlers (BYEs)
  while (shuffledBowlers.length < effectiveSize) {
    shuffledBowlers.push(null as unknown as string);
  }

  let matchId = 0;

  // Generate first round matches
  for (let i = 0; i < effectiveSize / 2; i++) {
    const bowler1 = shuffledBowlers[i * 2] || null;
    const bowler2 = shuffledBowlers[i * 2 + 1] || null;

    matches.push({
      id: `match-${matchId++}`,
      round: 1,
      position: i,
      bowler1Id: bowler1,
      bowler2Id: bowler2,
      bowler1Score: null,
      bowler2Score: null,
      // Auto-advance if BYE
      winnerId: bowler1 === null ? bowler2 : bowler2 === null ? bowler1 : null,
    });
  }

  // Generate subsequent round placeholders
  let matchesInRound = effectiveSize / 4;
  for (let round = 2; round <= numRounds; round++) {
    for (let i = 0; i < matchesInRound; i++) {
      matches.push({
        id: `match-${matchId++}`,
        round,
        position: i,
        bowler1Id: null,
        bowler2Id: null,
        bowler1Score: null,
        bowler2Score: null,
        winnerId: null,
      });
    }
    matchesInRound /= 2;
  }

  return matches;
}

/**
 * Determine winner of a match
 */
export function determineMatchWinner(match: BracketMatch): string | null {
  // Handle BYE
  if (match.bowler1Id === null) {
    return match.bowler2Id;
  }
  if (match.bowler2Id === null) {
    return match.bowler1Id;
  }

  if (match.bowler1Score === null || match.bowler2Score === null) {
    return null;
  }

  if (match.bowler1Score > match.bowler2Score) {
    return match.bowler1Id;
  }
  if (match.bowler2Score > match.bowler1Score) {
    return match.bowler2Id;
  }

  return null; // Tie
}

/**
 * Get list of bowlers still alive in a bracket
 */
export function getStillAlive(
  matches: BracketMatch[],
  allBowlerIds: string[]
): string[] {
  const eliminated = new Set<string>();

  for (const match of matches) {
    if (match.winnerId) {
      // The loser is eliminated
      if (match.bowler1Id && match.bowler1Id !== match.winnerId) {
        eliminated.add(match.bowler1Id);
      }
      if (match.bowler2Id && match.bowler2Id !== match.winnerId) {
        eliminated.add(match.bowler2Id);
      }
    }
  }

  return allBowlerIds.filter((id) => !eliminated.has(id));
}

/**
 * Check if two bowlers have faced each other in any provided brackets
 */
export function haveFacedEachOther(
  bowler1Id: string,
  bowler2Id: string,
  allMatches: BracketMatch[]
): boolean {
  return allMatches.some(
    (match) =>
      (match.bowler1Id === bowler1Id && match.bowler2Id === bowler2Id) ||
      (match.bowler1Id === bowler2Id && match.bowler2Id === bowler1Id)
  );
}

/**
 * Generate bracket with duplicate pairing prevention
 * Tries to avoid matching bowlers who have already faced each other
 */
export function generateBracketWithHistory(
  bowlerIds: string[],
  bracketSize: BracketSize,
  previousMatches: BracketMatch[],
  maxAttempts = 100
): BracketMatch[] {
  let bestMatches: BracketMatch[] = [];
  let minDuplicates = Number.POSITIVE_INFINITY;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const matches = generateBracketMatches(bowlerIds, bracketSize);

    // Count duplicate pairings
    let duplicates = 0;
    for (const match of matches) {
      if (
        match.bowler1Id &&
        match.bowler2Id &&
        haveFacedEachOther(match.bowler1Id, match.bowler2Id, previousMatches)
      ) {
        duplicates++;
      }
    }

    if (duplicates < minDuplicates) {
      minDuplicates = duplicates;
      bestMatches = matches;
    }

    if (duplicates === 0) {
      break;
    }
  }

  return bestMatches;
}

/**
 * Advance winner to next round
 */
export function advanceWinner(
  matches: BracketMatch[],
  completedMatchId: string,
  winnerId: string
): BracketMatch[] {
  const updatedMatches = [...matches];
  const completedMatch = updatedMatches.find((m) => m.id === completedMatchId);

  if (!completedMatch) {
    return updatedMatches;
  }

  // Update the completed match
  completedMatch.winnerId = winnerId;

  // Find the next round match
  const nextRound = completedMatch.round + 1;
  const nextPosition = Math.floor(completedMatch.position / 2);
  const isFirstInPair = completedMatch.position % 2 === 0;

  const nextMatch = updatedMatches.find(
    (m) => m.round === nextRound && m.position === nextPosition
  );

  if (nextMatch) {
    if (isFirstInPair) {
      nextMatch.bowler1Id = winnerId;
    } else {
      nextMatch.bowler2Id = winnerId;
    }
  }

  return updatedMatches;
}

export type SeedingMethod = "random" | "by_average" | "by_handicap";

/**
 * Seed bowlers for a bracket based on method
 */
export function seedBowlers(
  bowlers: Bowler[],
  method: SeedingMethod
): Bowler[] {
  switch (method) {
    case "random":
      return shuffleArray(bowlers);
    case "by_average":
      // Higher average = higher seed (top of bracket)
      return [...bowlers].sort((a, b) => b.average - a.average);
    case "by_handicap":
      // Higher handicap = higher seed
      return [...bowlers].sort((a, b) => (b.handicap ?? 0) - (a.handicap ?? 0));
    default:
      return shuffleArray(bowlers);
  }
}
