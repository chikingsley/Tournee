import { describe, expect, it } from "vitest";
import type { GameScore } from "../types/index.js";
import {
  calculateAllHighGameWinners,
  calculateDoublesStandings,
  calculateEliminatorCutScore,
  calculateHighGameWinner,
  calculateHighSeriesWinner,
  calculateLoveDoublesStandings,
  calculateSweeperStandings,
  generateMysteryDoublesPairings,
  processEliminatorGame,
  runFullEliminator,
} from "./sidepots.js";

describe("calculateHighGameWinner", () => {
  it("should find the high game winner", () => {
    const scores: GameScore[] = [
      {
        bowlerId: "b1",
        eventId: "e1",
        gameNumber: 1,
        pinsKnocked: 200,
        handicap: 20,
        totalScore: 220,
      },
      {
        bowlerId: "b2",
        eventId: "e1",
        gameNumber: 1,
        pinsKnocked: 180,
        handicap: 40,
        totalScore: 220,
      },
      {
        bowlerId: "b3",
        eventId: "e1",
        gameNumber: 1,
        pinsKnocked: 210,
        handicap: 10,
        totalScore: 220,
      },
    ];
    const result = calculateHighGameWinner(scores, 1);
    // All tied at 220
    expect(result.winnerScore).toBe(220);
    expect(result.isTie).toBe(true);
    expect(result.tiedBowlerIds).toHaveLength(3);
  });

  it("should identify single winner", () => {
    const scores: GameScore[] = [
      {
        bowlerId: "b1",
        eventId: "e1",
        gameNumber: 1,
        pinsKnocked: 250,
        handicap: 0,
        totalScore: 250,
      },
      {
        bowlerId: "b2",
        eventId: "e1",
        gameNumber: 1,
        pinsKnocked: 180,
        handicap: 40,
        totalScore: 220,
      },
    ];
    const result = calculateHighGameWinner(scores, 1);
    expect(result.winnerId).toBe("b1");
    expect(result.winnerScore).toBe(250);
    expect(result.isTie).toBe(false);
  });
});

describe("calculateAllHighGameWinners", () => {
  it("should calculate winners for all games", () => {
    const scores: GameScore[] = [
      {
        bowlerId: "b1",
        eventId: "e1",
        gameNumber: 1,
        pinsKnocked: 200,
        handicap: 0,
        totalScore: 200,
      },
      {
        bowlerId: "b2",
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
        pinsKnocked: 150,
        handicap: 0,
        totalScore: 150,
      },
      {
        bowlerId: "b2",
        eventId: "e1",
        gameNumber: 2,
        pinsKnocked: 220,
        handicap: 0,
        totalScore: 220,
      },
      {
        bowlerId: "b1",
        eventId: "e1",
        gameNumber: 3,
        pinsKnocked: 190,
        handicap: 0,
        totalScore: 190,
      },
      {
        bowlerId: "b2",
        eventId: "e1",
        gameNumber: 3,
        pinsKnocked: 190,
        handicap: 0,
        totalScore: 190,
      },
    ];
    const results = calculateAllHighGameWinners(scores, 3);
    expect(results).toHaveLength(3);
    expect(results[0]?.winnerId).toBe("b1"); // Game 1
    expect(results[1]?.winnerId).toBe("b2"); // Game 2
    expect(results[2]?.isTie).toBe(true); // Game 3 tie
  });
});

describe("calculateHighSeriesWinner", () => {
  it("should calculate total pins winner", () => {
    const scores: GameScore[] = [
      {
        bowlerId: "b1",
        eventId: "e1",
        gameNumber: 1,
        pinsKnocked: 200,
        handicap: 0,
        totalScore: 200,
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
        pinsKnocked: 200,
        handicap: 0,
        totalScore: 200,
      },
      {
        bowlerId: "b2",
        eventId: "e1",
        gameNumber: 1,
        pinsKnocked: 220,
        handicap: 0,
        totalScore: 220,
      },
      {
        bowlerId: "b2",
        eventId: "e1",
        gameNumber: 2,
        pinsKnocked: 180,
        handicap: 0,
        totalScore: 180,
      },
      {
        bowlerId: "b2",
        eventId: "e1",
        gameNumber: 3,
        pinsKnocked: 190,
        handicap: 0,
        totalScore: 190,
      },
    ];
    const result = calculateHighSeriesWinner(scores);
    expect(result.winnerId).toBe("b1");
    expect(result.totalPins).toBe(600);
    expect(result.isTie).toBe(false);
  });
});

describe("generateMysteryDoublesPairings", () => {
  it("should pair all bowlers", () => {
    const bowlers = ["b1", "b2", "b3", "b4"];
    const pairings = generateMysteryDoublesPairings(bowlers);
    expect(pairings).toHaveLength(2);
  });

  it("should handle odd number of bowlers", () => {
    const bowlers = ["b1", "b2", "b3", "b4", "b5"];
    const pairings = generateMysteryDoublesPairings(bowlers);
    expect(pairings).toHaveLength(2); // One bowler left out
  });

  it("should not have any bowler in multiple pairings", () => {
    const bowlers = ["b1", "b2", "b3", "b4", "b5", "b6"];
    const pairings = generateMysteryDoublesPairings(bowlers);
    const allBowlers = pairings.flat();
    const uniqueBowlers = new Set(allBowlers);
    expect(allBowlers.length).toBe(uniqueBowlers.size);
  });
});

describe("calculateDoublesStandings", () => {
  it("should rank teams by combined score", () => {
    const pairings: [string, string][] = [
      ["b1", "b2"],
      ["b3", "b4"],
    ];
    const scores: GameScore[] = [
      {
        bowlerId: "b1",
        eventId: "e1",
        gameNumber: 1,
        pinsKnocked: 200,
        handicap: 0,
        totalScore: 200,
      },
      {
        bowlerId: "b2",
        eventId: "e1",
        gameNumber: 1,
        pinsKnocked: 180,
        handicap: 0,
        totalScore: 180,
      },
      {
        bowlerId: "b3",
        eventId: "e1",
        gameNumber: 1,
        pinsKnocked: 220,
        handicap: 0,
        totalScore: 220,
      },
      {
        bowlerId: "b4",
        eventId: "e1",
        gameNumber: 1,
        pinsKnocked: 190,
        handicap: 0,
        totalScore: 190,
      },
    ];
    const standings = calculateDoublesStandings(pairings, scores);
    expect(standings[0]?.combinedScore).toBe(410); // b3+b4
    expect(standings[1]?.combinedScore).toBe(380); // b1+b2
  });
});

describe("calculateEliminatorCutScore", () => {
  it("should calculate 50% cut correctly", () => {
    const scores = [200, 180, 160, 140];
    const cut = calculateEliminatorCutScore(scores, 0.5);
    // 50% elimination means cutIndex = 2, so cut score is 160
    // Anyone scoring >= 160 stays in
    expect(cut).toBe(160);
  });

  it("should handle empty array", () => {
    const cut = calculateEliminatorCutScore([], 0.5);
    expect(cut).toBe(0);
  });
});

describe("processEliminatorGame", () => {
  it("should eliminate those below cut score", () => {
    const currentlyIn = ["b1", "b2", "b3", "b4"];
    const gameScores: GameScore[] = [
      {
        bowlerId: "b1",
        eventId: "e1",
        gameNumber: 1,
        pinsKnocked: 200,
        handicap: 0,
        totalScore: 200,
      },
      {
        bowlerId: "b2",
        eventId: "e1",
        gameNumber: 1,
        pinsKnocked: 180,
        handicap: 0,
        totalScore: 180,
      },
      {
        bowlerId: "b3",
        eventId: "e1",
        gameNumber: 1,
        pinsKnocked: 160,
        handicap: 0,
        totalScore: 160,
      },
      {
        bowlerId: "b4",
        eventId: "e1",
        gameNumber: 1,
        pinsKnocked: 140,
        handicap: 0,
        totalScore: 140,
      },
    ];
    const result = processEliminatorGame(currentlyIn, gameScores, 0.5);
    // Cut score = 160, so b1, b2, b3 stay (>= 160), b4 eliminated (< 160)
    expect(result.stillIn).toContain("b1");
    expect(result.stillIn).toContain("b2");
    expect(result.stillIn).toContain("b3");
    expect(result.eliminated).toContain("b4");
    expect(result.cutScore).toBe(160);
  });
});

describe("runFullEliminator", () => {
  it("should run eliminator across multiple games", () => {
    const bowlerIds = ["b1", "b2", "b3", "b4"];
    const allScores: GameScore[] = [
      // Game 1: cut at 160, b4 eliminated
      {
        bowlerId: "b1",
        eventId: "e1",
        gameNumber: 1,
        pinsKnocked: 200,
        handicap: 0,
        totalScore: 200,
      },
      {
        bowlerId: "b2",
        eventId: "e1",
        gameNumber: 1,
        pinsKnocked: 180,
        handicap: 0,
        totalScore: 180,
      },
      {
        bowlerId: "b3",
        eventId: "e1",
        gameNumber: 1,
        pinsKnocked: 160,
        handicap: 0,
        totalScore: 160,
      },
      {
        bowlerId: "b4",
        eventId: "e1",
        gameNumber: 1,
        pinsKnocked: 140,
        handicap: 0,
        totalScore: 140,
      },
      // Game 2: b1, b2, b3 still in, cut at b2's score, b3 eliminated
      {
        bowlerId: "b1",
        eventId: "e1",
        gameNumber: 2,
        pinsKnocked: 200,
        handicap: 0,
        totalScore: 200,
      },
      {
        bowlerId: "b2",
        eventId: "e1",
        gameNumber: 2,
        pinsKnocked: 180,
        handicap: 0,
        totalScore: 180,
      },
      {
        bowlerId: "b3",
        eventId: "e1",
        gameNumber: 2,
        pinsKnocked: 150,
        handicap: 0,
        totalScore: 150,
      },
    ];
    const results = runFullEliminator(bowlerIds, allScores, 2, 0.5);
    expect(results).toHaveLength(2);
    // Game 1: 4 bowlers, cut at 160, b1/b2/b3 stay
    expect(results[0]?.stillIn).toHaveLength(3);
    expect(results[0]?.eliminated).toContain("b4");
    // Game 2: 3 bowlers, cut at 180 (index 1), b1/b2 stay
    expect(results[1]?.stillIn).toHaveLength(2);
    expect(results[1]?.stillIn).toContain("b1");
    expect(results[1]?.stillIn).toContain("b2");
  });
});

describe("calculateSweeperStandings", () => {
  it("should rank by total pins with correct positions", () => {
    const scores: GameScore[] = [
      {
        bowlerId: "b1",
        eventId: "e1",
        gameNumber: 1,
        pinsKnocked: 200,
        handicap: 0,
        totalScore: 200,
      },
      {
        bowlerId: "b2",
        eventId: "e1",
        gameNumber: 1,
        pinsKnocked: 220,
        handicap: 0,
        totalScore: 220,
      },
      {
        bowlerId: "b3",
        eventId: "e1",
        gameNumber: 1,
        pinsKnocked: 180,
        handicap: 0,
        totalScore: 180,
      },
    ];
    const standings = calculateSweeperStandings(scores);
    expect(standings[0]?.bowlerId).toBe("b2");
    expect(standings[0]?.position).toBe(1);
    expect(standings[1]?.bowlerId).toBe("b1");
    expect(standings[1]?.position).toBe(2);
  });

  it("should handle ties", () => {
    const scores: GameScore[] = [
      {
        bowlerId: "b1",
        eventId: "e1",
        gameNumber: 1,
        pinsKnocked: 200,
        handicap: 0,
        totalScore: 200,
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
    const standings = calculateSweeperStandings(scores);
    expect(standings[0]?.position).toBe(1);
    expect(standings[1]?.position).toBe(1); // Same position for tie
  });
});

describe("calculateLoveDoublesStandings", () => {
  it("should calculate standings for pre-selected teams", () => {
    const teams = [
      { bowler1Id: "b1", bowler2Id: "b2" },
      { bowler1Id: "b3", bowler2Id: "b4" },
    ];
    const scores: GameScore[] = [
      {
        bowlerId: "b1",
        eventId: "e1",
        gameNumber: 1,
        pinsKnocked: 200,
        handicap: 0,
        totalScore: 200,
      },
      {
        bowlerId: "b2",
        eventId: "e1",
        gameNumber: 1,
        pinsKnocked: 200,
        handicap: 0,
        totalScore: 200,
      },
      {
        bowlerId: "b3",
        eventId: "e1",
        gameNumber: 1,
        pinsKnocked: 180,
        handicap: 0,
        totalScore: 180,
      },
      {
        bowlerId: "b4",
        eventId: "e1",
        gameNumber: 1,
        pinsKnocked: 180,
        handicap: 0,
        totalScore: 180,
      },
    ];
    const standings = calculateLoveDoublesStandings(teams, scores);
    expect(standings[0]?.combinedScore).toBe(400);
    expect(standings[1]?.combinedScore).toBe(360);
  });
});
