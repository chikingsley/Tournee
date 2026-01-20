import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { requireAuth } from "./auth";

const sidepotTypeValidator = v.union(
  v.literal("high_game"),
  v.literal("high_series"),
  v.literal("mystery_doubles"),
  v.literal("love_doubles"),
  v.literal("eliminator"),
  v.literal("sweeper")
);

// Create a new sidepot
export const create = mutation({
  args: {
    eventId: v.id("events"),
    type: sidepotTypeValidator,
    name: v.string(),
    entryFee: v.number(),
    scoringType: v.union(v.literal("scratch"), v.literal("handicap")),
    eliminationPercentage: v.optional(v.number()),
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

    return await ctx.db.insert("sidepots", {
      eventId: args.eventId,
      type: args.type,
      name: args.name,
      entryFee: args.entryFee,
      prizePool: 0,
      scoringType: args.scoringType,
      eliminationPercentage: args.eliminationPercentage,
      status: "open",
      createdAt: Date.now(),
    });
  },
});

// Add entry to sidepot
export const addEntry = mutation({
  args: {
    sidepotId: v.id("sidepots"),
    bowlerId: v.id("bowlers"),
    partnerId: v.optional(v.id("bowlers")),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const sidepot = await ctx.db.get(args.sidepotId);

    if (!sidepot) {
      throw new Error("Sidepot not found");
    }

    const event = await ctx.db.get(sidepot.eventId);
    if (!event || event.organizerId !== user._id) {
      throw new Error("Not authorized");
    }

    if (sidepot.status !== "open") {
      throw new Error("Sidepot is not open for entries");
    }

    // Check if already entered
    const existing = await ctx.db
      .query("sidepotEntries")
      .withIndex("by_sidepot", (q) => q.eq("sidepotId", args.sidepotId))
      .filter((q) => q.eq(q.field("bowlerId"), args.bowlerId))
      .unique();

    if (existing) {
      throw new Error("Bowler already entered");
    }

    // Update prize pool
    await ctx.db.patch(args.sidepotId, {
      prizePool: sidepot.prizePool + sidepot.entryFee,
    });

    // Record transaction
    await ctx.db.insert("transactions", {
      eventId: sidepot.eventId,
      bowlerId: args.bowlerId,
      type: "entry",
      amount: sidepot.entryFee,
      description: `${sidepot.name} entry`,
      sidepotId: args.sidepotId,
      createdAt: Date.now(),
    });

    return await ctx.db.insert("sidepotEntries", {
      sidepotId: args.sidepotId,
      bowlerId: args.bowlerId,
      partnerId: args.partnerId,
      isEliminated: false,
    });
  },
});

// Remove entry from sidepot
export const removeEntry = mutation({
  args: {
    sidepotId: v.id("sidepots"),
    bowlerId: v.id("bowlers"),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const sidepot = await ctx.db.get(args.sidepotId);

    if (!sidepot) {
      throw new Error("Sidepot not found");
    }

    const event = await ctx.db.get(sidepot.eventId);
    if (!event || event.organizerId !== user._id) {
      throw new Error("Not authorized");
    }

    if (sidepot.status !== "open") {
      throw new Error("Cannot modify sidepot after it has started");
    }

    const entry = await ctx.db
      .query("sidepotEntries")
      .withIndex("by_sidepot", (q) => q.eq("sidepotId", args.sidepotId))
      .filter((q) => q.eq(q.field("bowlerId"), args.bowlerId))
      .unique();

    if (entry) {
      await ctx.db.patch(args.sidepotId, {
        prizePool: sidepot.prizePool - sidepot.entryFee,
      });

      await ctx.db.insert("transactions", {
        eventId: sidepot.eventId,
        bowlerId: args.bowlerId,
        type: "refund",
        amount: sidepot.entryFee,
        description: `${sidepot.name} refund`,
        sidepotId: args.sidepotId,
        createdAt: Date.now(),
      });

      await ctx.db.delete(entry._id);
    }
  },
});

// Generate mystery doubles pairings
export const generateMysteryDoublesPairings = mutation({
  args: { sidepotId: v.id("sidepots") },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const sidepot = await ctx.db.get(args.sidepotId);

    if (!sidepot) {
      throw new Error("Sidepot not found");
    }

    if (sidepot.type !== "mystery_doubles") {
      throw new Error("Sidepot is not mystery doubles");
    }

    const event = await ctx.db.get(sidepot.eventId);
    if (!event || event.organizerId !== user._id) {
      throw new Error("Not authorized");
    }

    const entries = await ctx.db
      .query("sidepotEntries")
      .withIndex("by_sidepot", (q) => q.eq("sidepotId", args.sidepotId))
      .collect();

    if (entries.length < 2) {
      throw new Error("Need at least 2 bowlers for doubles");
    }

    // Shuffle bowlers
    const shuffled = [...entries];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [
        shuffled[j] as (typeof shuffled)[number],
        shuffled[i] as (typeof shuffled)[number],
      ];
    }

    // Pair up bowlers
    for (let i = 0; i < shuffled.length - 1; i += 2) {
      const entry1 = shuffled[i];
      const entry2 = shuffled[i + 1];
      if (entry1 && entry2) {
        await ctx.db.patch(entry1._id, {
          partnerId: entry2.bowlerId,
        });
        await ctx.db.patch(entry2._id, {
          partnerId: entry1.bowlerId,
        });
      }
    }

    await ctx.db.patch(args.sidepotId, { status: "in_progress" });
  },
});

// Eliminate bowler in eliminator
export const eliminateBowler = mutation({
  args: {
    sidepotId: v.id("sidepots"),
    bowlerId: v.id("bowlers"),
    gameNumber: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const sidepot = await ctx.db.get(args.sidepotId);

    if (!sidepot) {
      throw new Error("Sidepot not found");
    }

    if (sidepot.type !== "eliminator") {
      throw new Error("Sidepot is not eliminator");
    }

    const event = await ctx.db.get(sidepot.eventId);
    if (!event || event.organizerId !== user._id) {
      throw new Error("Not authorized");
    }

    const entry = await ctx.db
      .query("sidepotEntries")
      .withIndex("by_sidepot", (q) => q.eq("sidepotId", args.sidepotId))
      .filter((q) => q.eq(q.field("bowlerId"), args.bowlerId))
      .unique();

    if (entry) {
      await ctx.db.patch(entry._id, {
        isEliminated: true,
        eliminatedInGame: args.gameNumber,
      });
    }
  },
});

// Get sidepot with entries
export const get = query({
  args: { id: v.id("sidepots") },
  handler: async (ctx, args) => {
    const sidepot = await ctx.db.get(args.id);
    if (!sidepot) {
      return null;
    }

    const entries = await ctx.db
      .query("sidepotEntries")
      .withIndex("by_sidepot", (q) => q.eq("sidepotId", args.id))
      .collect();

    const bowlerIds = [
      ...new Set([
        ...entries.map((e) => e.bowlerId),
        ...entries.map((e) => e.partnerId).filter(Boolean),
      ]),
    ];

    const bowlers = await Promise.all(
      bowlerIds.map((id) => ctx.db.get(id as Id<"bowlers">))
    );

    const bowlerMap = Object.fromEntries(
      bowlers.filter(Boolean).map((b) => [b?._id, b])
    );

    return {
      ...sidepot,
      entries,
      bowlers: bowlerMap,
    };
  },
});

// List sidepots for an event
export const listByEvent = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) =>
    await ctx.db
      .query("sidepots")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect(),
});

// Get eliminator standings
export const getEliminatorStandings = query({
  args: { sidepotId: v.id("sidepots") },
  handler: async (ctx, args) => {
    const sidepot = await ctx.db.get(args.sidepotId);
    if (!sidepot || sidepot.type !== "eliminator") {
      return null;
    }

    const entries = await ctx.db
      .query("sidepotEntries")
      .withIndex("by_sidepot", (q) => q.eq("sidepotId", args.sidepotId))
      .collect();

    const stillIn = entries.filter((e) => !e.isEliminated);
    const eliminated = entries.filter((e) => e.isEliminated);

    const bowlers = await Promise.all(
      entries.map(async (e) => {
        const bowler = await ctx.db.get(e.bowlerId);
        return {
          ...bowler,
          isEliminated: e.isEliminated,
          eliminatedInGame: e.eliminatedInGame,
        };
      })
    );

    return {
      stillIn: stillIn.length,
      eliminated: eliminated.length,
      bowlers: bowlers.filter(Boolean),
    };
  },
});

// Complete sidepot
export const complete = mutation({
  args: { sidepotId: v.id("sidepots") },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const sidepot = await ctx.db.get(args.sidepotId);

    if (!sidepot) {
      throw new Error("Sidepot not found");
    }

    const event = await ctx.db.get(sidepot.eventId);
    if (!event || event.organizerId !== user._id) {
      throw new Error("Not authorized");
    }

    await ctx.db.patch(args.sidepotId, { status: "completed" });
  },
});
