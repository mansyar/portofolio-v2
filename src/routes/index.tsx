import { createFileRoute, Link } from '@tanstack/react-router'
import { convexQuery } from '@convex-dev/react-query'
import { useSuspenseQuery } from '@tanstack/react-query'
import { api } from '../../convex/_generated/api'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { SkillBar } from '../components/ui/skill-bar'
import { ProjectCard } from '../components/ui/project-card'
import { BlogCard } from '../components/ui/blog-card'
import { TypingEffect } from '../components/ui/typing-effect'
import { ArrowRight } from 'lucide-react'
import { TerminalWindow, CodeBlock } from '../components/ui/terminal-window'

export const Route = createFileRoute('/')({
  component: App,
  loader: async ({ context }) => {
    // Prefetch data for SSR
    await Promise.all([
      context.queryClient.ensureQueryData(convexQuery(api.projects.listFeatured, {})),
      context.queryClient.ensureQueryData(convexQuery(api.skills.listVisible, {})),
      context.queryClient.ensureQueryData(convexQuery(api.blog.listRecent, { limit: 3 })),
    ])
  }
})

function App() {
  const { data: skills } = useSuspenseQuery(convexQuery(api.skills.listVisible, {}))
  const { data: featuredProjects } = useSuspenseQuery(convexQuery(api.projects.listFeatured, {}))
  const { data: latestPosts } = useSuspenseQuery(convexQuery(api.blog.listRecent, { limit: 3 }))

  return (
    <div className="flex flex-col gap-16 pb-20 md:gap-24">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-10 pb-10 md:pt-20 lg:pt-32">
        <div className="relative z-10 container px-4 md:px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-8">
            <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center rounded border border-(--color-border) bg-(--color-surface) px-3 py-1 font-mono text-sm text-(--color-terminal-green)">
              <span className="mr-2 h-2 w-2 animate-pulse rounded-full bg-(--color-terminal-green)"></span>
              System Online
            </div>
            
            <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl">
              Full-Stack Developer <br />
              <span className="text-(--color-ubuntu-orange)">
                & <TypingEffect text="DevOps Engineer" speed={100} startDelay={1000} />
              </span>
            </h1>
            
            <p className="mb-8 max-w-2xl text-lg leading-relaxed text-(--color-text-secondary) md:text-xl">
              Building scalable applications and robust infrastructure with modern technologies. 
              Focused on performance, user experience, and clean code.
            </p>
            
            <div className="flex flex-wrap gap-4">
              <Link to="/projects">
                <Button size="lg" className="h-12 px-8 text-base">
                  View Projects <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/contact">
                <Button variant="secondary" size="lg" className="h-12 px-8 text-base">
                  Contact Me
                </Button>
              </Link>
            </div>
            </div>
            
            {/* Terminal Illustration */}
            <div className="hidden perspective-1000 lg:block">
              <div className="relative transform transition-transform duration-500 hover:rotate-1">
                 <TerminalWindow title="ansyar@portfolio:~/about" className="shadow-2xl">
                   <div className="mb-4 flex items-center gap-2 text-(--color-terminal-green)">
                     <span>$</span>
                     <TypingEffect text="cat me.ts" speed={50} />
                   </div>
                   <CodeBlock 
                     code={`interface Developer {
  name: "Ansyar";
  role: "Full Stack Developer";
  stack: ["React", "Convex", "DevOps"];
  passion: "Building great software";
  status: "Online";
}`} 
                   />
                   <div className="mt-4 flex items-center gap-2 text-(--color-terminal-green)">
                     <span>$</span>
                     <span className="h-5 w-2 animate-pulse bg-(--color-terminal-green)"></span>
                   </div>
                 </TerminalWindow>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Skills Preview */}
      <section className="container px-4 md:px-6">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="mb-2 text-2xl font-bold md:text-3xl">Technical Skills</h2>
            <p className="text-(--color-text-secondary)">Technologies I work with daily</p>
          </div>
          <Link to="/skills" className="hidden items-center font-mono text-(--color-ubuntu-orange) hover:underline md:inline-flex">
           view_all_skills() &gt;
          </Link>
        </div>
        
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
           {/* Manually grouped preview or just top skills */}
           <Card title="Frontend" className="h-full">
              <div className="flex flex-col gap-4">
                {skills.filter(s => s.category === 'frontend').slice(0, 4).map(skill => (
                  <SkillBar key={skill._id} name={skill.name} proficiency={skill.proficiency} />
                ))}
              </div>
           </Card>
           <Card title="Backend" className="h-full">
              <div className="flex flex-col gap-4">
                {skills.filter(s => s.category === 'backend').slice(0, 4).map(skill => (
                  <SkillBar key={skill._id} name={skill.name} proficiency={skill.proficiency} />
                ))}
              </div>
           </Card>
           <Card title="DevOps" className="h-full">
              <div className="flex flex-col gap-4">
                {skills.filter(s => s.category === 'devops').slice(0, 4).map(skill => (
                   <SkillBar key={skill._id} name={skill.name} proficiency={skill.proficiency} />
                ))}
              </div>
           </Card>
            <Card title="Tools" className="h-full">
              <div className="flex flex-col gap-4">
                {skills.filter(s => s.category === 'tools').slice(0, 4).map(skill => (
                  <SkillBar key={skill._id} name={skill.name} proficiency={skill.proficiency} />
                ))}
              </div>
           </Card>
        </div>
        
        <div className="mt-6 text-center md:hidden">
          <Link to="/skills" className="inline-flex items-center font-mono text-(--color-ubuntu-orange) hover:underline">
            view_all_skills() &gt;
          </Link>
        </div>
      </section>

      {/* Featured Projects */}
      <section className="container px-4 md:px-6">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="mb-2 text-2xl font-bold md:text-3xl">Featured Projects</h2>
            <p className="text-(--color-text-secondary)">Recent work and case studies</p>
          </div>
          <Link to="/projects" className="hidden items-center font-mono text-(--color-ubuntu-orange) hover:underline md:inline-flex">
           view_all_projects() &gt;
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {featuredProjects.length > 0 ? (
            featuredProjects.map((project) => (
              <ProjectCard
                key={project._id}
                title={project.title}
                slug={project.slug}
                shortDescription={project.shortDescription}
                techStack={project.techStack}
                // thumbnailUrl={project.images?.[0]} // Assuming images array
              />
            ))
          ) : (
             <div className="col-span-full rounded border border-dashed border-(--color-border) py-12 text-center">
                <p className="font-mono text-(--color-text-secondary)">No featured projects found.</p>
             </div>
          )}
        </div>
      </section>

      {/* Latest Blog */}
      <section className="container px-4 md:px-6">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="mb-2 text-2xl font-bold md:text-3xl">Latest from Blog</h2>
            <p className="text-(--color-text-secondary)">Thoughts on tech and development</p>
          </div>
          <Link to="/blog" className="hidden items-center font-mono text-(--color-ubuntu-orange) hover:underline md:inline-flex">
           read_more_posts() &gt;
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {latestPosts.length > 0 ? (
            latestPosts.map((post) => (
              <BlogCard
                key={post._id}
                title={post.title}
                slug={post.slug}
                excerpt={post.excerpt}
                publishedAt={post.publishedAt}
                readingTime={post.readingTime}
                // category={post.category} // Need to join category? API returns it?
                // Actually listPublished returns standard query result, likely just the doc.
                // We might need to join/fetch category name if needed, or update query.
                // For now, simple card.
              />
            ))
          ) : (
            <div className="col-span-full rounded border border-dashed border-(--color-border) py-12 text-center">
                <p className="font-mono text-(--color-text-secondary)">No blog posts found.</p>
             </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="container px-4 md:px-6">
        <div className="relative overflow-hidden rounded-lg border border-(--color-border) bg-(--color-surface) p-8 text-center md:p-12">
           <div className="relative z-10">
              <h2 className="mb-4 text-3xl font-bold md:text-4xl">Let's Work Together</h2>
              <p className="mx-auto mb-8 max-w-2xl text-lg text-(--color-text-secondary)">
                I'm currently available for freelance projects and remote roles. 
                If you have a project that needs some creative engineering, I'd love to hear about it.
              </p>
              <Link to="/contact">
                <Button size="lg" className="shadow-[0_0_20px_-5px_var(--color-ubuntu-orange) h-12 px-8 text-base">
                  Get in Touch
                </Button>
              </Link>
           </div>
           
           <div className="pointer-events-none absolute -top-24 -left-24 opacity-5">
              <div className="h-64 w-64 rounded-full bg-(--color-ubuntu-orange) blur-3xl"></div>
           </div>
        </div>
      </section>
    </div>
  )
}
