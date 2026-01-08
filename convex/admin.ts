import { internalQuery } from "./_generated/server";
import { v } from "convex/values";

/**
 * Internal query to get a user's email by their ID.
 * This is used by requireAdmin in Actions where ctx.db is not available.
 */
export const getUserEmail = internalQuery({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const userId = ctx.db.normalizeId("users", args.userId);
    if (!userId) return null;

    const user = await ctx.db.get(userId);
    if (user?.email) return user.email;

    // Check authAccounts if email not in user doc
    type FilterBuilder = { 
      eq: (a: unknown, b: unknown) => unknown; 
      field: (f: string) => unknown 
    };
    const authAccount = await (ctx.db.query("authAccounts") as unknown as { 
      filter: (cb: (q: FilterBuilder) => unknown) => { 
        first: () => Promise<{ providerAccountId: string } | null> 
      } 
    })
      .filter((q) => q.eq(q.field("userId"), userId))
      .first();

    return authAccount?.providerAccountId ?? null;
  },
});
