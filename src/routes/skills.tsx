import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { convexQuery } from '@convex-dev/react-query'
import { api } from '../../convex/_generated/api'
import { Button } from '../components/ui/button'
import { Seo } from '../components/seo'
import { Terminal } from 'lucide-react'
import { Suspense } from 'react'
import { SkillsGrid } from '../components/features/skills/SkillsGrid'
import { SectionSkeleton } from '../components/ui/section-skeleton'

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
  const { category } = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })

  const setCategory = (newCategory: Category) => {
    navigate({
      search: { category: newCategory },
      replace: true,
    })
  }

  const categories: { id: Category; label: string }[] = [
    { id: 'all', label: 'All Systems' },
    { id: 'frontend', label: 'Frontend' },
    { id: 'backend', label: 'Backend' },
    { id: 'devops', label: 'DevOps' },
    { id: 'tools', label: 'Tools' },
  ];

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

      <Suspense fallback={<SectionSkeleton items={4} />}>
        <SkillsGrid category={category || 'all'} />
      </Suspense>
    </div>
  )
}
