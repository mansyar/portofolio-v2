import { internalMutation } from "./_generated/server";

export const seedData = internalMutation({
  args: {},
  handler: async (ctx) => {
    console.log("Starting full seed...");

    // 1. Clear existing data
    const skills = await ctx.db.query("skills").collect();
    for (const s of skills) await ctx.db.delete(s._id);

    const projects = await ctx.db.query("projects").collect();
    for (const p of projects) await ctx.db.delete(p._id);

    const posts = await ctx.db.query("blogPosts").collect();
    for (const p of posts) await ctx.db.delete(p._id);

    // 2. Seed Skills
    await ctx.db.insert("skills", { 
      name: "React", 
      category: "frontend", 
      proficiency: 90, 
      displayOrder: 1, 
      isVisible: true,
      icon: "react"
    });
    await ctx.db.insert("skills", { 
      name: "Convex", 
      category: "backend", 
      proficiency: 85, 
      displayOrder: 2, 
      isVisible: true,
      icon: "database"
    });

    // 3. Seed Projects
    await ctx.db.insert("projects", {
      title: "Portfolio V2",
      slug: "portfolio-v2",
      shortDescription: "My personal portfolio built with TanStack Start and Convex.",
      fullDescription: "A modern, high-performance portfolio...",
      techStack: ["React", "TypeScript", "Convex", "TailwindCSS"],
      images: [],
      isFeatured: true,
      displayOrder: 1,
      isVisible: true,
    });
    await ctx.db.insert("projects", {
      title: "Legacy App",
      slug: "legacy-app",
      shortDescription: "Old project.",
      techStack: ["PHP", "jQuery"],
      images: [],
      isFeatured: false,
      displayOrder: 2,
      isVisible: true,
    });

    // 4. Seed Blog
    // Create categories first
    const existingCats = await ctx.db.query("blogCategories").collect();
    let techCatId;
    if (existingCats.length > 0) {
      techCatId = existingCats[0]._id;
    } else {
      techCatId = await ctx.db.insert("blogCategories", {
        name: "Tech",
        slug: "tech",
        displayOrder: 1
      });
    }

    await ctx.db.insert("blogPosts", {
      title: "Hello World",
      slug: "hello-world",
      content: "# Hello World\nWelcome to my blog.",
      excerpt: "My first post.",
      status: "published",
      publishedAt: Date.now(),
      categoryId: techCatId,
      tagIds: [],
    });

    console.log("Full seed complete.");
  },
});
