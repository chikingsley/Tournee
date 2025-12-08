import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuth } from "./auth";

// Record a game score
export const record = mutation({
  args: {
    eventId: v.id("events"),
    bowlerId: v.id("bowlers"),
    gameNumber: v.number(),
    pinsKnocked: v.number(),
    handicap: v.number(),
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

    // Validate score
    if (args.pinsKnocked < 0 || args.pinsKnocked > 300) {
      throw new Error("Invalid score: must be between 0 and 300");
    }

    // Check for existing score and update or create
    const existing = await ctx.db
      .query("scores")
      .withIndex("by_event_and_bowler", (q) =>
        q.eq("eventId", args.eventId).eq("bowlerId", args.bowlerId)
      )
      .filter((q) => q.eq(q.field("gameNumber"), args.gameNumber))
      .unique();

    const totalScore = args.pinsKnocked + args.handicap;

    if (existing) {
      await ctx.db.patch(existing._id, {
        pinsKnocked: args.pinsKnocked,
        handicap: args.handicap,
        totalScore,
      });
      return existing._id;
    }

    return await ctx.db.insert("scores", {
      eventId: args.eventId,
      bowlerId: args.bowlerId,
      gameNumber: args.gameNumber,
      pinsKnocked: args.pinsKnocked,
      handicap: args.handicap,
      totalScore,
      createdAt: Date.now(),
    });
  },
});

// Record multiple scores at once
export const recordBulk = mutation({
  args: {
    eventId: v.id("events"),
    scores: v.array(
      v.object({
        bowlerId: v.id("bowlers"),
        gameNumber: v.number(),
        pinsKnocked: v.number(),
        handicap: v.number(),
      })
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

    const ids = [];
    for (const score of args.scores) {
      if (score.pinsKnocked < 0 || score.pinsKnocked > 300) {
        throw new Error(
          `Invalid score for game ${score.gameNumber}: must be between 0 and 300`
        );
      }

      const existing = await ctx.db
        .query("scores")
        .withIndex("by_event_and_bowler", (q) =>
          q.eq("eventId", args.eventId).eq("bowlerId", score.bowlerId)
        )
        .filter((q) => q.eq(q.field("gameNumber"), score.gameNumber))
        .unique();

      const totalScore = score.pinsKnocked + score.handicap;

      if (existing) {
        await ctx.db.patch(existing._id, {
          pinsKnocked: score.pinsKnocked,
          handicap: score.handicap,
          totalScore,
        });
        ids.push(existing._id);
      } else {
        const id = await ctx.db.insert("scores", {
          eventId: args.eventId,
          bowlerId: score.bowlerId,
          gameNumber: score.gameNumber,
          pinsKnocked: score.pinsKnocked,
          handicap: score.handicap,
          totalScore,
          createdAt: Date.now(),
        });
        ids.push(id);
      }
    }

    return ids;
  },
});

// Delete a score
export const remove = mutation({
  args: { id: v.id("scores") },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const score = await ctx.db.get(args.id);

    if (!score) {
      throw new Error("Score not found");
    }

    const event = await ctx.db.get(score.eventId);
    if (!event || event.organizerId !== user._id) {
      throw new Error("Not authorized");
    }

    await ctx.db.delete(args.id);
  },
});

// Get all scores for an event
export const listByEvent = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) =>
    await ctx.db
      .query("scores")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect(),
});

// Get scores for a bowler in an event
export const listByBowler = query({
  args: {
    eventId: v.id("events"),
    bowlerId: v.id("bowlers"),
  },
  handler: async (ctx, args) =>
    await ctx.db
      .query("scores")
      .withIndex("by_event_and_bowler", (q) =>
        q.eq("eventId", args.eventId).eq("bowlerId", args.bowlerId)
      )
      .collect(),
});

// Get scores for a specific game
export const listByGame = query({
  args: {
    eventId: v.id("events"),
    gameNumber: v.number(),
  },
  handler: async (ctx, args) =>
    await ctx.db
      .query("scores")
      .withIndex("by_event_and_game", (q) =>
        q.eq("eventId", args.eventId).eq("gameNumber", args.gameNumber)
      )
      .collect(),
});

// Get high game winner(s) for a specific game
export const getHighGameWinners = query({
  args: {
    eventId: v.id("events"),
    gameNumber: v.number(),
  },
  handler: async (ctx, args) => {
    const scores = await ctx.db
      .query("scores")
      .withIndex("by_event_and_game", (q) =>
        q.eq("eventId", args.eventId).eq("gameNumber", args.gameNumber)
      )
      .collect();

    if (scores.length === 0) {
      return [];
    }

    const maxScore = Math.max(...scores.map((s) => s.totalScore));
    const winners = scores.filter((s) => s.totalScore === maxScore);

    const bowlers = await Promise.all(
      winners.map(async (w) => {
        const bowler = await ctx.db.get(w.bowlerId);
        return { bowler, score: w };
      })
    );

    return bowlers.filter((b) => b.bowler);
  },
});

// Get high series standings
export const getHighSeriesStandings = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const scores = await ctx.db
      .query("scores")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();

    // Group by bowler
    const byBowler = new Map<string, number>();
    for (const score of scores) {
      const current = byBowler.get(score.bowlerId) ?? 0;
      byBowler.set(score.bowlerId, current + score.totalScore);
    }

    // Sort by total
    const sorted = [...byBowler.entries()].sort((a, b) => b[1] - a[1]);

    // Get bowler info
    const standings = await Promise.all(
      sorted.map(async ([bowlerId, totalPins]) => {
        const bowler = await ctx.db.get(bowlerId as any);
        return { bowler, totalPins };
      })
    );

    return standings.filter((s) => s.bowler);
  },
});

// Get sweeper standings (same as high series - total pins)
export const getSweeperStandings = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const scores = await ctx.db
      .query("scores")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();

    // Group by bowler
    const byBowler = new Map<string, number>();
    for (const score of scores) {
      const current = byBowler.get(score.bowlerId) ?? 0;
      byBowler.set(score.bowlerId, current + score.totalScore);
    }

    // Sort by total
    const sorted = [...byBowler.entries()].sort((a, b) => b[1] - a[1]);

    // Get bowler info
    const standings = await Promise.all(
      sorted.map(async ([bowlerId, totalPins]) => {
        const bowler = await ctx.db.get(bowlerId as any);
        return { bowler, totalPins };
      })
    );

    return standings.filter((s) => s.bowler);
  },
});

// Get bowler statistics for an event
export const getBowlerStats = query({
  args: {
    eventId: v.id("events"),
    bowlerId: v.id("bowlers"),
  },
  handler: async (ctx, args) => {
    const scores = await ctx.db
      .query("scores")
      .withIndex("by_event_and_bowler", (q) =>
        q.eq("eventId", args.eventId).eq("bowlerId", args.bowlerId)
      )
      .collect();

    if (scores.length === 0) {
      return {
        gamesPlayed: 0,
        totalPins: 0,
        average: 0,
        highGame: 0,
        lowGame: 0,
      };
    }

    const pinsOnly = scores.map((s) => s.pinsKnocked);

    return {
      gamesPlayed: scores.length,
      totalPins: pinsOnly.reduce((a, b) => a + b, 0),
      average: Math.round(pinsOnly.reduce((a, b) => a + b, 0) / scores.length),
      highGame: Math.max(...pinsOnly),
      lowGame: Math.min(...pinsOnly),
    };
  },
});
