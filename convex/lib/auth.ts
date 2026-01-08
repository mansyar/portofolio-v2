import { QueryCtx, MutationCtx, ActionCtx } from "../_generated/server";

/**
 * Admin email(s) that have full CMS access.
 * Set via ADMIN_EMAIL environment variable.
 */
const ADMIN_EMAILS = (process.env.ADMIN_EMAIL || "")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);

/**
 * Requires the current user to be authenticated as an admin.
 * Throws an error if not authenticated or not an admin.
 *
 * @param ctx - The Convex query, mutation, or action context
 * @returns The user identity if authorized
 * @throws Error if not authenticated or not an admin
 */
export async function requireAdmin(
  ctx: QueryCtx | MutationCtx | ActionCtx
): Promise<{ email: string; subject: string }> {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    throw new Error("Unauthorized: Not authenticated");
  }

  // Use email from identity if available
  let email = identity.email;

  // If identity doesn't have email, we look it up from the database
  if (!email) {
    // The subject format from Convex Auth is: userId|sessionId
    const subjectParts = identity.subject.split("|");
    const userIdStr = subjectParts[0];

    if ("db" in ctx) {
      const db = ctx.db as QueryCtx["db"];
      const userId = db.normalizeId("users", userIdStr);

      if (userId) {
        // Try to get user directly by ID
        const user = await db.get(userId);
        email = user?.email;

        // If still no email, check authAccounts table
        if (!email) {
          // System tables are tricky to type explicitly without Generics. 
          // Using a safe cast to avoid 'any' while accessing internal query methods.
          type FilterBuilder = { 
            eq: (a: unknown, b: unknown) => unknown; 
            field: (f: string) => unknown 
          };
          const authAccount = await (db.query("authAccounts") as unknown as { 
            filter: (cb: (q: FilterBuilder) => unknown) => { 
              first: () => Promise<{ providerAccountId: string } | null> 
            } 
          })
            .filter((q) => q.eq(q.field("userId"), userId))
            .first();
          
          if (authAccount) {
            email = authAccount.providerAccountId;
          }
        }
      }
    } else if ("runQuery" in ctx) {
      // In an Action, call the internal query to resolve email
      try {
        // Dynamic import to avoid circular dependency in generated api
        const { internal } = await import("../_generated/api");
        // We use unknown cast here because ActionCtx.runQuery type definitions
        // might not always expose internal query execution in all environments
        // but it is supported by the runtime.
        email = (await (ctx as unknown as { 
          runQuery: (fn: unknown, args: unknown) => Promise<string | null> 
        }).runQuery(internal.admin.getUserEmail, { userId: userIdStr })) ?? undefined;
      } catch (err) {
        console.error("Failed to resolve email in action:", err);
      }
    }
  }

  if (!email || !ADMIN_EMAILS.includes(email)) {
    console.error(`Unauthorized access for email: ${email || 'unknown'} (Subject: ${identity.subject})`);
    throw new Error("Unauthorized: Not an admin");
  }

  return {
    email,
    subject: identity.subject,
  };
}

/**
 * Checks if the current user is an admin, but doesn't throw if not.
 * Useful for conditional logic based on admin status.
 *
 * @param ctx - The Convex query or mutation context
 * @returns The user identity if admin, null otherwise
 */
export async function optionalAdmin(
  ctx: QueryCtx | MutationCtx
): Promise<{ email: string; subject: string } | null> {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    return null;
  }

  const email = identity.email;
  if (!email || !ADMIN_EMAILS.includes(email)) {
    return null;
  }

  return {
    email,
    subject: identity.subject,
  };
}

/**
 * Checks if the current user is authenticated (any user, not just admin).
 *
 * @param ctx - The Convex query or mutation context
 * @returns The user identity if authenticated
 * @throws Error if not authenticated
 */
export async function requireAuth(
  ctx: QueryCtx | MutationCtx
): Promise<{ email?: string; subject: string }> {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    throw new Error("Unauthorized: Not authenticated");
  }

  return {
    email: identity.email,
    subject: identity.subject,
  };
}
