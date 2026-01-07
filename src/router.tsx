import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { ConvexProvider } from "convex/react";
import { ConvexQueryClient } from "@convex-dev/react-query";
import { convex } from "./lib/convex/client";
import { routeTree } from "./routeTree.gen";

/**
 * Creates the TanStack Router instance with Convex integration.
 *
 * Features:
 * - Convex React Query integration for SSR
 * - Automatic query deduplication
 * - Real-time subscriptions via Convex
 */
export const getRouter = () => {
  // Create Convex Query Client for this router instance
  const convexQueryClient = new ConvexQueryClient(convex);

  // Create QueryClient with Convex integration
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // Use Convex's query key hashing for proper cache management
        queryKeyHashFn: convexQueryClient.hashFn(),
        // Use Convex's query function for data fetching
        queryFn: convexQueryClient.queryFn(),
        // Stale time for SSR - data is fresh from server
        staleTime: 5 * 60 * 1000, // 5 minutes
      },
    },
  });

  // Connect Convex Query Client to React Query
  convexQueryClient.connect(queryClient);

  const router = createRouter({
    routeTree,
    context: {
      queryClient,
    },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,

    // Wrap the router with Convex and Query providers
    Wrap: function WrapComponent({ children }) {
      return (
        <ConvexProvider client={convex}>
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        </ConvexProvider>
      );
    },
  });

  return router;
};

// Type declaration for router context
declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
