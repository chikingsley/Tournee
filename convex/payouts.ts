import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuth } from "./auth";

// Record a payout
export const record = mutation({
  args: {
    eventId: v.id("events"),
    bowlerId: v.id("bowlers"),
    bracketId: v.optional(v.id("brackets")),
    sidepotId: v.optional(v.id("sidepots")),
    amount: v.number(),
    place: v.number(),
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

    // Record the payout
    const payoutId = await ctx.db.insert("payouts", {
      eventId: args.eventId,
      bowlerId: args.bowlerId,
      bracketId: args.bracketId,
      sidepotId: args.sidepotId,
      amount: args.amount,
      place: args.place,
      paid: false,
    });

    // Record transaction
    await ctx.db.insert("transactions", {
      eventId: args.eventId,
      bowlerId: args.bowlerId,
      type: "payout",
      amount: args.amount,
      description: `${args.place}${getOrdinalSuffix(args.place)} place`,
      bracketId: args.bracketId,
      sidepotId: args.sidepotId,
      createdAt: Date.now(),
    });

    return payoutId;
  },
});

// Mark payout as paid
export const markPaid = mutation({
  args: { id: v.id("payouts") },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const payout = await ctx.db.get(args.id);

    if (!payout) {
      throw new Error("Payout not found");
    }

    const event = await ctx.db.get(payout.eventId);
    if (!event || event.organizerId !== user._id) {
      throw new Error("Not authorized");
    }

    await ctx.db.patch(args.id, {
      paid: true,
      paidAt: Date.now(),
    });
  },
});

// Get payouts for an event
export const listByEvent = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const payouts = await ctx.db
      .query("payouts")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();

    const withBowlers = await Promise.all(
      payouts.map(async (p) => {
        const bowler = await ctx.db.get(p.bowlerId);
        return { ...p, bowler };
      })
    );

    return withBowlers;
  },
});

// Get payouts for a bowler
export const listByBowler = query({
  args: { bowlerId: v.id("bowlers") },
  handler: async (ctx, args) =>
    await ctx.db
      .query("payouts")
      .withIndex("by_bowler", (q) => q.eq("bowlerId", args.bowlerId))
      .collect(),
});

// Get payouts for a bracket
export const listByBracket = query({
  args: { bracketId: v.id("brackets") },
  handler: async (ctx, args) => {
    const payouts = await ctx.db
      .query("payouts")
      .withIndex("by_bracket", (q) => q.eq("bracketId", args.bracketId))
      .collect();

    const withBowlers = await Promise.all(
      payouts.map(async (p) => {
        const bowler = await ctx.db.get(p.bowlerId);
        return { ...p, bowler };
      })
    );

    return withBowlers.sort((a, b) => a.place - b.place);
  },
});

// Get payouts for a sidepot
export const listBySidepot = query({
  args: { sidepotId: v.id("sidepots") },
  handler: async (ctx, args) => {
    const payouts = await ctx.db
      .query("payouts")
      .withIndex("by_sidepot", (q) => q.eq("sidepotId", args.sidepotId))
      .collect();

    const withBowlers = await Promise.all(
      payouts.map(async (p) => {
        const bowler = await ctx.db.get(p.bowlerId);
        return { ...p, bowler };
      })
    );

    return withBowlers.sort((a, b) => a.place - b.place);
  },
});

// Get total owed to bowler
export const getBowlerOwed = query({
  args: {
    eventId: v.id("events"),
    bowlerId: v.id("bowlers"),
  },
  handler: async (ctx, args) => {
    const payouts = await ctx.db
      .query("payouts")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .filter((q) => q.eq(q.field("bowlerId"), args.bowlerId))
      .collect();

    const total = payouts.reduce((sum, p) => sum + p.amount, 0);
    const paid = payouts
      .filter((p) => p.paid)
      .reduce((sum, p) => sum + p.amount, 0);
    const owed = total - paid;

    return { total, paid, owed, payouts };
  },
});

// Get event payout summary
export const getEventSummary = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const payouts = await ctx.db
      .query("payouts")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();

    const total = payouts.reduce((sum, p) => sum + p.amount, 0);
    const paid = payouts
      .filter((p) => p.paid)
      .reduce((sum, p) => sum + p.amount, 0);
    const pending = total - paid;

    return {
      totalPayouts: payouts.length,
      totalAmount: total,
      paidAmount: paid,
      pendingAmount: pending,
    };
  },
});

// Helper for ordinal suffixes
function getOrdinalSuffix(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0] || "th";
}
