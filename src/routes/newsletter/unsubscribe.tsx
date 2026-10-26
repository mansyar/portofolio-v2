import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { api } from "../../../convex/_generated/api";
import { Seo } from "../../components/seo";

const searchSchema = z.object({
  token: z.string().optional(),
});

export const Route = createFileRoute("/newsletter/unsubscribe")({
  component: UnsubscribeRoute,
  validateSearch: searchSchema,
});

function UnsubscribeRoute() {
  const { token } = Route.useSearch();

  return <UnsubscribePage token={token} />;
}

type UnsubscribeState = "missing" | "pending" | "done" | "error";

const MESSAGES: Record<UnsubscribeState, string> = {
  missing:
    "This link is missing its token. Open the unsubscribe link from your welcome email instead.",
  pending: "Updating your subscription...",
  done: "You're unsubscribed. You won't receive further newsletter emails.",
  error: "We couldn't update your subscription. Try the link in your welcome email again.",
};

export function UnsubscribePage({ token }: { token?: string }) {
  const unsubscribe = useMutation(api.newsletter.unsubscribe);
  const [state, setState] = useState<UnsubscribeState>(token ? "pending" : "missing");
  // The token authorises one action, and the effect must not re-fire on every render
  // (StrictMode, or a re-created mutation reference).
  const attempted = useRef(false);

  useEffect(() => {
    if (!token || attempted.current) return;
    attempted.current = true;

    unsubscribe({ token })
      .then(() => setState("done"))
      .catch(() => setState("error"));
  }, [token, unsubscribe]);

  return (
    <div className="container flex flex-col gap-6 px-4 pt-10 pb-20 md:px-6">
      <Seo
        title="Unsubscribe | Muhammad Ansyar Rafi Putra"
        description="Opt out of the newsletter."
      />

      <h1 className="flex items-center gap-3 text-3xl font-bold md:text-4xl">
        <span aria-hidden="true" className="font-mono text-(--color-ubuntu-orange)">
          $
        </span>
        Newsletter
      </h1>

      <div className="card p-6">
        <p role="status" aria-live="polite" className="font-mono text-(--color-text-secondary)">
          {MESSAGES[state]}
        </p>
      </div>
    </div>
  );
}
