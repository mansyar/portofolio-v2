// @vitest-environment edge-runtime
import { describe, expect, it } from "vitest";
import { convexTest } from "convex-test";
import { api } from "../_generated/api";
import schema from "../schema";

const modules = import.meta.glob(["../**/*.ts", "!../__tests__/**"]);

const BASE_TIME = 1_700_000_000_000;

async function seedSubscriber(
  t: ReturnType<typeof convexTest>,
  overrides: Partial<{ email: string; token: string; status: "active" | "unsubscribed" }> = {}
) {
  return await t.run(async (ctx) =>
    ctx.db.insert("newsletterSubscribers", {
      email: overrides.email ?? "reader@example.com",
      subscribedAt: BASE_TIME,
      status: overrides.status ?? "active",
      unsubscribeToken: overrides.token ?? "token-reader",
    })
  );
}

const subscribers = (t: ReturnType<typeof convexTest>) =>
  t.run(async (ctx) => ctx.db.query("newsletterSubscribers").collect());

describe("newsletter.unsubscribe", () => {
  it("marks the matching subscriber as unsubscribed and records when", async () => {
    const t = convexTest(schema, modules);
    await seedSubscriber(t, { token: "token-a" });

    const result = await t.mutation(api.newsletter.unsubscribe, { token: "token-a" });
    const [row] = await subscribers(t);

    expect(result).toEqual({ success: true, status: "unsubscribed" });
    expect(row.status).toBe("unsubscribed");
    expect(row.unsubscribedAt).toBeTypeOf("number");
  });

  it("is idempotent and does not move the original timestamp", async () => {
    const t = convexTest(schema, modules);
    await seedSubscriber(t, { token: "token-b" });

    await t.mutation(api.newsletter.unsubscribe, { token: "token-b" });
    const first = (await subscribers(t))[0];

    const second = await t.mutation(api.newsletter.unsubscribe, { token: "token-b" });
    const after = (await subscribers(t))[0];

    expect(second.success).toBe(true);
    expect(after.unsubscribedAt).toBe(first.unsubscribedAt);
  });

  it("writes nothing and stays vague for an unknown token", async () => {
    const t = convexTest(schema, modules);
    await seedSubscriber(t, { token: "token-c" });

    const result = await t.mutation(api.newsletter.unsubscribe, { token: "not-a-real-token" });
    const [row] = await subscribers(t);

    // Same shape as a known token: the page cannot be used to probe for tokens.
    expect(result).toEqual({ success: true, status: "unsubscribed" });
    expect(row.status).toBe("active");
  });

  it("leaves other subscribers untouched", async () => {
    const t = convexTest(schema, modules);
    await seedSubscriber(t, { email: "one@example.com", token: "token-one" });
    await seedSubscriber(t, { email: "two@example.com", token: "token-two" });

    await t.mutation(api.newsletter.unsubscribe, { token: "token-one" });

    const rows = await subscribers(t);
    const two = rows.find((row) => row.email === "two@example.com");

    expect(two?.status).toBe("active");
    expect(two?.unsubscribedAt).toBeUndefined();
  });
});
