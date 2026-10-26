import type { ReactNode } from "react";
import { Suspense } from "react";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "../../../convex/_generated/api";
import { Route as BlogIndexRoute } from "../blog.index";
import { BlogContent } from "../../components/features/blog/BlogContent";

// The route-test convention in this repository: return the options object so the
// loader is reachable without booting a router.
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: unknown) => options,
  Link: ({ children, to }: { children: ReactNode; to: string }) => <a href={to}>{children}</a>,
}));

interface ListingSearch {
  page: number;
  category?: string;
  tag?: string;
}

// as-cast justified: the createFileRoute mock returns the route's options object
// at runtime, while the import keeps the real route type.
const runLoader = (
  BlogIndexRoute as unknown as {
    loader: (args: { context: { queryClient: QueryClient }; deps: ListingSearch }) => Promise<void>;
  }
).loader;

const posts = [
  {
    _id: "post-1",
    title: "Prefetched Post One",
    slug: "prefetched-post-one",
    excerpt: "The first prefetched post.",
    publishedAt: Date.UTC(2026, 0, 1),
    readingTime: 3,
  },
  {
    _id: "post-2",
    title: "Prefetched Post Two",
    slug: "prefetched-post-two",
    excerpt: "The second prefetched post.",
    publishedAt: Date.UTC(2026, 0, 2),
    readingTime: 4,
  },
];

const defaultListing = { posts, total: posts.length, totalPages: 1 };

/**
 * A query client whose fetch never touches Convex. `convexQuery` supplies only a
 * key, so the loader's `ensureQueryData` and the component's `useSuspenseQuery`
 * both resolve through this default `queryFn`.
 */
function clientWith(data: unknown = defaultListing) {
  return new QueryClient({
    defaultOptions: {
      queries: {
        queryFn: async () => data,
        staleTime: Infinity,
        retry: false,
      },
    },
  });
}

async function runDefaultLoader(queryClient: QueryClient) {
  await runLoader({
    context: { queryClient },
    deps: { page: 1, category: undefined, tag: undefined },
  });
}

describe("/blog loader prefetch", () => {
  it("prefetches the default page under the key the listing reads", async () => {
    const queryClient = clientWith();
    const ensureQueryData = vi.spyOn(queryClient, "ensureQueryData");

    await runDefaultLoader(queryClient);

    expect(ensureQueryData).toHaveBeenCalledTimes(1);
    const options = ensureQueryData.mock.calls[0]?.[0] as unknown as { queryKey: unknown };
    expect(options.queryKey).toEqual(
      convexQuery(api.blog.listPublished, { page: 1, pageSize: 9 }).queryKey
    );
  });

  it("renders the prefetched posts without falling back to the skeleton", async () => {
    const queryClient = clientWith();

    await runDefaultLoader(queryClient);

    render(
      <QueryClientProvider client={queryClient}>
        <Suspense fallback={<p>listing-skeleton</p>}>
          <BlogContent page={1} />
        </Suspense>
      </QueryClientProvider>
    );

    expect(screen.getByText("Prefetched Post One")).toBeInTheDocument();
    expect(screen.getByText("Prefetched Post Two")).toBeInTheDocument();
    expect(screen.queryByText("listing-skeleton")).not.toBeInTheDocument();
  });
});
