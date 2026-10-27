// @vitest-environment edge-runtime
import { describe, expect, it } from "vitest";
import { resolveClientIdentity } from "../lib/clientIdentity";

const headers = (init: Record<string, string>): Headers => new Headers(init);

/**
 * The deployment sits behind a reverse proxy that appends the address it saw to
 * `x-forwarded-for`. Everything a caller writes arrives to the left of that
 * entry, so only the rightmost address the proxy itself vouched for may count.
 */
describe("resolveClientIdentity", () => {
  it("resolves a single-hop chain to the address the proxy appended", () => {
    expect(resolveClientIdentity(headers({ "x-forwarded-for": "203.0.113.7" }))).toBe(
      "203.0.113.7"
    );
  });

  it("discards a forged leading hop", () => {
    // A caller who sends their own header gets one entry prepended; the proxy
    // appends the real address after it.
    expect(resolveClientIdentity(headers({ "x-forwarded-for": "1.2.3.4, 203.0.113.7" }))).toBe(
      "203.0.113.7"
    );
  });

  it("skips private proxy hops and still finds the client", () => {
    expect(
      resolveClientIdentity(headers({ "x-forwarded-for": "203.0.113.7, 172.18.0.2, 10.0.0.5" }))
    ).toBe("203.0.113.7");
  });

  it("falls back to x-real-ip when x-forwarded-for is absent", () => {
    expect(resolveClientIdentity(headers({ "x-real-ip": "198.51.100.9" }))).toBe("198.51.100.9");
  });

  it("prefers the proxy chain over x-real-ip when both are present", () => {
    // x-real-ip is written by the proxy from the same connection, so the two
    // agree in practice; when they do not, the chain is the one every hop
    // contributed to.
    expect(
      resolveClientIdentity(
        headers({ "x-forwarded-for": "1.2.3.4, 203.0.113.7", "x-real-ip": "10.0.0.5" })
      )
    ).toBe("203.0.113.7");
  });

  it("returns null when no header is present", () => {
    expect(resolveClientIdentity(headers({}))).toBeNull();
  });

  it("returns null when every entry is private, loopback, or unspecified", () => {
    expect(
      resolveClientIdentity(headers({ "x-forwarded-for": "10.0.0.5, 172.16.4.2, 192.168.1.9" }))
    ).toBeNull();
    expect(resolveClientIdentity(headers({ "x-forwarded-for": "127.0.0.1" }))).toBeNull();
    expect(resolveClientIdentity(headers({ "x-forwarded-for": "0.0.0.0" }))).toBeNull();
    expect(resolveClientIdentity(headers({ "x-forwarded-for": "::1" }))).toBeNull();
    expect(resolveClientIdentity(headers({ "x-forwarded-for": "fd12:3456:789a::1" }))).toBeNull();
  });

  it("returns null for an empty or whitespace-only header", () => {
    expect(resolveClientIdentity(headers({ "x-forwarded-for": "" }))).toBeNull();
    expect(resolveClientIdentity(headers({ "x-forwarded-for": "   ,  " }))).toBeNull();
  });

  it("normalizes IPv4-mapped IPv6 so one client cannot occupy two buckets", () => {
    expect(resolveClientIdentity(headers({ "x-forwarded-for": "::ffff:203.0.113.7" }))).toBe(
      "203.0.113.7"
    );
    expect(resolveClientIdentity(headers({ "x-forwarded-for": "::ffff:127.0.0.1" }))).toBeNull();
  });

  it("ignores trailing whitespace and empty segments", () => {
    expect(resolveClientIdentity(headers({ "x-forwarded-for": " 203.0.113.7 , ," }))).toBe(
      "203.0.113.7"
    );
  });

  it("ignores values that are not addresses at all", () => {
    // A proxy misconfiguration must not turn junk into a shared bucket identity.
    expect(resolveClientIdentity(headers({ "x-forwarded-for": "unknown, 10.0.0.5" }))).toBeNull();
  });
});
