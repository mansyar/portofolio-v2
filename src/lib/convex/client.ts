import { ConvexReactClient } from "convex/react";


/**
 * Convex URL from environment variables.
 * For self-hosted Convex, this should be your deployed backend URL.
 */
const convexUrl = import.meta.env.VITE_CONVEX_URL as string;

if (!convexUrl) {
  throw new Error(
    "Missing VITE_CONVEX_URL environment variable. " +
      "Please set it to your self-hosted Convex backend URL."
  );
}

/**
 * Convex React client instance.
 * Used for real-time subscriptions and mutations.
 */
export const convex = new ConvexReactClient(convexUrl);

// convexQueryClient should be instantiated per router/request to avoid state leakage
// and "already subscribed" errors. See src/router.tsx
