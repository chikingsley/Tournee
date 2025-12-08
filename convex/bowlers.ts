import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuth } from "./auth";

// Create a new bowler
export const create = mutation({
  args: {
    name: v.string(),
    average: v.number(),
    handicap: v.optional(v.number()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    return await ctx.db.insert("bowlers", {
      name: args.name,
      average: args.average,
      handicap: args.handicap,
      email: args.email,
      phone: args.phone,
      createdBy: user._id,
    });
  },
});

// Update a bowler
export const update = mutation({
  args: {
    id: v.id("bowlers"),
    name: v.optional(v.string()),
    average: v.optional(v.number()),
    handicap: v.optional(v.number()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const bowler = await ctx.db.get(args.id);

    if (!bowler) {
      throw new Error("Bowler not found");
    }

    if (bowler.createdBy !== user._id) {
      throw new Error("Not authorized to update this bowler");
    }

    const { id, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    await ctx.db.patch(id, filteredUpdates);
    return id;
  },
});

// Delete a bowler
export const remove = mutation({
  args: { id: v.id("bowlers") },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const bowler = await ctx.db.get(args.id);

    if (!bowler) {
      throw new Error("Bowler not found");
    }

    if (bowler.createdBy !== user._id) {
      throw new Error("Not authorized to delete this bowler");
    }

    await ctx.db.delete(args.id);
  },
});

// Get all bowlers created by the current user
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
      .query("bowlers")
      .withIndex("by_created_by", (q) => q.eq("createdBy", user._id))
      .collect();
  },
});

// Get a single bowler
export const get = query({
  args: { id: v.id("bowlers") },
  handler: async (ctx, args) => await ctx.db.get(args.id),
});

// Bulk create bowlers
export const createBulk = mutation({
  args: {
    bowlers: v.array(
      v.object({
        name: v.string(),
        average: v.number(),
        handicap: v.optional(v.number()),
        email: v.optional(v.string()),
        phone: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    const ids = [];
    for (const bowler of args.bowlers) {
      const id = await ctx.db.insert("bowlers", {
        ...bowler,
        createdBy: user._id,
      });
      ids.push(id);
    }

    return ids;
  },
});
