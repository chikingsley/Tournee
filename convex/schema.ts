import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users (organizers who run events)
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    imageUrl: v.optional(v.string()),
    createdAt: v.optional(v.number()),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_email", ["email"]),

  // Bowlers (participants in events)
  bowlers: defineTable({
    name: v.string(),
    average: v.number(),
    handicap: v.optional(v.number()),
    userId: v.optional(v.id("users")), // Optional link to user account
    createdBy: v.id("users"), // Organizer who created this bowler
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
  })
    .index("by_created_by", ["createdBy"])
    .index("by_user_id", ["userId"]),

  // Events (leagues, tournaments)
  events: defineTable({
    name: v.string(),
    type: v.union(v.literal("league"), v.literal("tournament")),
    date: v.string(),
    location: v.optional(v.string()),
    scoringType: v.union(v.literal("scratch"), v.literal("handicap")),
    handicapBase: v.optional(v.number()),
    handicapPercentage: v.optional(v.number()),
    maxHandicap: v.optional(v.number()),
    organizerId: v.id("users"),
    accessCode: v.optional(v.string()), // For bowler self-join
    status: v.union(
      v.literal("draft"),
      v.literal("open"),
      v.literal("in_progress"),
      v.literal("completed")
    ),
    createdAt: v.number(),
  })
    .index("by_organizer", ["organizerId"])
    .index("by_access_code", ["accessCode"])
    .index("by_status", ["status"]),

  // Event bowlers (many-to-many relationship)
  eventBowlers: defineTable({
    eventId: v.id("events"),
    bowlerId: v.id("bowlers"),
    checkedIn: v.boolean(),
    checkedInAt: v.optional(v.number()),
  })
    .index("by_event", ["eventId"])
    .index("by_bowler", ["bowlerId"])
    .index("by_event_and_bowler", ["eventId", "bowlerId"]),

  // Brackets
  brackets: defineTable({
    eventId: v.id("events"),
    name: v.string(),
    size: v.union(
      v.literal(4),
      v.literal(8),
      v.literal(12),
      v.literal(16),
      v.literal(32),
      v.literal(64)
    ),
    entryFee: v.number(),
    prizePool: v.number(),
    scoringType: v.union(v.literal("scratch"), v.literal("handicap")),
    status: v.union(
      v.literal("open"),
      v.literal("in_progress"),
      v.literal("completed")
    ),
    seedingMethod: v.optional(
      v.union(
        v.literal("random"),
        v.literal("byAverage"),
        v.literal("byHandicap")
      )
    ),
    createdAt: v.number(),
  })
    .index("by_event", ["eventId"])
    .index("by_status", ["status"]),

  // Bracket entries (bowlers in a bracket)
  bracketEntries: defineTable({
    bracketId: v.id("brackets"),
    bowlerId: v.id("bowlers"),
    seed: v.optional(v.number()),
    bracketsPaid: v.number(), // Number of brackets purchased
  })
    .index("by_bracket", ["bracketId"])
    .index("by_bowler", ["bowlerId"]),

  // Bracket matches
  bracketMatches: defineTable({
    bracketId: v.id("brackets"),
    round: v.number(),
    position: v.number(),
    bowler1Id: v.optional(v.id("bowlers")),
    bowler2Id: v.optional(v.id("bowlers")),
    bowler1Score: v.optional(v.number()),
    bowler2Score: v.optional(v.number()),
    winnerId: v.optional(v.id("bowlers")),
    isBye: v.boolean(),
    nextMatchId: v.optional(v.id("bracketMatches")),
  })
    .index("by_bracket", ["bracketId"])
    .index("by_bracket_and_round", ["bracketId", "round"]),

  // Sidepots
  sidepots: defineTable({
    eventId: v.id("events"),
    type: v.union(
      v.literal("high_game"),
      v.literal("high_series"),
      v.literal("mystery_doubles"),
      v.literal("love_doubles"),
      v.literal("eliminator"),
      v.literal("sweeper")
    ),
    name: v.string(),
    entryFee: v.number(),
    prizePool: v.number(),
    scoringType: v.union(v.literal("scratch"), v.literal("handicap")),
    // Eliminator specific
    eliminationPercentage: v.optional(v.number()),
    status: v.union(
      v.literal("open"),
      v.literal("in_progress"),
      v.literal("completed")
    ),
    createdAt: v.number(),
  })
    .index("by_event", ["eventId"])
    .index("by_type", ["type"]),

  // Sidepot entries
  sidepotEntries: defineTable({
    sidepotId: v.id("sidepots"),
    bowlerId: v.id("bowlers"),
    partnerId: v.optional(v.id("bowlers")), // For doubles
    isEliminated: v.boolean(),
    eliminatedInGame: v.optional(v.number()),
  })
    .index("by_sidepot", ["sidepotId"])
    .index("by_bowler", ["bowlerId"]),

  // Game scores
  scores: defineTable({
    eventId: v.id("events"),
    bowlerId: v.id("bowlers"),
    gameNumber: v.number(),
    pinsKnocked: v.number(),
    handicap: v.number(),
    totalScore: v.number(),
    createdAt: v.number(),
  })
    .index("by_event", ["eventId"])
    .index("by_bowler", ["bowlerId"])
    .index("by_event_and_game", ["eventId", "gameNumber"])
    .index("by_event_and_bowler", ["eventId", "bowlerId"]),

  // Payouts
  payouts: defineTable({
    eventId: v.id("events"),
    bowlerId: v.id("bowlers"),
    bracketId: v.optional(v.id("brackets")),
    sidepotId: v.optional(v.id("sidepots")),
    amount: v.number(),
    place: v.number(),
    paid: v.boolean(),
    paidAt: v.optional(v.number()),
  })
    .index("by_event", ["eventId"])
    .index("by_bowler", ["bowlerId"])
    .index("by_bracket", ["bracketId"])
    .index("by_sidepot", ["sidepotId"]),

  // Money transactions (ledger)
  transactions: defineTable({
    eventId: v.id("events"),
    bowlerId: v.id("bowlers"),
    type: v.union(v.literal("entry"), v.literal("payout"), v.literal("refund")),
    amount: v.number(),
    description: v.string(),
    bracketId: v.optional(v.id("brackets")),
    sidepotId: v.optional(v.id("sidepots")),
    createdAt: v.number(),
  })
    .index("by_event", ["eventId"])
    .index("by_bowler", ["bowlerId"])
    .index("by_type", ["type"]),
});
