import {
  customCtx,
  customMutation,
  customQuery,
} from "convex-helpers/server/customFunctions";
import {
  type MutationCtx,
  mutation,
  type QueryCtx,
  query,
} from "./_generated/server";

// Helper to get the current user from Clerk token
export async function getCurrentUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    return null;
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
    .unique();

  return user;
}

// Helper to require authentication
export async function requireAuth(ctx: QueryCtx | MutationCtx) {
  const user = await getCurrentUser(ctx);
  if (!user) {
    throw new Error("Not authenticated");
  }
  return user;
}

// Authenticated query helper
export const authenticatedQuery = customQuery(
  query,
  customCtx(async (ctx) => {
    const user = await getCurrentUser(ctx);
    return { user };
  })
);

// Authenticated mutation helper
export const authenticatedMutation = customMutation(
  mutation,
  customCtx(async (ctx) => {
    const user = await getCurrentUser(ctx);
    return { user };
  })
);

// Required auth query helper
export const protectedQuery = customQuery(
  query,
  customCtx(async (ctx) => {
    const user = await requireAuth(ctx);
    return { user };
  })
);

// Required auth mutation helper
export const protectedMutation = customMutation(
  mutation,
  customCtx(async (ctx) => {
    const user = await requireAuth(ctx);
    return { user };
  })
);
