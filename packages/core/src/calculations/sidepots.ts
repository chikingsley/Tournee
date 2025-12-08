import type { GameScore } from "../types/index.js";
import { shuffleArray } from "./brackets.js";

// ============================================
// HIGH GAME (NASSAU) CALCULATIONS
// ============================================

export type HighGameResult = {
  gameNumber: number;
  winnerId: string;
  winnerScore: number;
  isTie: boolean;
  tiedBowlerIds?: string[];
};

/**
 * Calculate high game winner for a single game
 */
export function calculateHighGameWinner(
  scores: GameScore[],
  gameNumber: number
): HighGameResult {
  const gameScores = scores.filter((s) => s.gameNumber === gameNumber);

  if (gameScores.length === 0) {
    throw new Error(`No scores found for game ${gameNumber}`);
  }

  // Find highest score
  const maxScore = Math.max(...gameScores.map((s) => s.totalScore));
  const winners = gameScores.filter((s) => s.totalScore === maxScore);

  if (winners.length > 1) {
    return {
      gameNumber,
      winnerId: winners[0]?.bowlerId ?? "",
      winnerScore: maxScore,
      isTie: true,
      tiedBowlerIds: winners.map((w) => w.bowlerId),
    };
  }

  return {
    gameNumber,
    winnerId: winners[0]?.bowlerId ?? "",
    winnerScore: maxScore,
    isTie: false,
  };
}

/**
 * Calculate high game winners for all games in an event
 */
export function calculateAllHighGameWinners(
  scores: GameScore[],
  numGames: number
): HighGameResult[] {
  const results: HighGameResult[] = [];

  for (let game = 1; game <= numGames; game++) {
    results.push(calculateHighGameWinner(scores, game));
  }

  return results;
}

// ============================================
// HIGH SERIES CALCULATIONS
// ============================================

export type HighSeriesResult = {
  winnerId: string;
  totalPins: number;
  isTie: boolean;
  tiedBowlerIds?: string[];
};

/**
 * Calculate high series winner (total pins across all games)
 */
export function calculateHighSeriesWinner(
  scores: GameScore[]
): HighSeriesResult {
  // Group scores by bowler
  const bowlerTotals = new Map<string, number>();

  for (const score of scores) {
    const current = bowlerTotals.get(score.bowlerId) ?? 0;
    bowlerTotals.set(score.bowlerId, current + score.totalScore);
  }

  // Find highest total
  let maxTotal = 0;
  const winners: string[] = [];

  for (const [bowlerId, total] of bowlerTotals) {
    if (total > maxTotal) {
      maxTotal = total;
      winners.length = 0;
      winners.push(bowlerId);
    } else if (total === maxTotal) {
      winners.push(bowlerId);
    }
  }

  if (winners.length > 1) {
    return {
      winnerId: winners[0] ?? "",
      totalPins: maxTotal,
      isTie: true,
      tiedBowlerIds: winners,
    };
  }

  return {
    winnerId: winners[0] ?? "",
    totalPins: maxTotal,
    isTie: false,
  };
}

// ============================================
// MYSTERY DOUBLES CALCULATIONS
// ============================================

export type DoublesTeam = {
  bowler1Id: string;
  bowler2Id: string;
  combinedScore: number;
};

/**
 * Generate random mystery doubles pairings
 */
export function generateMysteryDoublesPairings(
  bowlerIds: string[]
): [string, string][] {
  const shuffled = shuffleArray(bowlerIds);
  const pairings: [string, string][] = [];

  for (let i = 0; i < shuffled.length - 1; i += 2) {
    const bowler1 = shuffled[i];
    const bowler2 = shuffled[i + 1];
    if (bowler1 && bowler2) {
      pairings.push([bowler1, bowler2]);
    }
  }

  return pairings;
}

/**
 * Calculate mystery doubles standings
 */
export function calculateDoublesStandings(
  pairings: [string, string][],
  scores: GameScore[]
): DoublesTeam[] {
  const teams: DoublesTeam[] = [];

  // Calculate total for each bowler
  const bowlerTotals = new Map<string, number>();
  for (const score of scores) {
    const current = bowlerTotals.get(score.bowlerId) ?? 0;
    bowlerTotals.set(score.bowlerId, current + score.totalScore);
  }

  for (const [bowler1Id, bowler2Id] of pairings) {
    const score1 = bowlerTotals.get(bowler1Id) ?? 0;
    const score2 = bowlerTotals.get(bowler2Id) ?? 0;

    teams.push({
      bowler1Id,
      bowler2Id,
      combinedScore: score1 + score2,
    });
  }

  // Sort by combined score descending
  return teams.sort((a, b) => b.combinedScore - a.combinedScore);
}

// ============================================
// ELIMINATOR CALCULATIONS
// ============================================

export type EliminatorState = {
  stillIn: string[];
  eliminated: string[];
  cutScore: number;
};

/**
 * Calculate eliminator cut score
 */
export function calculateEliminatorCutScore(
  scores: number[],
  eliminationPercentage = 0.5
): number {
  if (scores.length === 0) {
    return 0;
  }

  const sorted = [...scores].sort((a, b) => b - a);
  const cutIndex = Math.floor(sorted.length * eliminationPercentage);
  return sorted[Math.min(cutIndex, sorted.length - 1)] ?? 0;
}

/**
 * Process eliminator for a single game
 */
export function processEliminatorGame(
  currentlyIn: string[],
  gameScores: GameScore[],
  eliminationPercentage = 0.5
): EliminatorState {
  // Get scores for bowlers still in
  const relevantScores = gameScores.filter((s) =>
    currentlyIn.includes(s.bowlerId)
  );

  if (relevantScores.length === 0) {
    return {
      stillIn: currentlyIn,
      eliminated: [],
      cutScore: 0,
    };
  }

  const scores = relevantScores.map((s) => s.totalScore);
  const cutScore = calculateEliminatorCutScore(scores, eliminationPercentage);

  const stillIn: string[] = [];
  const eliminated: string[] = [];

  for (const score of relevantScores) {
    if (score.totalScore >= cutScore) {
      stillIn.push(score.bowlerId);
    } else {
      eliminated.push(score.bowlerId);
    }
  }

  return {
    stillIn,
    eliminated,
    cutScore,
  };
}

/**
 * Run full eliminator across all games
 */
export function runFullEliminator(
  bowlerIds: string[],
  allScores: GameScore[],
  numGames: number,
  eliminationPercentage = 0.5
): EliminatorState[] {
  const results: EliminatorState[] = [];
  let currentlyIn = [...bowlerIds];

  for (let game = 1; game <= numGames; game++) {
    const gameScores = allScores.filter((s) => s.gameNumber === game);
    const result = processEliminatorGame(
      currentlyIn,
      gameScores,
      eliminationPercentage
    );
    results.push(result);
    currentlyIn = result.stillIn;
  }

  return results;
}

// ============================================
// SWEEPER CALCULATIONS
// ============================================

export type SweeperStanding = {
  bowlerId: string;
  totalPins: number;
  position: number;
};

/**
 * Calculate sweeper standings (simple total pins competition)
 */
export function calculateSweeperStandings(
  scores: GameScore[]
): SweeperStanding[] {
  // Group scores by bowler
  const bowlerTotals = new Map<string, number>();

  for (const score of scores) {
    const current = bowlerTotals.get(score.bowlerId) ?? 0;
    bowlerTotals.set(score.bowlerId, current + score.totalScore);
  }

  // Convert to array and sort
  const standings: SweeperStanding[] = [];

  for (const [bowlerId, totalPins] of bowlerTotals) {
    standings.push({ bowlerId, totalPins, position: 0 });
  }

  standings.sort((a, b) => b.totalPins - a.totalPins);

  // Assign positions (handle ties)
  let currentPosition = 1;
  for (let i = 0; i < standings.length; i++) {
    const standing = standings[i];
    if (!standing) {
      continue;
    }

    if (i > 0 && standings[i - 1]?.totalPins === standing.totalPins) {
      standing.position = standings[i - 1]?.position ?? currentPosition;
    } else {
      standing.position = currentPosition;
    }
    currentPosition++;
  }

  return standings;
}

// ============================================
// LOVE DOUBLES (PICK YOUR PARTNER)
// ============================================

/**
 * Calculate love doubles standings (pre-selected partners)
 */
export function calculateLoveDoublesStandings(
  teams: Array<{ bowler1Id: string; bowler2Id: string }>,
  scores: GameScore[]
): DoublesTeam[] {
  const bowlerTotals = new Map<string, number>();

  for (const score of scores) {
    const current = bowlerTotals.get(score.bowlerId) ?? 0;
    bowlerTotals.set(score.bowlerId, current + score.totalScore);
  }

  const results: DoublesTeam[] = teams.map((team) => ({
    bowler1Id: team.bowler1Id,
    bowler2Id: team.bowler2Id,
    combinedScore:
      (bowlerTotals.get(team.bowler1Id) ?? 0) +
      (bowlerTotals.get(team.bowler2Id) ?? 0),
  }));

  return results.sort((a, b) => b.combinedScore - a.combinedScore);
}
