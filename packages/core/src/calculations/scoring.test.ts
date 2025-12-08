import { describe, expect, it } from "vitest";
import type { Bowler, GameScore } from "../types/index.js";
import {
  applyHandicap,
  applyHandicapToAll,
  calculateAllBowlerStats,
  calculateBowlerStats,
  calculateHandicap,
  calculateTotalScore,
  createGameScore,
  isValidScore,
  recalculateAverage,
  validateGameScore,
} from "./scoring.js";

describe("calculateHandicap", () => {
  it("should calculate handicap with default config", () => {
    // (220 - 180) * 0.9 = 36
    expect(calculateHandicap(180)).toBe(36);
  });

  it("should return 0 for average at or above base", () => {
    expect(calculateHandicap(220)).toBe(0);
    expect(calculateHandicap(230)).toBe(0);
  });

  it("should use custom config", () => {
    // (230 - 200) * 0.8 = 24
    expect(calculateHandicap(200, { base: 230, percentage: 0.8 })).toBe(24);
  });

  it("should respect max handicap cap", () => {
    // (220 - 100) * 0.9 = 108, but capped at 50
    expect(
      calculateHandicap(100, { base: 220, percentage: 0.9, maxHandicap: 50 })
    ).toBe(50);
  });

  it("should floor the result", () => {
    // (220 - 185) * 0.9 = 31.5 -> 31
    expect(calculateHandicap(185)).toBe(31);
  });
});

describe("calculateTotalScore", () => {
  it("should add pins and handicap", () => {
    expect(calculateTotalScore(180, 36)).toBe(216);
    expect(calculateTotalScore(200, 0)).toBe(200);
  });
});

describe("applyHandicap", () => {
  it("should add handicap to bowler", () => {
    const bowler: Bowler = { id: "b1", name: "Test", average: 180 };
    const result = applyHandicap(bowler);
    expect(result.handicap).toBe(36);
  });
});

describe("applyHandicapToAll", () => {
  it("should apply handicap to all bowlers", () => {
    const bowlers: Bowler[] = [
      { id: "b1", name: "Alice", average: 180 },
      { id: "b2", name: "Bob", average: 200 },
      { id: "b3", name: "Charlie", average: 160 },
    ];
    const result = applyHandicapToAll(bowlers);
    expect(result[0]?.handicap).toBe(36); // (220-180)*0.9
    expect(result[1]?.handicap).toBe(18); // (220-200)*0.9
    expect(result[2]?.handicap).toBe(54); // (220-160)*0.9
  });
});

describe("isValidScore", () => {
  it("should accept valid scores", () => {
    expect(isValidScore(0)).toBe(true);
    expect(isValidScore(150)).toBe(true);
    expect(isValidScore(300)).toBe(true);
  });

  it("should reject invalid scores", () => {
    expect(isValidScore(-1)).toBe(false);
    expect(isValidScore(301)).toBe(false);
    expect(isValidScore(1.5)).toBe(false);
  });
});

describe("validateGameScore", () => {
  it("should validate correct game score", () => {
    const score: GameScore = {
      bowlerId: "b1",
      eventId: "e1",
      gameNumber: 1,
      pinsKnocked: 180,
      handicap: 36,
      totalScore: 216,
    };
    const result = validateGameScore(score);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should catch invalid pins", () => {
    const score: GameScore = {
      bowlerId: "b1",
      eventId: "e1",
      gameNumber: 1,
      pinsKnocked: 350, // Invalid
      handicap: 36,
      totalScore: 386,
    };
    const result = validateGameScore(score);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("should catch mismatched total", () => {
    const score: GameScore = {
      bowlerId: "b1",
      eventId: "e1",
      gameNumber: 1,
      pinsKnocked: 180,
      handicap: 36,
      totalScore: 200, // Wrong!
    };
    const result = validateGameScore(score);
    expect(result.valid).toBe(false);
  });
});

describe("calculateBowlerStats", () => {
  it("should calculate stats from scores", () => {
    const scores: GameScore[] = [
      {
        bowlerId: "b1",
        eventId: "e1",
        gameNumber: 1,
        pinsKnocked: 180,
        handicap: 0,
        totalScore: 180,
      },
      {
        bowlerId: "b1",
        eventId: "e1",
        gameNumber: 2,
        pinsKnocked: 200,
        handicap: 0,
        totalScore: 200,
      },
      {
        bowlerId: "b1",
        eventId: "e1",
        gameNumber: 3,
        pinsKnocked: 160,
        handicap: 0,
        totalScore: 160,
      },
    ];
    const stats = calculateBowlerStats("b1", scores);
    expect(stats.gamesPlayed).toBe(3);
    expect(stats.totalPins).toBe(540);
    expect(stats.average).toBe(180);
    expect(stats.highGame).toBe(200);
    expect(stats.lowGame).toBe(160);
  });

  it("should handle no scores", () => {
    const stats = calculateBowlerStats("b1", []);
    expect(stats.gamesPlayed).toBe(0);
    expect(stats.average).toBe(0);
  });
});

describe("calculateAllBowlerStats", () => {
  it("should calculate stats for all bowlers", () => {
    const scores: GameScore[] = [
      {
        bowlerId: "b1",
        eventId: "e1",
        gameNumber: 1,
        pinsKnocked: 180,
        handicap: 0,
        totalScore: 180,
      },
      {
        bowlerId: "b2",
        eventId: "e1",
        gameNumber: 1,
        pinsKnocked: 200,
        handicap: 0,
        totalScore: 200,
      },
    ];
    const stats = calculateAllBowlerStats(scores);
    expect(stats.size).toBe(2);
    expect(stats.get("b1")?.average).toBe(180);
    expect(stats.get("b2")?.average).toBe(200);
  });
});

describe("recalculateAverage", () => {
  it("should recalculate average with new games", () => {
    // Current: 180 avg over 10 games = 1800 pins
    // New: 200, 220 = 420 pins over 2 games
    // Total: 2220 over 12 games = 185
    const newAvg = recalculateAverage(180, 10, [200, 220]);
    expect(newAvg).toBe(185);
  });

  it("should return current average if no new scores", () => {
    expect(recalculateAverage(180, 10, [])).toBe(180);
  });
});

describe("createGameScore", () => {
  it("should create valid game score object", () => {
    const score = createGameScore("b1", "e1", 1, 180, 36);
    expect(score.bowlerId).toBe("b1");
    expect(score.eventId).toBe("e1");
    expect(score.gameNumber).toBe(1);
    expect(score.pinsKnocked).toBe(180);
    expect(score.handicap).toBe(36);
    expect(score.totalScore).toBe(216);
  });
});
