import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { convexQuery } from '@convex-dev/react-query'
import { useSuspenseQuery } from '@tanstack/react-query'
import { api } from '../../convex/_generated/api'
import { SkillBar } from '../components/ui/skill-bar'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Seo } from '../components/seo'
import { useMemo } from 'react'
import { Terminal } from 'lucide-react'

// Define valid categories matches schema
type Category = 'all' | 'frontend' | 'backend' | 'devops' | 'tools';

export const Route = createFileRoute('/skills')({
  component: Skills,
  validateSearch: (search: Record<string, unknown>): { category?: Category } => {
    return {
      category: (search.category as Category) || 'all',
    }
  },
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(convexQuery(api.skills.listVisible, {}))
  }
})

function Skills() {
  const { data: skills } = useSuspenseQuery(convexQuery(api.skills.listVisible, {}))
  const { category } = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })

  const setCategory = (newCategory: Category) => {
    navigate({
      search: { category: newCategory },
      replace: true, // Replace history entry so back button works better
    })
  }

  const categories: { id: Category; label: string }[] = [
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

  // Group by category if 'all' is selected, otherwise just show list
  const groupedSkills = useMemo(() => {
    if (category !== 'all') {
      return { [category as string]: filteredSkills };
    }
    
    // Group logic
    const groups: Record<string, typeof skills> = {};
    filteredSkills.forEach(skill => {
      if (!groups[skill.category]) groups[skill.category] = [];
      groups[skill.category].push(skill);
    });
    return groups;
  }, [filteredSkills, category]);

  const categoryOrder = ['frontend', 'backend', 'devops', 'tools'];

  return (
    <div className="container flex flex-col gap-8 px-4 pt-10 pb-20 md:px-6">
      <Seo 
        title="Skills & Tech Stack | Portfolio" 
        description="My technical skills and proficiency in web development, DevOps, and cloud infrastructure." 
      />

      <div className="flex flex-col gap-4">
        <h1 className="flex items-center gap-3 text-3xl font-bold md:text-4xl">
          <Terminal className="text-(--color-terminal-green)" />
          Technical Proficiency
        </h1>
        <p className="max-w-2xl text-(--color-text-secondary)">
          A comprehensive list of technologies I work with. Proficiency levels indicate my comfort and experience level with each tool in a production environment.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="sticky top-[73px] z-40 -mx-6 flex flex-wrap gap-2 border-b border-(--color-border) bg-(--color-bg-primary)/90 px-6 py-4 backdrop-blur md:static md:mx-0 md:border-none md:bg-transparent md:px-0">
        {categories.map((cat) => (
          <Button
            key={cat.id}
            variant={category === cat.id ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setCategory(cat.id)}
            className="font-mono text-xs capitalize md:text-sm"
          >
            {cat.label}
          </Button>
        ))}
      </div>

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
    </div>
  )
}
