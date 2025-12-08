import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuth } from "./auth";

// Generate a random 6-character access code
function generateAccessCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Create a new event
export const create = mutation({
  args: {
    name: v.string(),
    type: v.union(v.literal("league"), v.literal("tournament")),
    date: v.string(),
    location: v.optional(v.string()),
    scoringType: v.union(v.literal("scratch"), v.literal("handicap")),
    handicapBase: v.optional(v.number()),
    handicapPercentage: v.optional(v.number()),
    maxHandicap: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    return await ctx.db.insert("events", {
      name: args.name,
      type: args.type,
      date: args.date,
      location: args.location,
      scoringType: args.scoringType,
      handicapBase: args.handicapBase,
      handicapPercentage: args.handicapPercentage,
      maxHandicap: args.maxHandicap,
      organizerId: user._id,
      accessCode: generateAccessCode(),
      status: "draft",
      createdAt: Date.now(),
    });
  },
});

// Update an event
export const update = mutation({
  args: {
    id: v.id("events"),
    name: v.optional(v.string()),
    type: v.optional(v.union(v.literal("league"), v.literal("tournament"))),
    date: v.optional(v.string()),
    location: v.optional(v.string()),
    scoringType: v.optional(
      v.union(v.literal("scratch"), v.literal("handicap"))
    ),
    handicapBase: v.optional(v.number()),
    handicapPercentage: v.optional(v.number()),
    maxHandicap: v.optional(v.number()),
    status: v.optional(
      v.union(
        v.literal("draft"),
        v.literal("open"),
        v.literal("in_progress"),
        v.literal("completed")
      )
    ),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const event = await ctx.db.get(args.id);

    if (!event) {
      throw new Error("Event not found");
    }

    if (event.organizerId !== user._id) {
      throw new Error("Not authorized to update this event");
    }

    const { id, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    await ctx.db.patch(id, filteredUpdates);
    return id;
  },
});

// Delete an event
export const remove = mutation({
  args: { id: v.id("events") },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const event = await ctx.db.get(args.id);

    if (!event) {
      throw new Error("Event not found");
    }

    if (event.organizerId !== user._id) {
      throw new Error("Not authorized to delete this event");
    }

    // Delete all related data
    const brackets = await ctx.db
      .query("brackets")
      .withIndex("by_event", (q) => q.eq("eventId", args.id))
      .collect();

    for (const bracket of brackets) {
      const matches = await ctx.db
        .query("bracketMatches")
        .withIndex("by_bracket", (q) => q.eq("bracketId", bracket._id))
        .collect();
      for (const match of matches) {
        await ctx.db.delete(match._id);
      }

      const entries = await ctx.db
        .query("bracketEntries")
        .withIndex("by_bracket", (q) => q.eq("bracketId", bracket._id))
        .collect();
      for (const entry of entries) {
        await ctx.db.delete(entry._id);
      }

      await ctx.db.delete(bracket._id);
    }

    const sidepots = await ctx.db
      .query("sidepots")
      .withIndex("by_event", (q) => q.eq("eventId", args.id))
      .collect();

    for (const sidepot of sidepots) {
      const entries = await ctx.db
        .query("sidepotEntries")
        .withIndex("by_sidepot", (q) => q.eq("sidepotId", sidepot._id))
        .collect();
      for (const entry of entries) {
        await ctx.db.delete(entry._id);
      }
      await ctx.db.delete(sidepot._id);
    }

    const scores = await ctx.db
      .query("scores")
      .withIndex("by_event", (q) => q.eq("eventId", args.id))
      .collect();
    for (const score of scores) {
      await ctx.db.delete(score._id);
    }

    const payouts = await ctx.db
      .query("payouts")
      .withIndex("by_event", (q) => q.eq("eventId", args.id))
      .collect();
    for (const payout of payouts) {
      await ctx.db.delete(payout._id);
    }

    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_event", (q) => q.eq("eventId", args.id))
      .collect();
    for (const transaction of transactions) {
      await ctx.db.delete(transaction._id);
    }

    const eventBowlers = await ctx.db
      .query("eventBowlers")
      .withIndex("by_event", (q) => q.eq("eventId", args.id))
      .collect();
    for (const eb of eventBowlers) {
      await ctx.db.delete(eb._id);
    }

    await ctx.db.delete(args.id);
  },
});

// Get all events for the current organizer
export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      return [];
    }

    return await ctx.db
      .query("events")
      .withIndex("by_organizer", (q) => q.eq("organizerId", user._id))
      .order("desc")
      .collect();
  },
});

// Get a single event
export const get = query({
  args: { id: v.id("events") },
  handler: async (ctx, args) => await ctx.db.get(args.id),
});

// Get event by access code (for bowler join)
export const getByAccessCode = query({
  args: { accessCode: v.string() },
  handler: async (ctx, args) =>
    await ctx.db
      .query("events")
      .withIndex("by_access_code", (q) => q.eq("accessCode", args.accessCode))
      .unique(),
});

// Add a bowler to an event
export const addBowler = mutation({
  args: {
    eventId: v.id("events"),
    bowlerId: v.id("bowlers"),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const event = await ctx.db.get(args.eventId);

    if (!event) {
      throw new Error("Event not found");
    }

    if (event.organizerId !== user._id) {
      throw new Error("Not authorized to add bowlers to this event");
    }

    // Check if bowler is already in event
    const existing = await ctx.db
      .query("eventBowlers")
      .withIndex("by_event_and_bowler", (q) =>
        q.eq("eventId", args.eventId).eq("bowlerId", args.bowlerId)
      )
      .unique();

    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("eventBowlers", {
      eventId: args.eventId,
      bowlerId: args.bowlerId,
      checkedIn: false,
    });
  },
});

// Remove a bowler from an event
export const removeBowler = mutation({
  args: {
    eventId: v.id("events"),
    bowlerId: v.id("bowlers"),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const event = await ctx.db.get(args.eventId);

    if (!event) {
      throw new Error("Event not found");
    }

    if (event.organizerId !== user._id) {
      throw new Error("Not authorized to remove bowlers from this event");
    }

    const eventBowler = await ctx.db
      .query("eventBowlers")
      .withIndex("by_event_and_bowler", (q) =>
        q.eq("eventId", args.eventId).eq("bowlerId", args.bowlerId)
      )
      .unique();

    if (eventBowler) {
      await ctx.db.delete(eventBowler._id);
    }
  },
});

// Get bowlers in an event
export const getBowlers = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const eventBowlers = await ctx.db
      .query("eventBowlers")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();

    const bowlers = await Promise.all(
      eventBowlers.map(async (eb) => {
        const bowler = await ctx.db.get(eb.bowlerId);
        return bowler ? { ...bowler, checkedIn: eb.checkedIn } : null;
      })
    );

    return bowlers.filter(Boolean);
  },
});

// Check in a bowler
export const checkInBowler = mutation({
  args: {
    eventId: v.id("events"),
    bowlerId: v.id("bowlers"),
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

    const eventBowler = await ctx.db
      .query("eventBowlers")
      .withIndex("by_event_and_bowler", (q) =>
        q.eq("eventId", args.eventId).eq("bowlerId", args.bowlerId)
      )
      .unique();

    if (eventBowler) {
      await ctx.db.patch(eventBowler._id, {
        checkedIn: true,
        checkedInAt: Date.now(),
      });
    }
  },
});

// Regenerate access code
export const regenerateAccessCode = mutation({
  args: { id: v.id("events") },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const event = await ctx.db.get(args.id);

    if (!event) {
      throw new Error("Event not found");
    }

    if (event.organizerId !== user._id) {
      throw new Error("Not authorized");
    }

    const newCode = generateAccessCode();
    await ctx.db.patch(args.id, { accessCode: newCode });
    return newCode;
  },
});
