import { describe, expect, it } from "vitest";
import {
  addTransaction,
  calculateBracketPayouts,
  calculateBracketRefunds,
  calculateEventFinancials,
  calculatePayoutStructure,
  calculateSidepotPrizePool,
  createMoneyLedger,
  getLedgerByBowler,
  STANDARD_PAYOUT_RATIOS,
} from "./payouts.js";

describe("STANDARD_PAYOUT_RATIOS", () => {
  it("should have ratios for common bracket sizes", () => {
    expect(STANDARD_PAYOUT_RATIOS["8"]).toBeDefined();
    expect(STANDARD_PAYOUT_RATIOS["16"]).toBeDefined();
    expect(STANDARD_PAYOUT_RATIOS["32"]).toBeDefined();
  });

  it("ratios should sum to 1", () => {
    for (const [_size, ratios] of Object.entries(STANDARD_PAYOUT_RATIOS)) {
      const sum = ratios.reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(1, 2);
    }
  });
});

describe("calculatePayoutStructure", () => {
  it("should calculate correct payouts for 8-person bracket", () => {
    const structure = calculatePayoutStructure(40, 8);
    expect(structure.totalPrizePool).toBe(40);
    expect(structure.tiers[0]?.amount).toBe(30); // 75%
    expect(structure.tiers[1]?.amount).toBe(10); // 25%
  });

  it("should handle rounding", () => {
    const structure = calculatePayoutStructure(45, 8);
    // 45 * 0.75 = 33.75 -> 33
    // 45 * 0.25 = 11.25 -> 11
    // Total = 44, remainder 1 goes to first place
    expect(structure.tiers[0]?.amount).toBe(34);
    expect(structure.tiers[1]?.amount).toBe(11);
    expect(
      (structure.tiers[0]?.amount ?? 0) + (structure.tiers[1]?.amount ?? 0)
    ).toBe(45);
  });

  it("should use custom ratios when provided", () => {
    const structure = calculatePayoutStructure(100, 8, [0.5, 0.3, 0.2]);
    expect(structure.tiers).toHaveLength(3);
    expect(structure.tiers[0]?.amount).toBe(50);
    expect(structure.tiers[1]?.amount).toBe(30);
    expect(structure.tiers[2]?.amount).toBe(20);
  });
});

describe("calculateBracketPayouts", () => {
  it("should calculate payouts based on bracket size", () => {
    const structure = calculateBracketPayouts(80, 16);
    expect(structure.tiers).toHaveLength(4); // 16-person pays 4 places
    expect(structure.totalPrizePool).toBe(80);
  });
});

describe("calculateBracketRefunds", () => {
  it("should return no refunds when bracket is full", () => {
    const entries = [
      { bowlerId: "b1", bracketsPaid: 1 },
      { bowlerId: "b2", bracketsPaid: 1 },
      { bowlerId: "b3", bracketsPaid: 1 },
      { bowlerId: "b4", bracketsPaid: 1 },
      { bowlerId: "b5", bracketsPaid: 1 },
      { bowlerId: "b6", bracketsPaid: 1 },
      { bowlerId: "b7", bracketsPaid: 1 },
      { bowlerId: "b8", bracketsPaid: 1 },
    ];
    const refunds = calculateBracketRefunds(entries, 5, 8, 8);
    const totalRefunds = refunds.reduce((sum, r) => sum + r.refundAmount, 0);
    expect(totalRefunds).toBe(0);
  });

  it("should calculate refunds for partial bracket", () => {
    const entries = [
      { bowlerId: "b1", bracketsPaid: 1 },
      { bowlerId: "b2", bracketsPaid: 1 },
      { bowlerId: "b3", bracketsPaid: 1 },
      { bowlerId: "b4", bracketsPaid: 1 },
      { bowlerId: "b5", bracketsPaid: 1 },
      { bowlerId: "b6", bracketsPaid: 1 },
    ];
    const refunds = calculateBracketRefunds(entries, 5, 8, 6);
    // 6 entries for 8-person bracket = 0 complete brackets
    // All 6 should be refunded
    const totalRefunds = refunds.reduce((sum, r) => sum + r.refundAmount, 0);
    expect(totalRefunds).toBe(30); // 6 * $5
  });
});

describe("calculateEventFinancials", () => {
  it("should calculate correct financials with lineage", () => {
    const financials = calculateEventFinancials(20, 10, 2, 10);
    expect(financials.totalCollected).toBe(200); // 20 * $10
    expect(financials.lineage).toBe(40); // 20 * $2
    expect(financials.expenses).toBe(10);
    expect(financials.prizePool).toBe(150); // 200 - 40 - 10
    expect(financials.profit).toBe(40); // lineage
  });

  it("should handle zero lineage", () => {
    const financials = calculateEventFinancials(10, 5, 0, 0);
    expect(financials.prizePool).toBe(50);
    expect(financials.lineage).toBe(0);
  });
});

describe("calculateSidepotPrizePool", () => {
  it("should calculate 100% payout", () => {
    expect(calculateSidepotPrizePool(10, 5)).toBe(50);
    expect(calculateSidepotPrizePool(20, 3)).toBe(60);
  });
});

describe("Money Ledger", () => {
  describe("createMoneyLedger", () => {
    it("should create empty ledger", () => {
      const ledger = createMoneyLedger();
      expect(ledger.transactions).toHaveLength(0);
      expect(ledger.totalIn).toBe(0);
      expect(ledger.totalOut).toBe(0);
      expect(ledger.balance).toBe(0);
    });
  });

  describe("addTransaction", () => {
    it("should add entry transaction", () => {
      let ledger = createMoneyLedger();
      ledger = addTransaction(ledger, {
        bowlerId: "b1",
        type: "entry",
        amount: 10,
        description: "Bracket entry",
      });
      expect(ledger.transactions).toHaveLength(1);
      expect(ledger.totalIn).toBe(10);
      expect(ledger.balance).toBe(10);
    });

    it("should add payout transaction", () => {
      let ledger = createMoneyLedger();
      ledger = addTransaction(ledger, {
        bowlerId: "b1",
        type: "entry",
        amount: 10,
        description: "Entry",
      });
      ledger = addTransaction(ledger, {
        bowlerId: "b1",
        type: "payout",
        amount: 30,
        description: "Winner",
      });
      expect(ledger.totalIn).toBe(10);
      expect(ledger.totalOut).toBe(30);
      expect(ledger.balance).toBe(-20);
    });

    it("should add refund transaction", () => {
      let ledger = createMoneyLedger();
      ledger = addTransaction(ledger, {
        bowlerId: "b1",
        type: "entry",
        amount: 10,
        description: "Entry",
      });
      ledger = addTransaction(ledger, {
        bowlerId: "b1",
        type: "refund",
        amount: 10,
        description: "Bracket didn't fill",
      });
      expect(ledger.balance).toBe(0);
    });
  });

  describe("getLedgerByBowler", () => {
    it("should aggregate by bowler", () => {
      let ledger = createMoneyLedger();
      ledger = addTransaction(ledger, {
        bowlerId: "b1",
        type: "entry",
        amount: 10,
        description: "Entry 1",
      });
      ledger = addTransaction(ledger, {
        bowlerId: "b1",
        type: "entry",
        amount: 5,
        description: "Entry 2",
      });
      ledger = addTransaction(ledger, {
        bowlerId: "b1",
        type: "payout",
        amount: 30,
        description: "Winner",
      });
      ledger = addTransaction(ledger, {
        bowlerId: "b2",
        type: "entry",
        amount: 10,
        description: "Entry",
      });

      const byBowler = getLedgerByBowler(ledger);
      const b1 = byBowler.get("b1");
      expect(b1?.paid).toBe(15);
      expect(b1?.received).toBe(30);
      expect(b1?.net).toBe(15); // Won $15

      const b2 = byBowler.get("b2");
      expect(b2?.paid).toBe(10);
      expect(b2?.received).toBe(0);
      expect(b2?.net).toBe(-10); // Lost $10
    });
  });
});
