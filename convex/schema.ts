import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  // Auth tables (managed by Convex Auth)
  ...authTables,

  // Skills
  skills: defineTable({
    name: v.string(),
    category: v.union(
      v.literal("devops"),
      v.literal("backend"),
      v.literal("frontend"),
      v.literal("tools")
    ),
    icon: v.optional(v.string()),
    proficiency: v.number(), // 0-100
    yearsOfExperience: v.optional(v.number()),
    description: v.optional(v.string()),
    displayOrder: v.number(),
    isVisible: v.boolean(),
  })
    .index("by_category", ["category"])
    .index("by_order", ["displayOrder"]),

  // Projects
  projects: defineTable({
    slug: v.string(),
    title: v.string(),
    shortDescription: v.optional(v.string()),
    fullDescription: v.optional(v.string()),
    thumbnailUrl: v.optional(v.string()),
    images: v.array(v.string()),
    techStack: v.array(v.string()),
    liveDemoUrl: v.optional(v.string()),
    githubUrl: v.optional(v.string()),
    isFeatured: v.boolean(),
    displayOrder: v.number(),
    isVisible: v.boolean(),
  })
    .index("by_slug", ["slug"])
    .index("by_featured", ["isFeatured"])
    .index("by_order", ["displayOrder"]),

  // Blog Categories
  blogCategories: defineTable({
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    displayOrder: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_order", ["displayOrder"]),

  // Blog Tags
  blogTags: defineTable({
    name: v.string(),
    slug: v.string(),
  }).index("by_slug", ["slug"]),

  // Blog Posts
  blogPosts: defineTable({
    slug: v.string(),
    title: v.string(),
    excerpt: v.optional(v.string()),
    content: v.string(),
    coverImageUrl: v.optional(v.string()),
    categoryId: v.optional(v.id("blogCategories")),
    tagIds: v.array(v.id("blogTags")),
    status: v.union(v.literal("draft"), v.literal("published")),
    readingTime: v.optional(v.number()),
    publishedAt: v.optional(v.number()), // timestamp
  })
    .index("by_slug", ["slug"])
    .index("by_status", ["status"])
    .index("by_published", ["publishedAt"])
    .index("by_category", ["categoryId"]),

  // Uses Items
  usesItems: defineTable({
    category: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    url: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    displayOrder: v.number(),
    isVisible: v.boolean(),
  })
    .index("by_category", ["category"])
    .index("by_order", ["displayOrder"]),

  // Resume Profile (singleton pattern - one document)
  resumeProfile: defineTable({
    fullName: v.string(),
    title: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    location: v.optional(v.string()),
    summary: v.optional(v.string()),
    linkedinUrl: v.optional(v.string()),
    githubUrl: v.optional(v.string()),
    websiteUrl: v.optional(v.string()),
  }),

  // Work Experiences
  workExperiences: defineTable({
    company: v.string(),
    role: v.string(),
    location: v.optional(v.string()),
    startDate: v.string(), // ISO date string
    endDate: v.optional(v.string()), // null = current
    description: v.optional(v.string()),
    displayOrder: v.number(),
    isVisible: v.boolean(),
  }).index("by_order", ["displayOrder"]),

  // Education
  education: defineTable({
    institution: v.string(),
    degree: v.string(),
    field: v.optional(v.string()),
    startDate: v.string(),
    endDate: v.optional(v.string()),
    description: v.optional(v.string()),
    displayOrder: v.number(),
    isVisible: v.boolean(),
  }).index("by_order", ["displayOrder"]),

  // Certifications
  certifications: defineTable({
    name: v.string(),
    issuer: v.string(),
    issueDate: v.string(),
    expiryDate: v.optional(v.string()),
    credentialUrl: v.optional(v.string()),
    displayOrder: v.number(),
    isVisible: v.boolean(),
  }).index("by_order", ["displayOrder"]),

  // Contact Submissions
  contactSubmissions: defineTable({
    name: v.string(),
    email: v.string(),
    subject: v.string(),
    message: v.string(),
    isRead: v.boolean(),
  }).index("by_read", ["isRead"]),

  // Site Settings (key-value store pattern)
  siteSettings: defineTable({
    key: v.string(),
    value: v.any(),
  }).index("by_key", ["key"]),

  // Media Files (metadata only, actual files in R2)
  mediaFiles: defineTable({
    filename: v.string(),
    originalFilename: v.string(),
    mimeType: v.string(),
    size: v.number(),
    url: v.string(),
    altText: v.optional(v.string()),
  }),
});
