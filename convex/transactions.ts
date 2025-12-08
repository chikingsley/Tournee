import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuth } from "./auth";

// Get all transactions for an event
export const listByEvent = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();

    const withBowlers = await Promise.all(
      transactions.map(async (t) => {
        const bowler = await ctx.db.get(t.bowlerId);
        return { ...t, bowler };
      })
    );

    return withBowlers.sort((a, b) => b.createdAt - a.createdAt);
  },
});

// Get transactions for a bowler
export const listByBowler = query({
  args: { bowlerId: v.id("bowlers") },
  handler: async (ctx, args) =>
    await ctx.db
      .query("transactions")
      .withIndex("by_bowler", (q) => q.eq("bowlerId", args.bowlerId))
      .collect(),
});

// Get event money summary
export const getEventSummary = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();

    const entries = transactions.filter((t) => t.type === "entry");
    const payouts = transactions.filter((t) => t.type === "payout");
    const refunds = transactions.filter((t) => t.type === "refund");

    const totalIn = entries.reduce((sum, t) => sum + t.amount, 0);
    const totalOut =
      payouts.reduce((sum, t) => sum + t.amount, 0) +
      refunds.reduce((sum, t) => sum + t.amount, 0);

    return {
      totalIn,
      totalOut,
      balance: totalIn - totalOut,
      entriesCount: entries.length,
      payoutsCount: payouts.length,
      refundsCount: refunds.length,
    };
  },
});

// Get bowler's event summary
export const getBowlerEventSummary = query({
  args: {
    eventId: v.id("events"),
    bowlerId: v.id("bowlers"),
  },
  handler: async (ctx, args) => {
    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .filter((q) => q.eq(q.field("bowlerId"), args.bowlerId))
      .collect();

    const paid = transactions
      .filter((t) => t.type === "entry")
      .reduce((sum, t) => sum + t.amount, 0);

    const received = transactions
      .filter((t) => t.type === "payout" || t.type === "refund")
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      paid,
      received,
      net: received - paid,
      transactions,
    };
  },
});

// Manual refund
export const recordRefund = mutation({
  args: {
    eventId: v.id("events"),
    bowlerId: v.id("bowlers"),
    amount: v.number(),
    description: v.string(),
    bracketId: v.optional(v.id("brackets")),
    sidepotId: v.optional(v.id("sidepots")),
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

    return await ctx.db.insert("transactions", {
      eventId: args.eventId,
      bowlerId: args.bowlerId,
      type: "refund",
      amount: args.amount,
      description: args.description,
      bracketId: args.bracketId,
      sidepotId: args.sidepotId,
      createdAt: Date.now(),
    });
  },
});
