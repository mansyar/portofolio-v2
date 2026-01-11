import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { api } from "../../../../convex/_generated/api";
import { Card } from "../../ui/card";
import { SkillBar } from "../../ui/skill-bar";

interface SkillsGridProps {
  category: string;
}

export function SkillsGrid({ category }: SkillsGridProps) {
  const { data: skills } = useSuspenseQuery(convexQuery(api.skills.listVisible, {}));

  const categories = [
    { id: 'all', label: 'All Systems' },
    { id: 'frontend', label: 'Frontend' },
    { id: 'backend', label: 'Backend' },
    { id: 'devops', label: 'DevOps' },
    { id: 'tools', label: 'Tools' },
  ];

  const filteredSkills = useMemo(() => {
    if (category === 'all') return skills;
    return skills.filter(s => s.category === category);
  }, [skills, category]);

  const groupedSkills = useMemo(() => {
    if (category !== 'all') {
      return { [category]: filteredSkills };
    }
    const groups: Record<string, typeof skills> = {};
    filteredSkills.forEach(skill => {
      if (!groups[skill.category]) groups[skill.category] = [];
      groups[skill.category].push(skill);
    });
    return groups;
  }, [filteredSkills, category]);

  const categoryOrder = ['frontend', 'backend', 'devops', 'tools'];

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
      {category === 'all' ? (
        categoryOrder.map(catKey => {
          const group = groupedSkills[catKey];
          if (!group || group.length === 0) return null;
          const catLabel = categories.find(c => c.id === catKey)?.label || catKey;

          return (
            <Card key={catKey} title={catLabel} className="h-fit">
               <div className="flex flex-col gap-5">
                 {group.map(skill => (
                   <SkillBar 
                     key={skill._id} 
                     name={skill.name} 
                     proficiency={skill.proficiency} 
                     icon={skill.icon}
                   />
                 ))}
               </div>
            </Card>
          )
        })
      ) : (
        <Card title={categories.find(c => c.id === category)?.label || category} className="col-span-full">
           <div className="grid grid-cols-1 gap-x-12 gap-y-6 md:grid-cols-2">
              {filteredSkills.map(skill => (
                 <SkillBar 
                   key={skill._id} 
                   name={skill.name} 
                   proficiency={skill.proficiency} 
                   icon={skill.icon}
                 />
              ))}
           </div>
        </Card>
      )}

      {filteredSkills.length === 0 && (
        <div className="col-span-full rounded border border-dashed border-(--color-border) py-12 text-center text-(--color-text-secondary)">
          No skills found in this category.
        </div>
      )}
    </div>
  );
}
