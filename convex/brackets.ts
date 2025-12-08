import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { requireAuth } from "./auth";

const bracketSizeValidator = v.union(
  v.literal(4),
  v.literal(8),
  v.literal(12),
  v.literal(16),
  v.literal(32),
  v.literal(64)
);

// Create a new bracket
export const create = mutation({
  args: {
    eventId: v.id("events"),
    name: v.string(),
    size: bracketSizeValidator,
    entryFee: v.number(),
    scoringType: v.union(v.literal("scratch"), v.literal("handicap")),
    seedingMethod: v.optional(
      v.union(
        v.literal("random"),
        v.literal("byAverage"),
        v.literal("byHandicap")
      )
    ),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const event = await ctx.db.get(args.eventId);

    if (!event) {
      throw new Error("Event not found");
    }

    if (event.organizerId !== user._id) {
      throw new Error("Not authorized");
    }

    return await ctx.db.insert("brackets", {
      eventId: args.eventId,
      name: args.name,
      size: args.size,
      entryFee: args.entryFee,
      prizePool: 0,
      scoringType: args.scoringType,
      status: "open",
      seedingMethod: args.seedingMethod ?? "random",
      createdAt: Date.now(),
    });
  },
});

// Add bowler to bracket
export const addEntry = mutation({
  args: {
    bracketId: v.id("brackets"),
    bowlerId: v.id("bowlers"),
    bracketsPaid: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const bracket = await ctx.db.get(args.bracketId);

    if (!bracket) {
      throw new Error("Bracket not found");
    }

    const event = await ctx.db.get(bracket.eventId);
    if (!event || event.organizerId !== user._id) {
      throw new Error("Not authorized");
    }

    if (bracket.status !== "open") {
      throw new Error("Bracket is not open for entries");
    }

    // Check if already entered
    const existing = await ctx.db
      .query("bracketEntries")
      .withIndex("by_bracket", (q) => q.eq("bracketId", args.bracketId))
      .filter((q) => q.eq(q.field("bowlerId"), args.bowlerId))
      .unique();

    if (existing) {
      throw new Error("Bowler already in bracket");
    }

    // Count current entries
    const entries = await ctx.db
      .query("bracketEntries")
      .withIndex("by_bracket", (q) => q.eq("bracketId", args.bracketId))
      .collect();

    if (entries.length >= bracket.size) {
      throw new Error("Bracket is full");
    }

    // Update prize pool
    await ctx.db.patch(args.bracketId, {
      prizePool: bracket.prizePool + bracket.entryFee * args.bracketsPaid,
    });

    // Record entry transaction
    await ctx.db.insert("transactions", {
      eventId: bracket.eventId,
      bowlerId: args.bowlerId,
      type: "entry",
      amount: bracket.entryFee * args.bracketsPaid,
      description: `${bracket.name} entry`,
      bracketId: args.bracketId,
      createdAt: Date.now(),
    });

    return await ctx.db.insert("bracketEntries", {
      bracketId: args.bracketId,
      bowlerId: args.bowlerId,
      bracketsPaid: args.bracketsPaid,
    });
  },
});

// Remove bowler from bracket
export const removeEntry = mutation({
  args: {
    bracketId: v.id("brackets"),
    bowlerId: v.id("bowlers"),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const bracket = await ctx.db.get(args.bracketId);

    if (!bracket) {
      throw new Error("Bracket not found");
    }

    const event = await ctx.db.get(bracket.eventId);
    if (!event || event.organizerId !== user._id) {
      throw new Error("Not authorized");
    }

    if (bracket.status !== "open") {
      throw new Error("Cannot modify bracket after it has started");
    }

    const entry = await ctx.db
      .query("bracketEntries")
      .withIndex("by_bracket", (q) => q.eq("bracketId", args.bracketId))
      .filter((q) => q.eq(q.field("bowlerId"), args.bowlerId))
      .unique();

    if (entry) {
      // Refund and update prize pool
      const refundAmount = bracket.entryFee * entry.bracketsPaid;
      await ctx.db.patch(args.bracketId, {
        prizePool: bracket.prizePool - refundAmount,
      });

      // Record refund transaction
      await ctx.db.insert("transactions", {
        eventId: bracket.eventId,
        bowlerId: args.bowlerId,
        type: "refund",
        amount: refundAmount,
        description: `${bracket.name} refund`,
        bracketId: args.bracketId,
        createdAt: Date.now(),
      });

      await ctx.db.delete(entry._id);
    }
  },
});

// Generate bracket matches (start bracket)
export const startBracket = mutation({
  args: { bracketId: v.id("brackets") },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const bracket = await ctx.db.get(args.bracketId);

    if (!bracket) {
      throw new Error("Bracket not found");
    }

    const event = await ctx.db.get(bracket.eventId);
    if (!event || event.organizerId !== user._id) {
      throw new Error("Not authorized");
    }

    if (bracket.status !== "open") {
      throw new Error("Bracket has already started");
    }

    const entries = await ctx.db
      .query("bracketEntries")
      .withIndex("by_bracket", (q) => q.eq("bracketId", args.bracketId))
      .collect();

    if (entries.length < 2) {
      throw new Error("Need at least 2 bowlers to start bracket");
    }

    // Get bowler IDs and shuffle
    let bowlerIds = entries.map((e) => e.bowlerId);
    bowlerIds = shuffleArray(bowlerIds);

    // Calculate number of rounds
    const numRounds = Math.ceil(Math.log2(bracket.size));
    const numFirstRoundMatches = bracket.size / 2;
    const _numByes = bracket.size - bowlerIds.length;

    // Create matches for each round
    const matchIds: Map<string, Id<"bracketMatches">> = new Map();

    // Create all matches (empty first)
    for (let round = 1; round <= numRounds; round++) {
      const matchesInRound = bracket.size / 2 ** round;
      for (let position = 1; position <= matchesInRound; position++) {
        const matchId = await ctx.db.insert("bracketMatches", {
          bracketId: args.bracketId,
          round,
          position,
          isBye: false,
        });
        matchIds.set(`${round}-${position}`, matchId);
      }
    }

    // Link matches to next round
    for (let round = 1; round < numRounds; round++) {
      const matchesInRound = bracket.size / 2 ** round;
      for (let position = 1; position <= matchesInRound; position++) {
        const nextPosition = Math.ceil(position / 2);
        const matchId = matchIds.get(`${round}-${position}`);
        const nextMatchId = matchIds.get(`${round + 1}-${nextPosition}`);
        if (matchId && nextMatchId) {
          await ctx.db.patch(matchId, { nextMatchId });
        }
      }
    }

    // Place bowlers in first round
    let bowlerIndex = 0;
    for (let position = 1; position <= numFirstRoundMatches; position++) {
      const matchId = matchIds.get(`1-${position}`);
      if (!matchId) {
        continue;
      }

      const bowler1 = bowlerIds[bowlerIndex];
      const bowler2 = bowlerIds[bowlerIndex + 1];
      bowlerIndex += 2;

      const isBye = !(bowler1 && bowler2);

      await ctx.db.patch(matchId, {
        bowler1Id: bowler1,
        bowler2Id: bowler2,
        isBye,
      });

      // Auto-advance BYEs
      if (isBye && (bowler1 || bowler2)) {
        const winnerId = bowler1 ?? bowler2;
        if (winnerId) {
          await ctx.db.patch(matchId, { winnerId });

          // Advance to next match
          const match = await ctx.db.get(matchId);
          if (match?.nextMatchId) {
            const nextMatch = await ctx.db.get(match.nextMatchId);
            if (nextMatch) {
              if (nextMatch.bowler1Id) {
                await ctx.db.patch(match.nextMatchId, { bowler2Id: winnerId });
              } else {
                await ctx.db.patch(match.nextMatchId, { bowler1Id: winnerId });
              }
            }
          }
        }
      }
    }

    await ctx.db.patch(args.bracketId, { status: "in_progress" });
    return args.bracketId;
  },
});

// Record match result
export const recordMatchResult = mutation({
  args: {
    matchId: v.id("bracketMatches"),
    bowler1Score: v.number(),
    bowler2Score: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const match = await ctx.db.get(args.matchId);

    if (!match) {
      throw new Error("Match not found");
    }

    const bracket = await ctx.db.get(match.bracketId);
    if (!bracket) {
      throw new Error("Bracket not found");
    }

    const event = await ctx.db.get(bracket.eventId);
    if (!event || event.organizerId !== user._id) {
      throw new Error("Not authorized");
    }

    if (!(match.bowler1Id && match.bowler2Id)) {
      throw new Error("Match is not ready (missing bowlers)");
    }

    const winnerId =
      args.bowler1Score > args.bowler2Score
        ? match.bowler1Id
        : args.bowler2Score > args.bowler1Score
          ? match.bowler2Id
          : null;

    if (!winnerId) {
      throw new Error("Scores cannot be tied");
    }

    await ctx.db.patch(args.matchId, {
      bowler1Score: args.bowler1Score,
      bowler2Score: args.bowler2Score,
      winnerId,
    });

    // Advance winner to next match
    if (match.nextMatchId) {
      const nextMatch = await ctx.db.get(match.nextMatchId);
      if (nextMatch) {
        if (nextMatch.bowler1Id) {
          await ctx.db.patch(match.nextMatchId, { bowler2Id: winnerId });
        } else {
          await ctx.db.patch(match.nextMatchId, { bowler1Id: winnerId });
        }
      }
    } else {
      // This was the final match, bracket is complete
      await ctx.db.patch(match.bracketId, { status: "completed" });
    }

    return winnerId;
  },
});

// Get bracket with all matches and entries
export const get = query({
  args: { id: v.id("brackets") },
  handler: async (ctx, args) => {
    const bracket = await ctx.db.get(args.id);
    if (!bracket) {
      return null;
    }

    const matches = await ctx.db
      .query("bracketMatches")
      .withIndex("by_bracket", (q) => q.eq("bracketId", args.id))
      .collect();

    const entries = await ctx.db
      .query("bracketEntries")
      .withIndex("by_bracket", (q) => q.eq("bracketId", args.id))
      .collect();

    const bowlerIds = [
      ...new Set([
        ...entries.map((e) => e.bowlerId),
        ...matches.flatMap((m) => [m.bowler1Id, m.bowler2Id].filter(Boolean)),
      ]),
    ];

    const bowlers = await Promise.all(
      bowlerIds.map((id) => ctx.db.get(id as Id<"bowlers">))
    );

    const bowlerMap = Object.fromEntries(
      bowlers.filter(Boolean).map((b) => [b?._id, b])
    );

    return {
      ...bracket,
      matches,
      entries,
      bowlers: bowlerMap,
    };
  },
});

// List brackets for an event
export const listByEvent = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) =>
    await ctx.db
      .query("brackets")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect(),
});

// Get still alive bowlers
export const getStillAlive = query({
  args: { bracketId: v.id("brackets") },
  handler: async (ctx, args) => {
    const matches = await ctx.db
      .query("bracketMatches")
      .withIndex("by_bracket", (q) => q.eq("bracketId", args.bracketId))
      .collect();

    const eliminated = new Set<string>();
    for (const match of matches) {
      if (match.winnerId) {
        if (match.bowler1Id && match.bowler1Id !== match.winnerId) {
          eliminated.add(match.bowler1Id);
        }
        if (match.bowler2Id && match.bowler2Id !== match.winnerId) {
          eliminated.add(match.bowler2Id);
        }
      }
    }

    const entries = await ctx.db
      .query("bracketEntries")
      .withIndex("by_bracket", (q) => q.eq("bracketId", args.bracketId))
      .collect();

    const stillAlive = entries
      .filter((e) => !eliminated.has(e.bowlerId))
      .map((e) => e.bowlerId);

    const bowlers = await Promise.all(stillAlive.map((id) => ctx.db.get(id)));

    return bowlers.filter(Boolean);
  },
});

// Helper function to shuffle array
function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j] as T, result[i] as T];
  }
  return result;
}
