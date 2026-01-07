import { createFileRoute } from '@tanstack/react-router'
import { convexQuery } from '@convex-dev/react-query'
import { useSuspenseQuery } from '@tanstack/react-query'
import { api } from '../../convex/_generated/api'
import { UsesItem } from '../components/ui/uses-item'
import { Seo } from '../components/seo'
import { Terminal } from 'lucide-react'

export const Route = createFileRoute('/uses')({
  component: Uses,
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(convexQuery(api.uses.listVisible, {}))
  }
})

function Uses() {
  const { data: items } = useSuspenseQuery(convexQuery(api.uses.listVisible, {}))

  // Group items by category
  const groups: Record<string, typeof items> = {};
  items.forEach(item => {
    if (!groups[item.category]) groups[item.category] = [];
    groups[item.category].push(item);
  });

  const categoryOrder = ['hardware', 'software', 'accessories', 'other'];

  return (
    <div className="container flex flex-col gap-8 px-4 pt-10 pb-20 md:px-6">
      <Seo 
        title="Uses | Portfolio" 
        description="A list of hardware, software, and tools I use on a daily basis." 
      />

      <div className="flex flex-col gap-4">
        <h1 className="flex items-center gap-3 text-3xl font-bold md:text-4xl">
          <Terminal className="text-(--color-ubuntu-orange)" />
          /uses
        </h1>
        <p className="max-w-2xl text-(--color-text-secondary)">
          A curated list of the tech I use, from editor themes to desk setup.
        </p>
      </div>

      <div className="flex flex-col gap-10">
        {categoryOrder.map(category => {
          const categoryItems = groups[category];
          if (!categoryItems || categoryItems.length === 0) return null;

          return (
            <section key={category}>
              <h2 className="mb-6 inline-block border-b border-(--color-border) pb-2 text-2xl font-bold text-(--color-ubuntu-purple) capitalize">
                {category}
              </h2>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                 {categoryItems.map(item => (
                   <UsesItem 
                     key={item._id}
                     name={item.name}
                     description={item.description}
                     imageUrl={item.imageUrl}
                     url={item.url}
                   />
                 ))}
              </div>
            </section>
          )
        })}

        {items.length === 0 && (
           <div className="rounded border border-dashed border-(--color-border) py-12 text-center">
              <p className="font-mono text-(--color-text-secondary)">No items found.</p>
           </div>
        )}
      </div>
    </div>
  )
}
