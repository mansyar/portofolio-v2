import { action } from "./_generated/server";
import { v } from "convex/values";

/**
 * Convex action to proxy Umami API requests.
 * This avoids CORS issues and keeps credentials server-side.
 */
export const getStats = action({
  args: { 
    startAt: v.number(), 
    endAt: v.number() 
  },
  handler: async (_ctx, { startAt, endAt }) => {
    const umamiUrl = process.env.UMAMI_URL;
    const websiteId = process.env.UMAMI_WEBSITE_ID;
    const username = process.env.UMAMI_USERNAME;
    const password = process.env.UMAMI_PASSWORD;

    if (!umamiUrl || !websiteId || !username || !password) {
      console.warn("Umami configuration missing");
      return null;
    }

    const baseUrl = umamiUrl.replace(/\/$/, "");

    try {
      // 1. Authenticate with Umami to get token
      const authResponse = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!authResponse.ok) {
        throw new Error(`Umami login failed: ${authResponse.statusText}`);
      }

      const { token } = await authResponse.json();

      // 2. Fetch stats
      const statsResponse = await fetch(
        `${baseUrl}/api/websites/${websiteId}/stats?startAt=${startAt}&endAt=${endAt}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!statsResponse.ok) {
        throw new Error(`Umami stats fetch failed: ${statsResponse.statusText}`);
      }

      const stats = await statsResponse.json();

      // 3. Fetch active visitors
      const activeResponse = await fetch(
        `${baseUrl}/api/websites/${websiteId}/active`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      let activeVisitors = 0;
      if (activeResponse.ok) {
        const activeData = await activeResponse.json();
        activeVisitors = activeData.visitors || 0;
      }

      return {
        ...stats,
        activeVisitors,
      };
    } catch (error) {
      console.error("Error fetching Umami stats:", error);
      return null;
    }
  },
});
