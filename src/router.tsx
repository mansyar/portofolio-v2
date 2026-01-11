import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LoadingSpinner } from "./components/ui/loading-spinner";
import { createRouter } from "@tanstack/react-router";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexQueryClient } from "@convex-dev/react-query";
import { convex } from "./lib/convex/client";
import { routeTree } from "./routeTree.gen";
import { ErrorFallback } from "./components/ui/error-fallback";

/**
 * Creates the TanStack Router instance with Convex integration.
 *
 * Features:
 * - Convex React Query integration for SSR
 * - Automatic query deduplication
 * - Real-time subscriptions via Convex
 * - Authentication via Convex Auth
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
        // Set to Infinity to prevent hydration flicker; Convex handles real-time updates
        staleTime: Infinity,
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
    defaultPendingComponent: LoadingSpinner,
    defaultPendingMs: 500,
    defaultErrorComponent: ({ error, reset }) => (
      <ErrorFallback error={error} reset={reset} />
    ),

    // Wrap the router with Convex Auth and Query providers
    Wrap: function WrapComponent({ children }) {
      return (
        <ConvexAuthProvider client={convex}>
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        </ConvexAuthProvider>
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
