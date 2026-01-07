import { QueryCtx, MutationCtx } from "../_generated/server";

/**
 * Admin email(s) that have full CMS access.
 * Set via ADMIN_EMAIL environment variable.
 */
const ADMIN_EMAILS = process.env.ADMIN_EMAIL
  ? [process.env.ADMIN_EMAIL]
  : [];

/**
 * Requires the current user to be authenticated as an admin.
 * Throws an error if not authenticated or not an admin.
 *
 * @param ctx - The Convex query or mutation context
 * @returns The user identity if authorized
 * @throws Error if not authenticated or not an admin
 */
export async function requireAdmin(
  ctx: QueryCtx | MutationCtx
): Promise<{ email: string; subject: string }> {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    throw new Error("Unauthorized: Not authenticated");
  }

  const email = identity.email;
  if (!email || !ADMIN_EMAILS.includes(email)) {
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
