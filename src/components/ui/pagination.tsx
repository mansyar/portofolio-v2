import { Link } from "@tanstack/react-router";
import { cn } from "../../lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  baseUrl: string; // e.g. "/blog"
  className?: string;
  searchParams?: Record<string, unknown>;
}

export function Pagination({ currentPage, totalPages, baseUrl, className, searchParams = {} }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className={cn("flex justify-center flex-wrap gap-2 font-mono text-sm", className)}>
      {/* Prev */}
      <Link
        to={baseUrl}
        search={{ ...searchParams, page: currentPage - 1 }}
        disabled={currentPage <= 1}
        className={cn(
          "px-3 py-1 border border-(--color-border) rounded hover:bg-(--color-surface) transition-colors",
          currentPage <= 1 && "opacity-50 pointer-events-none"
        )}
      >
        &lt; prev
      </Link>

      {/* Pages */}
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
        <Link
          key={page}
          to={baseUrl}
          search={{ ...searchParams, page }}
          className={cn(
            "px-3 py-1 border rounded transition-colors",
            currentPage === page
              ? "bg-(--color-ubuntu-orange) text-white border-(--color-ubuntu-orange)"
              : "border-(--color-border) hover:bg-(--color-surface)"
          )}
        >
          {page === currentPage ? `[${page}]` : page}
        </Link>
      ))}

      {/* Next */}
      <Link
        to={baseUrl}
        search={{ ...searchParams, page: currentPage + 1 }}
        disabled={currentPage >= totalPages}
        className={cn(
          "px-3 py-1 border border-(--color-border) rounded hover:bg-(--color-surface) transition-colors",
          currentPage >= totalPages && "opacity-50 pointer-events-none"
        )}
      >
        next &gt;
      </Link>
    </div>
  );
}
