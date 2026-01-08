import { createFileRoute } from '@tanstack/react-router'
import { convexQuery } from '@convex-dev/react-query'
import { useSuspenseQuery } from '@tanstack/react-query'
import { api } from '../../convex/_generated/api'
import { Card } from '../components/ui/card'
import { Timeline } from '../components/ui/timeline'
import { Seo } from '../components/seo'
import { MapPin, Mail, Github, Linkedin, Terminal } from 'lucide-react'
import { DownloadResumeButton } from '../components/features/DownloadResumeButton'

export const Route = createFileRoute('/about')({
  component: About,
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(convexQuery(api.resume.getProfile, {})),
      context.queryClient.ensureQueryData(convexQuery(api.resume.getExperiences, {})),
      context.queryClient.ensureQueryData(convexQuery(api.resume.getEducation, {})),
    ])
  }
})

function About() {
  const { data: profile } = useSuspenseQuery(convexQuery(api.resume.getProfile, {}))
  const { data: work } = useSuspenseQuery(convexQuery(api.resume.getExperiences, {}))
  const { data: education } = useSuspenseQuery(convexQuery(api.resume.getEducation, {}))

  // Transform for timeline
  const workItems = work.map(w => ({
    _id: w._id,
    year: w.startDate.slice(0, 4), // Extract year from startDate
    title: w.role,
    subtitle: w.company,
    description: w.description
  }));

  const eduItems = education.map(e => ({
    _id: e._id,
    year: e.startDate.slice(0, 4), // Extract year from startDate
    title: e.degree,
    subtitle: e.institution,
    description: e.field // Use 'field' not 'fieldOfStudy'
  }));

  return (
    <div className="flex flex-col gap-12 pb-20">
      <Seo 
        title="About Me | Portfolio" 
        description={profile?.summary || "About Me"} 
      />

      {/* Hero / Profile Header */}
      <section className="container px-4 pt-10 md:px-6">
        <div className="flex flex-col items-start gap-10 md:flex-row">
           <div className="w-full shrink-0 md:w-1/3">
             <div className="group relative aspect-square overflow-hidden rounded-lg border border-(--color-border) bg-(--color-surface) shadow-2xl">
               {/* Placeholder for profile image if we had one */}
               <div className="absolute inset-0 flex items-center justify-center bg-(--color-surface-dark) text-(--color-text-secondary)">
                 <Terminal size={64} className="opacity-50" />
               </div>
               {/* <img src="..." /> */}
               
               {/* Glitch overlay effect on hover? */}
               <div className="pointer-events-none absolute inset-0 bg-(--color-ubuntu-orange)/10 opacity-0 mix-blend-overlay transition-opacity group-hover:opacity-100"></div>
             </div>
             
             <div className="mt-6 flex flex-col gap-3">
               <a href={`mailto:${profile?.email}`} className="flex items-center gap-2 text-(--color-text-secondary) transition-colors hover:text-(--color-ubuntu-orange)">
                 <Mail size={16} />
                 <span>{profile?.email || 'email@example.com'}</span>
               </a>
               <div className="flex items-center gap-2 text-(--color-text-secondary)">
                 <MapPin size={16} />
                 <span>{profile?.location || 'Location'}</span>
               </div>
               <div className="mt-2 flex gap-4">
                 {profile?.githubUrl && (
                   <a href={profile.githubUrl} target="_blank" rel="noopener noreferrer" className="rounded border border-(--color-border) p-2 transition-colors hover:border-(--color-ubuntu-orange) hover:text-(--color-ubuntu-orange)">
                     <Github size={20} />
                   </a>
                 )}
                 {profile?.linkedinUrl && (
                   <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer" className="rounded border border-(--color-border) p-2 transition-colors hover:border-(--color-ubuntu-orange) hover:text-(--color-ubuntu-orange)">
                     <Linkedin size={20} />
                   </a>
                 )}
               </div>
                <DownloadResumeButton />
             </div>
           </div>
           
           <div className="flex-1">
             <h1 className="mb-4 text-4xl font-bold md:text-5xl">{profile?.fullName || 'Full Name'}</h1>
             <h2 className="mb-6 font-mono text-xl text-(--color-ubuntu-orange) md:text-2xl">{profile?.title || 'Developer'}</h2>
             
             <div className="prose prose-invert max-w-none text-(--color-text-primary)">
               <p className="mb-6 text-lg leading-relaxed">
                 {profile?.summary || "I am a developer..."}
               </p>
               <p className="text-(--color-text-secondary)">
                 (More detailed bio content could go here. This is currently using the summary from the resume profile.)
               </p>
             </div>

             <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
               <Card title="Services">
                 <ul className="space-y-2 text-sm">
                   {profile?.services?.map((service, i) => (
                     <li key={i} className="flex items-center gap-2">
                       <span className="text-(--color-terminal-green)">✓</span> {service}
                     </li>
                   ))}
                   {(!profile?.services || profile.services.length === 0) && (
                     <li className="text-(--color-text-secondary) italic">No services listed yet.</li>
                   )}
                 </ul>
               </Card>
               <Card title="Interests">
                 <ul className="space-y-2 text-sm">
                   {profile?.interests?.map((interest, i) => (
                     <li key={i} className="flex items-center gap-2">
                       <span className="text-(--color-ubuntu-orange)">➜</span> {interest}
                     </li>
                   ))}
                   {(!profile?.interests || profile.interests.length === 0) && (
                     <li className="text-(--color-text-secondary) italic">No interests listed yet.</li>
                   )}
                 </ul>
               </Card>
             </div>
           </div>
        </div>
      </section>

      {/* Experience Section */}
      <section className="container px-4 md:px-6">
        <h2 className="mb-8 flex items-center gap-3 text-3xl font-bold">
          <Terminal className="text-(--color-ubuntu-orange)" />
          Experience
        </h2>
        <div className="rounded-lg border border-(--color-border) bg-(--color-surface)/50 p-6 md:p-10">
          {workItems.length > 0 ? (
            <Timeline items={workItems} />
          ) : (
            <p className="text-(--color-text-secondary)">No experience data found.</p>
          )}
        </div>
      </section>

      {/* Education Section */}
      <section className="container px-4 md:px-6">
        <h2 className="mb-8 text-3xl font-bold">Education</h2>
        <div className="rounded-lg border border-(--color-border) bg-(--color-surface)/50 p-6 md:p-10">
          {eduItems.length > 0 ? (
            <Timeline items={eduItems} />
          ) : (
             <p className="text-(--color-text-secondary)">No education data found.</p>
          )}
        </div>
      </section>
    </div>
  )
}
