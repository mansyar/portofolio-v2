import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { api } from "../../../../convex/_generated/api";
import { Card } from "../../ui/card";
import { SkillBar } from "../../ui/skill-bar";

export function SkillsSection() {
  const { data: skills } = useSuspenseQuery(convexQuery(api.skills.listVisible, {}));

  return (
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
        <Card title="Frontend">
          <div className="flex flex-col gap-4">
            {skills.filter(s => s.category === 'frontend').slice(0, 4).map(skill => (
              <SkillBar key={skill._id} name={skill.name} proficiency={skill.proficiency} />
            ))}
          </div>
        </Card>
        <Card title="Backend">
          <div className="flex flex-col gap-4">
            {skills.filter(s => s.category === 'backend').slice(0, 4).map(skill => (
              <SkillBar key={skill._id} name={skill.name} proficiency={skill.proficiency} />
            ))}
          </div>
        </Card>
        <Card title="DevOps">
          <div className="flex flex-col gap-4">
            {skills.filter(s => s.category === 'devops').slice(0, 4).map(skill => (
              <SkillBar key={skill._id} name={skill.name} proficiency={skill.proficiency} />
            ))}
          </div>
        </Card>
        <Card title="Tools">
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
  );
}
