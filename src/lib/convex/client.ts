import { ConvexReactClient } from "convex/react";
import { ConvexQueryClient } from "@convex-dev/react-query";

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

/**
 * Convex Query Client for TanStack Query integration.
 * Enables SSR and caching with React Query.
 */
export const convexQueryClient = new ConvexQueryClient(convex);
