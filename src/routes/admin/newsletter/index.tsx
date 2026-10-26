import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { format } from "date-fns";
import { Mail } from "lucide-react";

export const Route = createFileRoute("/admin/newsletter/")({
  component: AdminNewsletterPage,
});

export function AdminNewsletterPage() {
  const subscribers = useQuery(api.newsletter.listForAdmin);

  const active = subscribers?.filter((row) => row.status === "active").length ?? 0;
  const total = subscribers?.length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 font-mono text-2xl font-bold text-(--color-ubuntu-orange)">
            <Mail size={20} />
            Newsletter
          </h1>
          <p className="mt-1 text-sm text-(--color-text-secondary)">
            {total === 0
              ? "No subscribers yet."
              : `${active} active of ${total} ${total === 1 ? "subscriber" : "subscribers"}.`}
          </p>
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        {subscribers === undefined ? (
          <div className="p-8 text-center font-mono text-sm text-(--color-text-secondary)">
            Loading subscribers...
          </div>
        ) : total === 0 ? (
          <div className="p-8 text-center font-mono text-sm text-(--color-text-secondary)">
            Subscribers will appear here after the first signup.
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Newsletter subscribers by signup date</caption>
            <thead className="border-b border-(--color-border) bg-(--color-surface)">
              <tr className="font-mono text-xs uppercase tracking-wide text-(--color-text-secondary)">
                <th scope="col" className="px-4 py-3">
                  Email
                </th>
                <th scope="col" className="px-4 py-3">
                  Status
                </th>
                <th scope="col" className="px-4 py-3">
                  Subscribed
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-(--color-border)">
              {subscribers.map((row) => (
                <tr key={row.email}>
                  <td className="px-4 py-3 font-mono text-(--color-text-primary)">{row.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`font-mono text-xs ${
                        row.status === "active"
                          ? "text-(--color-terminal-green)"
                          : "text-(--color-text-secondary)"
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-(--color-text-secondary)">
                    {format(new Date(row.subscribedAt), "d MMM yyyy")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
