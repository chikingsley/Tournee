import type { Bowler, GameScore } from "../types/index.js";

// ============================================
// HANDICAP CALCULATIONS
// ============================================

export type HandicapConfig = {
  base: number; // e.g., 220
  percentage: number; // e.g., 0.9 for 90%
  maxHandicap?: number; // Optional cap
};

export const DEFAULT_HANDICAP_CONFIG: HandicapConfig = {
  base: 220,
  percentage: 0.9,
};

/**
 * Calculate handicap for a bowler
 * Formula: (base - average) * percentage
 */
export function calculateHandicap(
  average: number,
  config: HandicapConfig = DEFAULT_HANDICAP_CONFIG
): number {
  if (average >= config.base) {
    return 0;
  }

  let handicap = Math.floor((config.base - average) * config.percentage);

  if (config.maxHandicap !== undefined) {
    handicap = Math.min(handicap, config.maxHandicap);
  }

  return Math.max(0, handicap);
}

/**
 * Calculate total score with handicap
 */
export function calculateTotalScore(
  pinsKnocked: number,
  handicap: number
): number {
  return pinsKnocked + handicap;
}

/**
 * Apply handicap to a bowler
 */
export function applyHandicap(
  bowler: Bowler,
  config: HandicapConfig = DEFAULT_HANDICAP_CONFIG
): Bowler {
  return {
    ...bowler,
    handicap: calculateHandicap(bowler.average, config),
  };
}

/**
 * Apply handicap to all bowlers
 */
export function applyHandicapToAll(
  bowlers: Bowler[],
  config: HandicapConfig = DEFAULT_HANDICAP_CONFIG
): Bowler[] {
  return bowlers.map((b) => applyHandicap(b, config));
}

// ============================================
// SCORE VALIDATION
// ============================================

/**
 * Validate a bowling score
 */
export function isValidScore(score: number): boolean {
  return Number.isInteger(score) && score >= 0 && score <= 300;
}

/**
 * Validate a game score object
 */
export function validateGameScore(score: GameScore): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!isValidScore(score.pinsKnocked)) {
    errors.push(`Invalid pins knocked: ${score.pinsKnocked} (must be 0-300)`);
  }

  if (score.handicap < 0) {
    errors.push(`Invalid handicap: ${score.handicap} (must be >= 0)`);
  }

  if (score.gameNumber < 1) {
    errors.push(`Invalid game number: ${score.gameNumber} (must be >= 1)`);
  }

  const expectedTotal = score.pinsKnocked + score.handicap;
  if (score.totalScore !== expectedTotal) {
    errors.push(
      `Total score mismatch: got ${score.totalScore}, expected ${expectedTotal}`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================
// STATISTICS CALCULATIONS
// ============================================

export type BowlerStats = {
  bowlerId: string;
  gamesPlayed: number;
  totalPins: number;
  average: number;
  highGame: number;
  lowGame: number;
  highSeries?: number;
};

/**
 * Calculate statistics for a bowler from their scores
 */
export function calculateBowlerStats(
  bowlerId: string,
  scores: GameScore[]
): BowlerStats {
  const bowlerScores = scores.filter((s) => s.bowlerId === bowlerId);

  if (bowlerScores.length === 0) {
    return {
      bowlerId,
      gamesPlayed: 0,
      totalPins: 0,
      average: 0,
      highGame: 0,
      lowGame: 0,
    };
  }

  const pins = bowlerScores.map((s) => s.pinsKnocked);
  const totalPins = pins.reduce((sum, p) => sum + p, 0);

  return {
    bowlerId,
    gamesPlayed: bowlerScores.length,
    totalPins,
    average: Math.round(totalPins / bowlerScores.length),
    highGame: Math.max(...pins),
    lowGame: Math.min(...pins),
    highSeries: totalPins, // For now, series = all games
  };
}

/**
 * Calculate statistics for all bowlers
 */
export function calculateAllBowlerStats(
  scores: GameScore[]
): Map<string, BowlerStats> {
  const bowlerIds = [...new Set(scores.map((s) => s.bowlerId))];
  const stats = new Map<string, BowlerStats>();

  for (const bowlerId of bowlerIds) {
    stats.set(bowlerId, calculateBowlerStats(bowlerId, scores));
  }

  return stats;
}

// ============================================
// AVERAGE RECALCULATION
// ============================================

/**
 * Calculate new average based on existing average and new games
 */
export function recalculateAverage(
  currentAverage: number,
  currentGames: number,
  newScores: number[]
): number {
  if (newScores.length === 0) {
    return currentAverage;
  }

  const currentTotalPins = currentAverage * currentGames;
  const newTotalPins = newScores.reduce((sum, s) => sum + s, 0);
  const totalGames = currentGames + newScores.length;

  return Math.round((currentTotalPins + newTotalPins) / totalGames);
}

/**
 * Create a game score object
 */
export function createGameScore(
  bowlerId: string,
  eventId: string,
  gameNumber: number,
  pinsKnocked: number,
  handicap: number
): GameScore {
  return {
    bowlerId,
    eventId,
    gameNumber,
    pinsKnocked,
    handicap,
    totalScore: pinsKnocked + handicap,
  };
}
