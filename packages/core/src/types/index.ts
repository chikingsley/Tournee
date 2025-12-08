// Bowler types
export type Bowler = {
  id: string;
  name: string;
  average: number;
  handicap?: number;
};

// Event types
export type EventType = "league" | "tournament";
export type ScoringType = "scratch" | "handicap";

export type Event = {
  id: string;
  name: string;
  type: EventType;
  date: string;
  location?: string;
  scoringType: ScoringType;
  handicapBase?: number; // e.g., 220
  handicapPercentage?: number; // e.g., 0.9 for 90%
  bowlers: Bowler[];
};

// Bracket types
export type BracketSize = 4 | 8 | 12 | 16 | 32 | 64;
export type BracketStatus = "open" | "in_progress" | "completed";

export type BracketMatch = {
  id: string;
  round: number;
  position: number;
  bowler1Id: string | null;
  bowler2Id: string | null;
  bowler1Score: number | null;
  bowler2Score: number | null;
  winnerId: string | null;
};

export type Bracket = {
  id: string;
  eventId: string;
  name: string;
  size: BracketSize;
  entryFee: number;
  prizePool: number;
  scoringType: ScoringType;
  status: BracketStatus;
  matches: BracketMatch[];
  bowlerIds: string[];
};

// Sidepot types
export type SidepotType =
  | "high_game" // Nassau - highest score each game
  | "high_series" // Highest total pins
  | "mystery_doubles" // Random pairing, combined scores
  | "eliminator"; // Lowest scores eliminated each game

export type Sidepot = {
  id: string;
  eventId: string;
  type: SidepotType;
  name: string;
  entryFee: number;
  prizePool: number;
  scoringType: ScoringType;
  entries: SidepotEntry[];
};

export type SidepotEntry = {
  bowlerId: string;
  partnerId?: string; // For mystery doubles
  scores: number[];
  totalPins: number;
  isEliminated?: boolean;
};

// Score types
export type GameScore = {
  bowlerId: string;
  eventId: string;
  gameNumber: number;
  pinsKnocked: number;
  handicap: number;
  totalScore: number; // pinsKnocked + handicap
};

// Payout types
export type Payout = {
  bowlerId: string;
  bracketId?: string;
  sidepotId?: string;
  amount: number;
  place: number;
};
