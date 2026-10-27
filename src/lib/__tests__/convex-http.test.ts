import { afterEach, describe, expect, it, vi } from "vitest";
import { responseError } from "../convex/http";

type FetchImpl = (input: string, init?: RequestInit) => Promise<Response>;

const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

/**
 * The module captures `VITE_CONVEX_URL` at import time, so each case stubs the
 * environment and re-imports it rather than sharing one configured instance.
 */
const loadTransport = async (url: string) => {
  vi.stubEnv("VITE_CONVEX_URL", url);
  vi.resetModules();
  return import("../convex/http");
};

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe("postToConvex", () => {
  it("posts JSON to the configured deployment and returns the parsed body", async () => {
    const fetchMock = vi.fn<FetchImpl>(async () => jsonResponse({ success: true }));
    vi.stubGlobal("fetch", fetchMock);

    const { postToConvex } = await loadTransport("https://convex.example");
    const result = await postToConvex("/contact", { name: "Ada" });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://convex.example/contact");
    expect(init?.method).toBe("POST");
    expect(init?.body).toBe(JSON.stringify({ name: "Ada" }));
    expect(init?.headers).toMatchObject({ "Content-Type": "application/json" });
    expect(result).toEqual({ ok: true, status: 200, data: { success: true } });
  });

  it("does not double the slash when the configured URL ends with one", async () => {
    const fetchMock = vi.fn<FetchImpl>(async () => jsonResponse({ success: true }));
    vi.stubGlobal("fetch", fetchMock);

    const { postToConvex } = await loadTransport("https://convex.example/");
    await postToConvex("/newsletter/subscribe", { email: "ada@example.com" });

    expect(fetchMock.mock.calls[0][0]).toBe("https://convex.example/newsletter/subscribe");
  });

  it("reports a failure with no parsed body instead of throwing", async () => {
    // A proxy error page is not JSON; the caller still has to be able to answer
    // the user, so the response is reported rather than raised.
    const fetchMock = vi.fn<FetchImpl>(async () => new Response("Bad Gateway", { status: 502 }));
    vi.stubGlobal("fetch", fetchMock);

    const { postToConvex } = await loadTransport("https://convex.example");
    const result = await postToConvex("/contact", {});

    expect(result).toEqual({ ok: false, status: 502, data: null });
  });

  it("rejects when the deployment URL is not configured", async () => {
    const fetchMock = vi.fn<FetchImpl>(async () => jsonResponse({ success: true }));
    vi.stubGlobal("fetch", fetchMock);

    const { postToConvex } = await loadTransport("");

    await expect(postToConvex("/contact", {})).rejects.toThrow(/VITE_CONVEX_URL/);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("responseError", () => {
  it("prefers the server's own message", () => {
    expect(
      responseError({ error: "Too many submissions. Please try again later." }, "fallback")
    ).toBe("Too many submissions. Please try again later.");
  });

  it("falls back when the body has no usable message", () => {
    expect(responseError(null, "fallback")).toBe("fallback");
    expect(responseError({ error: "   " }, "fallback")).toBe("fallback");
    expect(responseError({ error: 429 }, "fallback")).toBe("fallback");
  });
});
