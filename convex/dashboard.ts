import { query } from "./_generated/server";
import { requireAdmin } from "./lib/auth";

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const projectsCount = await ctx.db.query("projects").collect().then(res => res.length);
    const skillsCount = await ctx.db.query("skills").collect().then(res => res.length);
    const blogPostsCount = await ctx.db.query("blogPosts").collect().then(res => res.length);
    
    // Unread messages
    const unreadMessagesCount = await ctx.db
      .query("contactSubmissions")
      .withIndex("by_read", (q) => q.eq("isRead", false))
      .collect()
      .then(res => res.length);

    return {
      projects: projectsCount,
      skills: skillsCount,
      blogPosts: blogPostsCount,
      unreadMessages: unreadMessagesCount,
    };
  },
});

export const getRecentMessages = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const messages = await ctx.db
      .query("contactSubmissions")
      .order("desc") // default order by _creationTime
      .take(5);

    return messages;
  },
});
