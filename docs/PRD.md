# Product Requirements Document (PRD)

## Portfolio Website + Custom CMS

**Project Name:** Ansyar's Portfolio  
**Domain:** ansyar-world.top  
**Author:** Mezy Ansyar  
**Role:** DevOps Engineer & Web Developer  
**Created:** January 4, 2026  
**Status:** Planning

---

## 1. Executive Summary

A fully-featured portfolio website with a custom-built CMS, designed to showcase DevOps and web development skills to recruiters, clients, and the general public. The primary goal is to land jobs by presenting a professional, high-performance, SEO-optimized portfolio with a unique **Ubuntu/Linux terminal-inspired design**.

### Key Differentiators

- **Unique Design:** Ubuntu-inspired terminal/techy aesthetic with monospace typography throughout
- **Custom CMS:** Full content management without relying on third-party headless CMS
- **Auto-Generated Resume:** PDF resume dynamically generated from CMS data
- **Learning Journey:** Built with TanStack Start to explore modern full-stack development

---

## 2. Target Audience

| Audience           | Goals                                 | Key Content                    |
| ------------------ | ------------------------------------- | ------------------------------ |
| **Recruiters**     | Evaluate technical skills, experience | Skills, Projects, Resume, Blog |
| **Clients**        | Assess capability for freelance work  | Projects, Contact Form, Skills |
| **General Public** | Discover DevOps/web content           | Blog, Uses Page                |

---

## 3. Technical Stack

### Frontend & Framework

| Technology          | Purpose                                              |
| ------------------- | ---------------------------------------------------- |
| **TanStack Start**  | Full-stack React framework (SSR, file-based routing) |
| **React 19**        | UI library                                           |
| **TypeScript**      | Type safety                                          |
| **TanStack Router** | Type-safe routing                                    |
| **TanStack Query**  | Server state management                              |

### Backend & Database

| Technology            | Purpose                                  |
| --------------------- | ---------------------------------------- |
| **Supabase**          | PostgreSQL database + Row Level Security |
| **Supabase Auth**     | Magic link authentication for CMS        |
| **Supabase Realtime** | Optional: real-time updates              |

### Storage & Media

| Technology        | Purpose                             |
| ----------------- | ----------------------------------- |
| **Cloudflare R2** | Image/media storage (S3-compatible) |
| **Sharp**         | Image optimization/processing       |

### Deployment & Infrastructure

| Technology  | Purpose                         |
| ----------- | ------------------------------- |
| **Docker**  | Containerization                |
| **Coolify** | Self-hosted PaaS for deployment |
| **Nginx**   | Reverse proxy (via Coolify)     |

### Development Tools

| Technology            | Purpose                                  |
| --------------------- | ---------------------------------------- |
| **Vite**              | Build tool (bundled with TanStack Start) |
| **ESLint + Prettier** | Code quality                             |
| **pnpm**              | Package manager                          |

---

## 4. Design System

### Theme: Ubuntu Terminal Inspired

The design takes inspiration from the Ubuntu desktop environment and Linux terminal aesthetics, creating a unique, techy portfolio that stands out.

#### Color Palette

```
Primary Colors (Ubuntu-inspired):
├── Ubuntu Orange:     #E95420 (accent, CTAs, highlights)
├── Ubuntu Purple:     #772953 (secondary accent)
├── Aubergine:         #2C001E (deep backgrounds)
└── Warm Grey:         #AEA79F (muted text)

Terminal Colors:
├── Terminal BG Dark:  #300A24 (dark mode background)
├── Terminal BG Light: #FFFFFF (light mode background)
├── Terminal Green:    #4E9A06 (success, active states)
├── Terminal Red:      #CC0000 (errors, warnings)
├── Terminal Yellow:   #C4A000 (warnings, highlights)
└── Terminal Cyan:     #06989A (links, info)

Neutral Colors:
├── Text Primary:      #FFFFFF (dark) / #2C001E (light)
├── Text Secondary:    #AEA79F
├── Border:            #5E2750
└── Surface:           #3D0A2E (dark) / #F5F5F5 (light)
```

#### Typography

```
Font Stack (Monospace Throughout):
├── Primary:    'Ubuntu Mono', monospace
├── Fallback:   'JetBrains Mono', 'Fira Code', 'Consolas', monospace
└── System:     ui-monospace, SFMono-Regular, Menlo

Font Sizes:
├── Display:    3rem (48px) - Hero titles
├── H1:         2.25rem (36px)
├── H2:         1.875rem (30px)
├── H3:         1.5rem (24px)
├── Body:       1rem (16px)
├── Small:      0.875rem (14px)
└── Code:       0.9rem (14.4px)

Font Weights:
├── Regular:    400
├── Medium:     500
└── Bold:       700
```

#### Design Elements

| Element            | Style                                                                    |
| ------------------ | ------------------------------------------------------------------------ |
| **Buttons**        | Terminal-style with `$` or `>` prefix, hover shows "executing" animation |
| **Cards**          | Window-like with title bar (minimize, maximize, close dots)              |
| **Inputs**         | Terminal prompt style with blinking cursor                               |
| **Navigation**     | Tab-style like terminal tabs or file manager                             |
| **Code Blocks**    | Syntax highlighted with terminal header                                  |
| **Loading States** | ASCII spinners, progress bars like `[████████░░]`                        |
| **Cursors**        | Block cursor on interactive elements                                     |
| **Scrollbars**     | Thin, styled to match theme                                              |

#### Motion & Animation

```
Transitions:
├── Default:        150ms ease-out
├── Page:           300ms ease-in-out
├── Hover:          100ms ease
└── Loading:        Infinite pulse/blink

Animations:
├── Typing Effect:  For hero text, command outputs
├── Cursor Blink:   500ms interval
├── Slide In:       For page transitions
└── Fade:           For modals, overlays
```

#### Theme Modes

| Mode                  | Trigger                                 |
| --------------------- | --------------------------------------- |
| **System Preference** | Default: follows `prefers-color-scheme` |
| **Manual Toggle**     | User can override with toggle button    |
| **Persistence**       | Preference saved to localStorage        |

---

## 5. Information Architecture

### Site Map

```
ansyar-world.top/
├── / (Home)
│   ├── Hero Section
│   ├── Featured Projects Carousel
│   ├── Skills Overview
│   └── Call to Action
│
├── /about
│   ├── Bio/Introduction
│   ├── Professional Journey
│   └── What I Do
│
├── /skills
│   ├── Skills by Category
│   │   ├── DevOps & Cloud
│   │   ├── Backend Development
│   │   ├── Frontend Development
│   │   └── Tools & Others
│   └── Proficiency Indicators
│
├── /projects
│   ├── All Projects Grid
│   ├── Filter by Tech Stack
│   └── /projects/[slug] (Project Detail)
│
├── /blog
│   ├── All Posts (paginated)
│   ├── Filter by Category
│   ├── Filter by Tag
│   └── /blog/[slug] (Post Detail)
│       ├── Reading Time
│       ├── Table of Contents
│       └── Share Links
│
├── /uses
│   ├── Hardware
│   ├── Software & Tools
│   ├── Development Setup
│   └── Productivity
│
├── /contact
│   ├── Contact Form
│   ├── Social Links
│   └── Email CTA
│
├── /resume (Download)
│   └── Auto-generated PDF
│
└── /admin (CMS - Protected)
    ├── /admin/login
    ├── /admin/dashboard
    ├── /admin/projects
    ├── /admin/blog
    ├── /admin/skills
    ├── /admin/uses
    ├── /admin/resume
    ├── /admin/settings
    └── /admin/media
```

---

## 6. Feature Specifications

### 6.1 Public Pages

#### 6.1.1 Home Page (`/`)

| Section               | Content                    | Features                                 |
| --------------------- | -------------------------- | ---------------------------------------- |
| **Hero**              | Name, title, tagline, CTAs | Typing animation effect                  |
| **Featured Projects** | 3-5 selected projects      | Carousel with auto-play, manual controls |
| **Skills Preview**    | Top skill categories       | Links to full skills page                |
| **Latest Blog Posts** | 2-3 recent posts           | Title, date, reading time                |
| **CTA Section**       | Contact prompt             | Link to contact form                     |

#### 6.1.2 About Page (`/about`)

| Section          | Content                       |
| ---------------- | ----------------------------- |
| **Introduction** | Professional bio, personality |
| **Journey**      | Career timeline/story         |
| **What I Do**    | Services/specializations      |
| **Fun Facts**    | Personal touches (optional)   |

#### 6.1.3 Skills Page (`/skills`)

| Feature                 | Description                                                  |
| ----------------------- | ------------------------------------------------------------ |
| **Categories**          | DevOps & Cloud, Backend, Frontend, Tools                     |
| **Skill Items**         | Icon, name, proficiency level, years of experience           |
| **Proficiency Display** | Progress bar (0-100%) or level indicator (Beginner → Expert) |
| **Filtering**           | Filter by category                                           |

**Skill Data Model:**

```typescript
interface Skill {
  id: string;
  name: string;
  category: "devops" | "backend" | "frontend" | "tools";
  icon: string; // URL or icon name
  proficiency: number; // 0-100
  yearsOfExperience?: number;
  description?: string;
  order: number;
  isVisible: boolean;
}
```

#### 6.1.4 Projects Page (`/projects`)

| Feature            | Description                                            |
| ------------------ | ------------------------------------------------------ |
| **Grid Layout**    | Responsive grid of project cards                       |
| **Project Card**   | Thumbnail, title, short description, tech stack badges |
| **Filtering**      | Filter by tech stack                                   |
| **Featured Badge** | Highlight featured projects                            |

**Project Data Model:**

```typescript
interface Project {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  fullDescription: string; // Rich text
  thumbnailUrl: string;
  images: string[]; // Gallery
  techStack: string[];
  liveDemoUrl?: string;
  githubUrl?: string;
  isFeatured: boolean;
  order: number;
  isVisible: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

#### 6.1.5 Project Detail Page (`/projects/[slug]`)

| Section              | Content                         |
| -------------------- | ------------------------------- |
| **Header**           | Title, tech stack badges        |
| **Image Gallery**    | Lightbox-enabled carousel       |
| **Description**      | Full rich-text description      |
| **Links**            | Live demo button, GitHub button |
| **Related Projects** | 2-3 similar projects            |

#### 6.1.6 Blog Page (`/blog`)

| Feature             | Description                                             |
| ------------------- | ------------------------------------------------------- |
| **Post List**       | Cards with title, excerpt, date, reading time, category |
| **Pagination**      | 10 posts per page                                       |
| **Category Filter** | Sidebar or dropdown                                     |
| **Tag Cloud**       | Popular tags                                            |
| **Search**          | Full-text search (optional for v1)                      |

**Blog Post Data Model:**

```typescript
interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string; // Auto-generated or manual
  content: string; // Rich text/HTML
  coverImageUrl?: string;
  category: string;
  tags: string[];
  status: "draft" | "published";
  readingTime: number; // Auto-calculated (minutes)
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  order: number;
}

interface Tag {
  id: string;
  name: string;
  slug: string;
}
```

#### 6.1.7 Blog Post Detail (`/blog/[slug]`)

| Section               | Content                                      |
| --------------------- | -------------------------------------------- |
| **Header**            | Title, date, reading time, category          |
| **Cover Image**       | Full-width or contained                      |
| **Table of Contents** | Auto-generated from headings, sticky sidebar |
| **Content**           | Rich text with syntax highlighting           |
| **Tags**              | Clickable tag badges                         |
| **Share Links**       | Twitter, LinkedIn, Copy URL                  |
| **Related Posts**     | 2-3 posts from same category                 |

#### 6.1.8 Uses Page (`/uses`)

| Category         | Examples                            |
| ---------------- | ----------------------------------- |
| **Hardware**     | Laptop, monitor, keyboard, mouse    |
| **Development**  | IDE, terminal, fonts, themes        |
| **DevOps Tools** | Docker, Kubernetes, Terraform, etc. |
| **Productivity** | Notes, task management, etc.        |
| **Services**     | Hosting, domains, etc.              |

**Uses Item Data Model:**

```typescript
interface UsesItem {
  id: string;
  category: string;
  name: string;
  description: string;
  url?: string;
  imageUrl?: string;
  order: number;
  isVisible: boolean;
}
```

#### 6.1.9 Contact Page (`/contact`)

| Element           | Details                                                    |
| ----------------- | ---------------------------------------------------------- |
| **Contact Form**  | Name, Email, Subject, Message                              |
| **Validation**    | Client + server-side                                       |
| **Submission**    | Sends email via Supabase Edge Function or external service |
| **Success State** | Confirmation message                                       |
| **Social Links**  | GitHub, LinkedIn icons                                     |

**Contact Form Data Model:**

```typescript
interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}
```

#### 6.1.10 Resume Download (`/resume`)

| Feature             | Description                                                      |
| ------------------- | ---------------------------------------------------------------- |
| **Auto-Generation** | PDF generated from CMS data                                      |
| **Sections**        | Summary, Experience, Education, Skills, Certifications, Projects |
| **Styling**         | Clean, professional, ATS-friendly                                |
| **Trigger**         | Generate on-demand or cache with rebuild                         |

**Resume Data Models:**

```typescript
interface ResumeProfile {
  id: string;
  fullName: string;
  title: string;
  email: string;
  phone?: string;
  location?: string;
  summary: string;
  linkedinUrl?: string;
  githubUrl?: string;
  websiteUrl?: string;
}

interface WorkExperience {
  id: string;
  company: string;
  role: string;
  location?: string;
  startDate: Date;
  endDate?: Date; // null = current
  description: string; // Rich text or bullet points
  order: number;
  isVisible: boolean;
}

interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startDate: Date;
  endDate?: Date;
  description?: string;
  order: number;
  isVisible: boolean;
}

interface Certification {
  id: string;
  name: string;
  issuer: string;
  issueDate: Date;
  expiryDate?: Date;
  credentialUrl?: string;
  order: number;
  isVisible: boolean;
}
```

---

### 6.2 CMS (Admin Panel)

#### 6.2.1 Authentication

| Feature          | Implementation                              |
| ---------------- | ------------------------------------------- |
| **Method**       | Magic Link (passwordless) via Supabase Auth |
| **Whitelisting** | Only allowed email(s) can access            |
| **Session**      | JWT with refresh tokens                     |
| **Protection**   | All `/admin/*` routes protected             |

#### 6.2.2 Dashboard (`/admin/dashboard`)

| Widget              | Content                                    |
| ------------------- | ------------------------------------------ |
| **Quick Stats**     | Total projects, posts, contact submissions |
| **Recent Activity** | Latest content updates                     |
| **Unread Messages** | Contact form submissions                   |
| **Quick Actions**   | New post, new project buttons              |

#### 6.2.3 Content Management

| Section        | Features                                             |
| -------------- | ---------------------------------------------------- |
| **Projects**   | CRUD, reorder, toggle visibility, toggle featured    |
| **Blog Posts** | CRUD, draft/publish toggle, category/tag management  |
| **Skills**     | CRUD, reorder, category management                   |
| **Uses**       | CRUD, reorder by category                            |
| **Resume**     | Edit profile, experiences, education, certifications |
| **Categories** | CRUD for blog categories                             |
| **Tags**       | CRUD for blog tags                                   |

#### 6.2.4 Rich Text Editor (WYSIWYG)

| Feature         | Implementation                              |
| --------------- | ------------------------------------------- |
| **Editor**      | TipTap or Lexical (React-based)             |
| **Formatting**  | Bold, italic, headings, lists, quotes       |
| **Media**       | Image upload/embed (to R2)                  |
| **Code Blocks** | Syntax highlighting with language selection |
| **Links**       | Internal and external links                 |
| **Embeds**      | YouTube, CodePen, etc.                      |

#### 6.2.5 Media Manager (`/admin/media`)

| Feature          | Description                  |
| ---------------- | ---------------------------- |
| **Upload**       | Drag-and-drop, multi-file    |
| **Storage**      | Cloudflare R2                |
| **Preview**      | Thumbnail grid               |
| **Operations**   | Delete, copy URL             |
| **Optimization** | Auto-resize, WebP conversion |

#### 6.2.6 Contact Submissions (`/admin/messages`)

| Feature           | Description                                     |
| ----------------- | ----------------------------------------------- |
| **List View**     | All submissions with read/unread status         |
| **Detail View**   | Full message content                            |
| **Actions**       | Mark as read, delete                            |
| **Notifications** | Email notification on new submission (optional) |

#### 6.2.7 Site Settings (`/admin/settings`)

| Setting                 | Purpose                              |
| ----------------------- | ------------------------------------ |
| **Profile**             | Name, bio, socials for site-wide use |
| **SEO Defaults**        | Default meta title, description      |
| **Resume PDF Settings** | Template preferences                 |

---

### 6.3 SEO & Performance

#### SEO Features

| Feature               | Implementation                                  |
| --------------------- | ----------------------------------------------- |
| **Meta Tags**         | Dynamic title, description per page             |
| **Open Graph**        | OG image, title, description for social sharing |
| **Twitter Cards**     | Summary large image cards                       |
| **Canonical URLs**    | Prevent duplicate content                       |
| **Sitemap**           | Auto-generated XML sitemap                      |
| **Robots.txt**        | Proper crawl directives                         |
| **Structured Data**   | JSON-LD for Person, Article, BreadcrumbList     |
| **Heading Hierarchy** | Proper H1-H6 structure                          |
| **Alt Text**          | Required for all images                         |

#### Performance Targets

| Metric                        | Target |
| ----------------------------- | ------ |
| **Lighthouse Performance**    | 95+    |
| **Lighthouse SEO**            | 100    |
| **Lighthouse Accessibility**  | 95+    |
| **Lighthouse Best Practices** | 95+    |
| **First Contentful Paint**    | < 1.5s |
| **Largest Contentful Paint**  | < 2.5s |
| **Time to Interactive**       | < 3.5s |
| **Cumulative Layout Shift**   | < 0.1  |

#### Performance Strategies

| Strategy               | Implementation                               |
| ---------------------- | -------------------------------------------- |
| **Image Optimization** | WebP format, responsive sizes, lazy loading  |
| **Code Splitting**     | Route-based splitting via TanStack Start     |
| **Caching**            | Aggressive caching headers, CDN              |
| **Preloading**         | Prefetch links on hover                      |
| **Font Loading**       | `font-display: swap`, preload critical fonts |
| **Minification**       | CSS/JS minification in production            |

---

## 7. Database Schema

### Supabase Tables

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Skills
CREATE TABLE skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL,
  icon VARCHAR(255),
  proficiency INTEGER CHECK (proficiency >= 0 AND proficiency <= 100),
  years_of_experience DECIMAL(3,1),
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug VARCHAR(255) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  short_description VARCHAR(500),
  full_description TEXT,
  thumbnail_url VARCHAR(500),
  images TEXT[], -- Array of URLs
  tech_stack TEXT[],
  live_demo_url VARCHAR(500),
  github_url VARCHAR(500),
  is_featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Blog Categories
CREATE TABLE blog_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Blog Tags
CREATE TABLE blog_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Blog Posts
CREATE TABLE blog_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug VARCHAR(255) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  cover_image_url VARCHAR(500),
  category_id UUID REFERENCES blog_categories(id),
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  reading_time INTEGER, -- minutes
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Blog Post Tags (junction table)
CREATE TABLE blog_post_tags (
  post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES blog_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);

-- Uses Items
CREATE TABLE uses_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  url VARCHAR(500),
  image_url VARCHAR(500),
  display_order INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Resume Profile
CREATE TABLE resume_profile (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name VARCHAR(255) NOT NULL,
  title VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  location VARCHAR(255),
  summary TEXT,
  linkedin_url VARCHAR(500),
  github_url VARCHAR(500),
  website_url VARCHAR(500),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Work Experience
CREATE TABLE work_experiences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company VARCHAR(255) NOT NULL,
  role VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  start_date DATE NOT NULL,
  end_date DATE, -- NULL = current position
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Education
CREATE TABLE education (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  institution VARCHAR(255) NOT NULL,
  degree VARCHAR(255) NOT NULL,
  field VARCHAR(255),
  start_date DATE NOT NULL,
  end_date DATE,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Certifications
CREATE TABLE certifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  issuer VARCHAR(255) NOT NULL,
  issue_date DATE NOT NULL,
  expiry_date DATE,
  credential_url VARCHAR(500),
  display_order INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contact Submissions
CREATE TABLE contact_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Site Settings (key-value store)
CREATE TABLE site_settings (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Media Files (metadata only, actual files in R2)
CREATE TABLE media_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  filename VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  size INTEGER NOT NULL, -- bytes
  url VARCHAR(500) NOT NULL,
  alt_text VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_projects_slug ON projects(slug);
CREATE INDEX idx_projects_featured ON projects(is_featured) WHERE is_featured = true;
CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX idx_blog_posts_status ON blog_posts(status);
CREATE INDEX idx_blog_posts_published ON blog_posts(published_at DESC) WHERE status = 'published';
CREATE INDEX idx_skills_category ON skills(category);

-- Row Level Security (RLS)
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_post_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE uses_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE resume_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE education ENABLE ROW LEVEL SECURITY;
ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_files ENABLE ROW LEVEL SECURITY;

-- Public read policies (for public content)
CREATE POLICY "Public can read visible skills" ON skills
  FOR SELECT USING (is_visible = true);

CREATE POLICY "Public can read visible projects" ON projects
  FOR SELECT USING (is_visible = true);

CREATE POLICY "Public can read categories" ON blog_categories
  FOR SELECT USING (true);

CREATE POLICY "Public can read tags" ON blog_tags
  FOR SELECT USING (true);

CREATE POLICY "Public can read published posts" ON blog_posts
  FOR SELECT USING (status = 'published');

CREATE POLICY "Public can read post tags" ON blog_post_tags
  FOR SELECT USING (true);

CREATE POLICY "Public can read visible uses" ON uses_items
  FOR SELECT USING (is_visible = true);

CREATE POLICY "Public can read resume profile" ON resume_profile
  FOR SELECT USING (true);

CREATE POLICY "Public can read visible experiences" ON work_experiences
  FOR SELECT USING (is_visible = true);

CREATE POLICY "Public can read visible education" ON education
  FOR SELECT USING (is_visible = true);

CREATE POLICY "Public can read visible certs" ON certifications
  FOR SELECT USING (is_visible = true);

CREATE POLICY "Public can submit contact" ON contact_submissions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can read media" ON media_files
  FOR SELECT USING (true);

-- Admin policies (for authenticated admin)
-- Note: Replace 'your-email@example.com' with actual admin email
CREATE POLICY "Admin full access to skills" ON skills
  FOR ALL USING (auth.jwt() ->> 'email' = 'your-email@example.com');

CREATE POLICY "Admin full access to projects" ON projects
  FOR ALL USING (auth.jwt() ->> 'email' = 'your-email@example.com');

CREATE POLICY "Admin full access to blog_posts" ON blog_posts
  FOR ALL USING (auth.jwt() ->> 'email' = 'your-email@example.com');

-- Add similar policies for other tables...
```

---

## 8. API Routes / Server Functions

### Public API (TanStack Start Server Functions)

| Route                    | Method | Description                     |
| ------------------------ | ------ | ------------------------------- |
| `/api/skills`            | GET    | Get all visible skills          |
| `/api/projects`          | GET    | Get all visible projects        |
| `/api/projects/[slug]`   | GET    | Get single project              |
| `/api/projects/featured` | GET    | Get featured projects           |
| `/api/blog/posts`        | GET    | Get published posts (paginated) |
| `/api/blog/posts/[slug]` | GET    | Get single post                 |
| `/api/blog/categories`   | GET    | Get all categories              |
| `/api/blog/tags`         | GET    | Get all tags                    |
| `/api/uses`              | GET    | Get all uses items              |
| `/api/resume`            | GET    | Get resume data                 |
| `/api/resume/pdf`        | GET    | Generate & download PDF         |
| `/api/contact`           | POST   | Submit contact form             |

### Admin API (Protected)

| Route                        | Method             | Description                |
| ---------------------------- | ------------------ | -------------------------- |
| `/api/admin/auth/login`      | POST               | Send magic link            |
| `/api/admin/auth/logout`     | POST               | Logout                     |
| `/api/admin/skills`          | CRUD               | Manage skills              |
| `/api/admin/projects`        | CRUD               | Manage projects            |
| `/api/admin/blog/posts`      | CRUD               | Manage posts               |
| `/api/admin/blog/categories` | CRUD               | Manage categories          |
| `/api/admin/blog/tags`       | CRUD               | Manage tags                |
| `/api/admin/uses`            | CRUD               | Manage uses items          |
| `/api/admin/resume/*`        | CRUD               | Manage resume data         |
| `/api/admin/media`           | CRUD               | Manage media files         |
| `/api/admin/messages`        | GET, PATCH, DELETE | Manage contact submissions |
| `/api/admin/settings`        | GET, PUT           | Site settings              |

---

## 9. Project Structure

```
portofolio-v2/
├── src/
│   ├── routes/
│   │   ├── __root.tsx              # Root layout
│   │   ├── index.tsx               # Home page
│   │   ├── about.tsx               # About page
│   │   ├── skills.tsx              # Skills page
│   │   ├── projects/
│   │   │   ├── index.tsx           # Projects list
│   │   │   └── $slug.tsx           # Project detail
│   │   ├── blog/
│   │   │   ├── index.tsx           # Blog list
│   │   │   └── $slug.tsx           # Post detail
│   │   ├── uses.tsx                # Uses page
│   │   ├── contact.tsx             # Contact page
│   │   ├── resume.tsx              # Resume download
│   │   ├── admin/
│   │   │   ├── _layout.tsx         # Admin layout (protected)
│   │   │   ├── login.tsx           # Login page
│   │   │   ├── dashboard.tsx       # Dashboard
│   │   │   ├── projects/
│   │   │   ├── blog/
│   │   │   ├── skills.tsx
│   │   │   ├── uses.tsx
│   │   │   ├── resume.tsx
│   │   │   ├── media.tsx
│   │   │   ├── messages.tsx
│   │   │   └── settings.tsx
│   │   └── api/
│   │       ├── skills.ts
│   │       ├── projects.ts
│   │       ├── blog.ts
│   │       ├── contact.ts
│   │       ├── resume.ts
│   │       └── admin/
│   ├── components/
│   │   ├── ui/                     # Base UI components
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── card.tsx
│   │   │   ├── modal.tsx
│   │   │   └── ...
│   │   ├── layout/
│   │   │   ├── header.tsx
│   │   │   ├── footer.tsx
│   │   │   ├── navigation.tsx
│   │   │   └── admin-sidebar.tsx
│   │   ├── features/
│   │   │   ├── hero.tsx
│   │   │   ├── project-card.tsx
│   │   │   ├── blog-card.tsx
│   │   │   ├── skill-item.tsx
│   │   │   ├── contact-form.tsx
│   │   │   ├── theme-toggle.tsx
│   │   │   └── ...
│   │   └── editor/
│   │       └── rich-text-editor.tsx
│   ├── hooks/
│   │   ├── use-theme.ts
│   │   ├── use-auth.ts
│   │   └── use-media-query.ts
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   ├── server.ts
│   │   │   └── types.ts
│   │   ├── r2/
│   │   │   └── client.ts
│   │   ├── utils.ts
│   │   └── constants.ts
│   ├── styles/
│   │   ├── globals.css
│   │   ├── variables.css
│   │   └── components/
│   ├── types/
│   │   └── index.ts
│   └── router.tsx                  # Router configuration
├── public/
│   ├── fonts/
│   ├── images/
│   └── favicon.ico
├── docker/
│   ├── Dockerfile
│   └── docker-compose.yml
├── docs/
│   └── PRD.md
├── .env.example
├── .env.local
├── package.json
├── tsconfig.json
├── app.config.ts                   # TanStack Start config
└── README.md
```

---

## 10. Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        COOLIFY                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                    Docker                            │    │
│  │  ┌─────────────────────────────────────────────┐    │    │
│  │  │         TanStack Start App                   │    │    │
│  │  │         (Node.js Container)                  │    │    │
│  │  │         Port: 3000                           │    │    │
│  │  └─────────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────────┘    │
│                           │                                  │
│                    Nginx Reverse Proxy                       │
│                    (Coolify managed)                         │
│                           │                                  │
│               ┌───────────┴───────────┐                     │
│               │   ansyar-world.top    │                     │
│               │   (SSL via Let's Encrypt)                   │
│               └───────────────────────┘                     │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│   Supabase    │   │ Cloudflare R2 │   │   Email       │
│   (Database)  │   │   (Media)     │   │   Service     │
│   (Auth)      │   │               │   │   (Resend?)   │
└───────────────┘   └───────────────┘   └───────────────┘
```

### Docker Configuration

```dockerfile
# Dockerfile
FROM node:20-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Dependencies
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Build
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

# Production
FROM base AS runner
ENV NODE_ENV=production

COPY --from=builder /app/.output ./.output
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
```

---

## 11. Environment Variables

```bash
# .env.example

# App
NODE_ENV=production
PUBLIC_APP_URL=https://ansyar-world.top

# Supabase
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Cloudflare R2
R2_ACCESS_KEY_ID=your-r2-access-key
R2_SECRET_ACCESS_KEY=your-r2-secret-key
R2_BUCKET_NAME=portfolio-media
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
PUBLIC_R2_PUBLIC_URL=https://media.ansyar-world.top

# Auth
ADMIN_EMAIL=your-email@example.com

# Email (for contact form)
RESEND_API_KEY=your-resend-key
CONTACT_EMAIL=contact@ansyar-world.top
```

---

## 12. Success Metrics

> **Note:** For development milestones and progress tracking, see [PROGRESS.md](./PROGRESS.md).

| Metric               | Target                                    |
| -------------------- | ----------------------------------------- |
| **Lighthouse Score** | 95+ across all categories                 |
| **Page Load Time**   | < 2 seconds                               |
| **SEO Visibility**   | Indexed on Google within 2 weeks          |
| **Uptime**           | 99.9%                                     |
| **CMS Usability**    | All content editable without code changes |

---

## 13. References

- [TanStack Start Documentation](https://tanstack.com/start)
- [Supabase Documentation](https://supabase.com/docs)
- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
- [Coolify Documentation](https://coolify.io/docs)
- [Ubuntu Brand Guidelines](https://design.ubuntu.com/)
