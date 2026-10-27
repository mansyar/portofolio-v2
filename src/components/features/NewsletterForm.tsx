import { useState } from "react";
import { postToConvex, responseError } from "../../lib/convex/http";
import { toast } from "sonner";
import { Send, Loader2 } from "lucide-react";
import "./NewsletterForm.css";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const alreadySubscribed = (value: unknown): boolean =>
  isRecord(value) && value.alreadySubscribed === true;

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      // The endpoint derives the rate-limit identity from this request. An
      // unattributable connection still subscribes: the address-keyed limit
      // covers it, and no shared placeholder bucket exists to fill up.
      const result = await postToConvex("/newsletter/subscribe", { email });

      if (!result.ok) {
        toast.error("SUBSCRIPTION_FAILED", {
          description: responseError(result.data, "Please try again later."),
        });
        return;
      }

      if (alreadySubscribed(result.data)) {
        toast.info("YOU_ARE_ALREADY_SUBSCRIBED");
      } else {
        toast.success("SUBSCRIPTION_SUCCESSFUL");
      }
      setEmail("");
    } catch {
      toast.error("SUBSCRIPTION_FAILED", {
        description: "Network error. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="newsletter-inline">
      <span className="newsletter-inline-label">Stay in the loop</span>
      <div className="newsletter-inline-input-group">
        <span className="newsletter-inline-prompt">$</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          disabled={loading}
          className="newsletter-inline-input"
        />
        <button
          type="submit"
          disabled={loading || !email}
          className="newsletter-inline-submit"
          aria-label="Subscribe"
        >
          {loading ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} />}
        </button>
      </div>
    </form>
  );
}
