import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { api } from "../../../../convex/_generated/api";
import { UsesItem } from "../../ui/uses-item";

export function UsesContent() {
  const { data: items } = useSuspenseQuery(convexQuery(api.uses.listVisible, {}));

  // Group items by category (case-insensitive)
  const groups: Record<string, typeof items> = {};
  items.forEach(item => {
    const categoryKey = item.category.toLowerCase();
    if (!groups[categoryKey]) groups[categoryKey] = [];
    groups[categoryKey].push(item);
  });

  const categoryOrder = ['hardware', 'software', 'accessories', 'other'];
  
  // Get any categories not in the predefined order
  const additionalCategories = Object.keys(groups).filter(
    cat => !categoryOrder.includes(cat)
  );
  const allCategories = [...categoryOrder, ...additionalCategories];

  return (
    <div className="flex flex-col gap-10">
      {allCategories.map(category => {
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
  );
}
