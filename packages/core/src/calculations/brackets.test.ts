import { describe, expect, it } from "vitest";
import type { Bowler, BracketMatch } from "../types/index.js";
import {
  advanceWinner,
  calculateByes,
  calculateRounds,
  determineMatchWinner,
  generateBracketMatches,
  getStillAlive,
  haveFacedEachOther,
  seedBowlers,
  shuffleArray,
} from "./brackets.js";

describe("shuffleArray", () => {
  it("should return array of same length", () => {
    const arr = [1, 2, 3, 4, 5];
    const shuffled = shuffleArray(arr);
    expect(shuffled).toHaveLength(5);
  });

  it("should contain same elements", () => {
    const arr = [1, 2, 3, 4, 5];
    const shuffled = shuffleArray(arr);
    expect(shuffled.sort()).toEqual(arr.sort());
  });

  it("should not mutate original array", () => {
    const arr = [1, 2, 3, 4, 5];
    const original = [...arr];
    shuffleArray(arr);
    expect(arr).toEqual(original);
  });
});

describe("calculateRounds", () => {
  it("should calculate correct rounds for power of 2", () => {
    expect(calculateRounds(4)).toBe(2);
    expect(calculateRounds(8)).toBe(3);
    expect(calculateRounds(16)).toBe(4);
    expect(calculateRounds(32)).toBe(5);
    expect(calculateRounds(64)).toBe(6);
  });

  it("should round up for non-power of 2", () => {
    expect(calculateRounds(12)).toBe(4); // Rounds up to 16
    expect(calculateRounds(5)).toBe(3); // Rounds up to 8
  });
});

describe("calculateByes", () => {
  it("should return 0 for full bracket", () => {
    expect(calculateByes(8, 8)).toBe(0);
    expect(calculateByes(16, 16)).toBe(0);
  });

  it("should calculate BYEs for partial bracket", () => {
    expect(calculateByes(6, 8)).toBe(2);
    expect(calculateByes(12, 16)).toBe(4);
  });
});

describe("generateBracketMatches", () => {
  it("should generate correct number of matches for 8-person bracket", () => {
    const bowlers = ["b1", "b2", "b3", "b4", "b5", "b6", "b7", "b8"];
    const matches = generateBracketMatches(bowlers, 8);
    // 8-person bracket: 4 + 2 + 1 = 7 matches
    expect(matches).toHaveLength(7);
  });

  it("should generate correct number of matches for 4-person bracket", () => {
    const bowlers = ["b1", "b2", "b3", "b4"];
    const matches = generateBracketMatches(bowlers, 4);
    // 4-person bracket: 2 + 1 = 3 matches
    expect(matches).toHaveLength(3);
  });

  it("should handle 12-person bracket with BYEs", () => {
    const bowlers = Array.from({ length: 12 }, (_, i) => `b${i + 1}`);
    const matches = generateBracketMatches(bowlers, 12);
    // 12 -> 16 effective size: 8 + 4 + 2 + 1 = 15 matches
    expect(matches).toHaveLength(15);
  });

  it("should have all first round matches with bowler IDs or BYEs", () => {
    const bowlers = ["b1", "b2", "b3", "b4", "b5", "b6", "b7", "b8"];
    const matches = generateBracketMatches(bowlers, 8);
    const firstRound = matches.filter((m) => m.round === 1);

    expect(firstRound).toHaveLength(4);
    firstRound.forEach((match) => {
      expect(match.bowler1Id !== null || match.bowler2Id !== null).toBe(true);
    });
  });

  it("should auto-advance BYE matches", () => {
    const bowlers = ["b1", "b2", "b3", "b4", "b5", "b6"]; // 6 bowlers in 8-bracket = 2 BYEs
    const matches = generateBracketMatches(bowlers, 8);
    const firstRound = matches.filter((m) => m.round === 1);

    // With 6 bowlers in 8 slots, there should be 2 BYE positions
    // Each BYE match should have winner = the non-null bowler
    const byeMatches = firstRound.filter(
      (m) => m.bowler1Id === null || m.bowler2Id === null
    );

    // There should be some BYE matches
    expect(byeMatches.length).toBeGreaterThan(0);

    // Each BYE match should have the present bowler as winner
    byeMatches.forEach((match) => {
      if (match.bowler1Id === null && match.bowler2Id !== null) {
        expect(match.winnerId).toBe(match.bowler2Id);
      } else if (match.bowler2Id === null && match.bowler1Id !== null) {
        expect(match.winnerId).toBe(match.bowler1Id);
      }
    });
  });
});

describe("determineMatchWinner", () => {
  it("should return bowler1 when they have higher score", () => {
    const match: BracketMatch = {
      id: "m1",
      round: 1,
      position: 0,
      bowler1Id: "b1",
      bowler2Id: "b2",
      bowler1Score: 200,
      bowler2Score: 180,
      winnerId: null,
    };
    expect(determineMatchWinner(match)).toBe("b1");
  });

  it("should return bowler2 when they have higher score", () => {
    const match: BracketMatch = {
      id: "m1",
      round: 1,
      position: 0,
      bowler1Id: "b1",
      bowler2Id: "b2",
      bowler1Score: 180,
      bowler2Score: 200,
      winnerId: null,
    };
    expect(determineMatchWinner(match)).toBe("b2");
  });

  it("should return null for tie", () => {
    const match: BracketMatch = {
      id: "m1",
      round: 1,
      position: 0,
      bowler1Id: "b1",
      bowler2Id: "b2",
      bowler1Score: 200,
      bowler2Score: 200,
      winnerId: null,
    };
    expect(determineMatchWinner(match)).toBeNull();
  });

  it("should handle BYE (bowler1 null)", () => {
    const match: BracketMatch = {
      id: "m1",
      round: 1,
      position: 0,
      bowler1Id: null,
      bowler2Id: "b2",
      bowler1Score: null,
      bowler2Score: null,
      winnerId: null,
    };
    expect(determineMatchWinner(match)).toBe("b2");
  });

  it("should handle BYE (bowler2 null)", () => {
    const match: BracketMatch = {
      id: "m1",
      round: 1,
      position: 0,
      bowler1Id: "b1",
      bowler2Id: null,
      bowler1Score: null,
      bowler2Score: null,
      winnerId: null,
    };
    expect(determineMatchWinner(match)).toBe("b1");
  });
});

describe("getStillAlive", () => {
  it("should return all bowlers when no matches completed", () => {
    const matches: BracketMatch[] = [
      {
        id: "m1",
        round: 1,
        position: 0,
        bowler1Id: "b1",
        bowler2Id: "b2",
        bowler1Score: null,
        bowler2Score: null,
        winnerId: null,
      },
    ];
    const alive = getStillAlive(matches, ["b1", "b2"]);
    expect(alive).toEqual(["b1", "b2"]);
  });

  it("should exclude eliminated bowlers", () => {
    const matches: BracketMatch[] = [
      {
        id: "m1",
        round: 1,
        position: 0,
        bowler1Id: "b1",
        bowler2Id: "b2",
        bowler1Score: 200,
        bowler2Score: 180,
        winnerId: "b1",
      },
    ];
    const alive = getStillAlive(matches, ["b1", "b2"]);
    expect(alive).toEqual(["b1"]);
    expect(alive).not.toContain("b2");
  });

  it("should track multiple eliminations", () => {
    const matches: BracketMatch[] = [
      {
        id: "m1",
        round: 1,
        position: 0,
        bowler1Id: "b1",
        bowler2Id: "b2",
        bowler1Score: 200,
        bowler2Score: 180,
        winnerId: "b1",
      },
      {
        id: "m2",
        round: 1,
        position: 1,
        bowler1Id: "b3",
        bowler2Id: "b4",
        bowler1Score: 190,
        bowler2Score: 210,
        winnerId: "b4",
      },
    ];
    const alive = getStillAlive(matches, ["b1", "b2", "b3", "b4"]);
    expect(alive).toEqual(["b1", "b4"]);
  });
});

describe("haveFacedEachOther", () => {
  it("should return true when bowlers have faced each other", () => {
    const matches: BracketMatch[] = [
      {
        id: "m1",
        round: 1,
        position: 0,
        bowler1Id: "b1",
        bowler2Id: "b2",
        bowler1Score: 200,
        bowler2Score: 180,
        winnerId: "b1",
      },
    ];
    expect(haveFacedEachOther("b1", "b2", matches)).toBe(true);
    expect(haveFacedEachOther("b2", "b1", matches)).toBe(true);
  });

  it("should return false when bowlers have not faced each other", () => {
    const matches: BracketMatch[] = [
      {
        id: "m1",
        round: 1,
        position: 0,
        bowler1Id: "b1",
        bowler2Id: "b2",
        bowler1Score: 200,
        bowler2Score: 180,
        winnerId: "b1",
      },
    ];
    expect(haveFacedEachOther("b1", "b3", matches)).toBe(false);
    expect(haveFacedEachOther("b3", "b4", matches)).toBe(false);
  });
});

describe("seedBowlers", () => {
  const bowlers: Bowler[] = [
    { id: "b1", name: "Alice", average: 180, handicap: 36 },
    { id: "b2", name: "Bob", average: 200, handicap: 18 },
    { id: "b3", name: "Charlie", average: 160, handicap: 54 },
  ];

  it("should sort by average descending when using by_average", () => {
    const seeded = seedBowlers(bowlers, "by_average");
    expect(seeded[0]?.id).toBe("b2"); // Highest average
    expect(seeded[2]?.id).toBe("b3"); // Lowest average
  });

  it("should sort by handicap descending when using by_handicap", () => {
    const seeded = seedBowlers(bowlers, "by_handicap");
    expect(seeded[0]?.id).toBe("b3"); // Highest handicap
    expect(seeded[2]?.id).toBe("b2"); // Lowest handicap
  });

  it("should shuffle when using random", () => {
    const seeded = seedBowlers(bowlers, "random");
    expect(seeded).toHaveLength(3);
    // Can't test randomness deterministically, just check all present
    expect(seeded.map((b) => b.id).sort()).toEqual(["b1", "b2", "b3"]);
  });
});

describe("advanceWinner", () => {
  it("should set winner in next round match", () => {
    const matches: BracketMatch[] = [
      {
        id: "m1",
        round: 1,
        position: 0,
        bowler1Id: "b1",
        bowler2Id: "b2",
        bowler1Score: 200,
        bowler2Score: 180,
        winnerId: null,
      },
      {
        id: "m2",
        round: 1,
        position: 1,
        bowler1Id: "b3",
        bowler2Id: "b4",
        bowler1Score: null,
        bowler2Score: null,
        winnerId: null,
      },
      {
        id: "m3",
        round: 2,
        position: 0,
        bowler1Id: null,
        bowler2Id: null,
        bowler1Score: null,
        bowler2Score: null,
        winnerId: null,
      },
    ];

    const updated = advanceWinner(matches, "m1", "b1");
    const nextMatch = updated.find((m) => m.id === "m3");
    expect(nextMatch?.bowler1Id).toBe("b1");
  });
});
