export enum EventStatus {
  UPCOMING = "UPCOMING",
  ACTIVE = "ACTIVE",
  COMPLETED = "COMPLETED",
}

export type Bowler = {
  id: string;
  name: string;
  average: number;
  handicap: number;
  email?: string;
};

export type Match = {
  id: string;
  round: number;
  matchNumber: number; // Position in the round
  player1Id?: string | null;
  player2Id?: string | null;
  score1?: number;
  score2?: number;
  winnerId?: string | null;
};

export type Bracket = {
  id: string;
  eventId: string;
  name: string; // e.g., "Scratch Bracket", "Handicap Bracket"
  size: number; // 8, 16, 32
  matches: Match[];
  status: "SETUP" | "IN_PROGRESS" | "FINISHED";
};

export type Event = {
  id: string;
  name: string;
  date: string;
  location: string;
  entryFee: number;
  status: EventStatus;
  prizeFund: number;
  registeredBowlerIds: string[]; // Bowlers signed up for this event
  checkedInBowlerIds: string[]; // Bowlers physically present
  brackets: Bracket[];
};

export type DashboardStats = {
  totalEvents: number;
  activeEvents: number;
  totalBowlers: number;
  totalPrizeMoney: number;
};
