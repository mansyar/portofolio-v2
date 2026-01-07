import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";

/**
 * Convex Auth configuration.
 *
 * Providers:
 * - Password: Email + password authentication
 *
 * Note: Magic Link can be added later with Resend integration.
 * For now, we start with password auth for simplicity.
 */
export const { auth, signIn, signOut, store } = convexAuth({
  providers: [Password],
});
