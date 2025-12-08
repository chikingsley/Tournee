import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./auth";

// Store or update user from Clerk webhook or client
export const upsertFromClerk = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (existingUser) {
      await ctx.db.patch(existingUser._id, {
        email: args.email,
        name: args.name,
        imageUrl: args.imageUrl,
      });
      return existingUser._id;
    }

    return await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      name: args.name,
      imageUrl: args.imageUrl,
      createdAt: Date.now(),
    });
  },
});

// Get current authenticated user
export const current = query({
  args: {},
  handler: async (ctx) => await getCurrentUser(ctx),
});

// Get user by ID
export const get = query({
  args: { id: v.id("users") },
  handler: async (ctx, args) => await ctx.db.get(args.id),
});
