import type { BracketSize } from "../types/index.js";

// ============================================
// PAYOUT STRUCTURES
// ============================================

export type PayoutTier = {
  place: number;
  amount: number;
  percentage: number;
};

export type PayoutStructure = {
  totalPrizePool: number;
  tiers: PayoutTier[];
};

/**
 * Standard payout ratios by number of entries
 * Based on common bowling tournament structures
 */
export const STANDARD_PAYOUT_RATIOS: Record<string, number[]> = {
  // 4 entries: winner takes all
  "4": [1.0],
  // 8 entries: 75/25 split
  "8": [0.75, 0.25],
  // 12 entries: 60/25/15
  "12": [0.6, 0.25, 0.15],
  // 16 entries: 50/25/15/10
  "16": [0.5, 0.25, 0.15, 0.1],
  // 32 entries: 40/20/12/8/5/5/5/5 (pays 8)
  "32": [0.4, 0.2, 0.12, 0.08, 0.05, 0.05, 0.05, 0.05],
  // 64 entries: pays 16
  "64": [
    0.25, 0.15, 0.1, 0.08, 0.06, 0.06, 0.05, 0.05, 0.04, 0.04, 0.03, 0.03, 0.02,
    0.02, 0.01, 0.01,
  ],
};

/**
 * Calculate payout structure based on entries and prize pool
 */
export function calculatePayoutStructure(
  prizePool: number,
  numEntries: number,
  customRatios?: number[]
): PayoutStructure {
  // Find the closest standard ratio or use custom
  const ratioKey = Object.keys(STANDARD_PAYOUT_RATIOS)
    .map(Number)
    .filter((n) => n <= numEntries)
    .sort((a, b) => b - a)[0];

  const ratios = customRatios ??
    STANDARD_PAYOUT_RATIOS[String(ratioKey)] ?? [1.0];

  const tiers: PayoutTier[] = ratios.map((percentage, index) => ({
    place: index + 1,
    amount: Math.floor(prizePool * percentage),
    percentage,
  }));

  // Adjust for rounding (give remainder to first place)
  const totalDistributed = tiers.reduce((sum, t) => sum + t.amount, 0);
  const remainder = prizePool - totalDistributed;
  if (tiers[0] && remainder > 0) {
    tiers[0].amount += remainder;
  }

  return {
    totalPrizePool: prizePool,
    tiers,
  };
}

/**
 * Calculate bracket payout (simpler version)
 */
export function calculateBracketPayouts(
  prizePool: number,
  bracketSize: BracketSize
): PayoutStructure {
  return calculatePayoutStructure(prizePool, bracketSize);
}

// ============================================
// REFUND CALCULATIONS
// ============================================

export type RefundResult = {
  bowlerId: string;
  bracketsPaid: number;
  bracketsEntered: number;
  refundAmount: number;
};

/**
 * Calculate refunds for unfilled brackets
 * When a bracket doesn't fill completely, bowlers get refunds
 */
export function calculateBracketRefunds(
  entries: Array<{ bowlerId: string; bracketsPaid: number }>,
  entryFee: number,
  targetBracketSize: BracketSize,
  actualEntries: number
): RefundResult[] {
  const refunds: RefundResult[] = [];

  // Calculate how many complete brackets we can run
  const completeBrackets = Math.floor(actualEntries / targetBracketSize);
  const spotsNeeded = completeBrackets * targetBracketSize;
  const extraEntries = actualEntries - spotsNeeded;

  if (extraEntries === 0) {
    // All brackets filled, no refunds
    return entries.map((e) => ({
      bowlerId: e.bowlerId,
      bracketsPaid: e.bracketsPaid,
      bracketsEntered: e.bracketsPaid,
      refundAmount: 0,
    }));
  }

  // Distribute entries fairly, refund excess
  // Simple approach: last N entries get refunded
  const sortedEntries = [...entries];
  let refundedCount = extraEntries;

  for (const entry of sortedEntries) {
    if (refundedCount > 0 && entry.bracketsPaid > 0) {
      const bracketsToRefund = Math.min(entry.bracketsPaid, refundedCount);
      refunds.push({
        bowlerId: entry.bowlerId,
        bracketsPaid: entry.bracketsPaid,
        bracketsEntered: entry.bracketsPaid - bracketsToRefund,
        refundAmount: bracketsToRefund * entryFee,
      });
      refundedCount -= bracketsToRefund;
    } else {
      refunds.push({
        bowlerId: entry.bowlerId,
        bracketsPaid: entry.bracketsPaid,
        bracketsEntered: entry.bracketsPaid,
        refundAmount: 0,
      });
    }
  }

  return refunds;
}

// ============================================
// LINEAGE & FEES
// ============================================

export type EventFinancials = {
  totalCollected: number;
  lineage: number;
  prizePool: number;
  expenses: number;
  profit: number;
};

/**
 * Calculate event financials with lineage (house fees)
 */
export function calculateEventFinancials(
  numEntries: number,
  entryFee: number,
  lineagePerEntry = 0,
  otherExpenses = 0
): EventFinancials {
  const totalCollected = numEntries * entryFee;
  const lineage = numEntries * lineagePerEntry;
  const prizePool = totalCollected - lineage - otherExpenses;

  return {
    totalCollected,
    lineage,
    prizePool: Math.max(0, prizePool),
    expenses: otherExpenses,
    profit: lineage, // House keeps lineage as profit
  };
}

/**
 * Calculate sidepot prize pool (typically 100% of entries)
 */
export function calculateSidepotPrizePool(
  numEntries: number,
  entryFee: number
): number {
  return numEntries * entryFee;
}

// ============================================
// MONEY TRACKING
// ============================================

export type MoneyTransaction = {
  id: string;
  bowlerId: string;
  type: "entry" | "payout" | "refund";
  amount: number;
  description: string;
  timestamp: Date;
};

export type MoneyLedger = {
  transactions: MoneyTransaction[];
  totalIn: number;
  totalOut: number;
  balance: number;
};

/**
 * Create a new money ledger
 */
export function createMoneyLedger(): MoneyLedger {
  return {
    transactions: [],
    totalIn: 0,
    totalOut: 0,
    balance: 0,
  };
}

/**
 * Add a transaction to the ledger
 */
export function addTransaction(
  ledger: MoneyLedger,
  transaction: Omit<MoneyTransaction, "id" | "timestamp">
): MoneyLedger {
  const newTransaction: MoneyTransaction = {
    ...transaction,
    id: `txn-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    timestamp: new Date(),
  };

  const newLedger = {
    ...ledger,
    transactions: [...ledger.transactions, newTransaction],
  };

  if (transaction.type === "entry") {
    newLedger.totalIn += transaction.amount;
    newLedger.balance += transaction.amount;
  } else {
    // payout or refund
    newLedger.totalOut += transaction.amount;
    newLedger.balance -= transaction.amount;
  }

  return newLedger;
}

/**
 * Get ledger summary by bowler
 */
export function getLedgerByBowler(
  ledger: MoneyLedger
): Map<string, { paid: number; received: number; net: number }> {
  const byBowler = new Map<
    string,
    { paid: number; received: number; net: number }
  >();

  for (const txn of ledger.transactions) {
    const current = byBowler.get(txn.bowlerId) ?? {
      paid: 0,
      received: 0,
      net: 0,
    };

    if (txn.type === "entry") {
      current.paid += txn.amount;
      current.net -= txn.amount;
    } else {
      current.received += txn.amount;
      current.net += txn.amount;
    }

    byBowler.set(txn.bowlerId, current);
  }

  return byBowler;
}
