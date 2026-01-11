import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { api } from "../../../../convex/_generated/api";
import { Card } from "../../ui/card";
import { Mail, MapPin, Github, Linkedin, Terminal } from "lucide-react";
import { DownloadResumeButton } from "../DownloadResumeButton";

export function ProfileSection() {
  const { data: profile } = useSuspenseQuery(convexQuery(api.resume.getProfile, {}));

  return (
    <section className="container px-4 pt-10 md:px-6">
      <div className="flex flex-col items-start gap-10 md:flex-row">
        <div className="w-full shrink-0 md:w-1/3">
          <div className="group relative aspect-square overflow-hidden rounded-lg border border-(--color-border) bg-(--color-surface) shadow-2xl">
            <div className="absolute inset-0 flex items-center justify-center bg-(--color-surface-dark) text-(--color-text-secondary)">
              <Terminal size={64} className="opacity-50" />
            </div>
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
  );
}
