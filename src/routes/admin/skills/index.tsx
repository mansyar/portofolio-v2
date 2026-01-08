import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { useState } from 'react'
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Eye, 
  EyeOff, 
  Search,
  ListFilter
} from 'lucide-react'

export const Route = createFileRoute('/admin/skills/')({
  component: SkillsList,
})

function SkillsList() {
  const skills = useQuery(api.skills.listAll)
  const removeSkill = useMutation(api.skills.remove)
  const toggleVisibility = useMutation(api.skills.toggleVisibility)
  
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [search, setSearch] = useState('')

  if (!skills) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-10 bg-(--color-surface) w-full rounded" />
        <div className="h-64 bg-(--color-surface) w-full rounded" />
      </div>
    )
  }

  const filteredSkills = skills.filter(skill => {
    const matchesCategory = filterCategory === 'all' || skill.category === filterCategory
    const matchesSearch = skill.name.toLowerCase().includes(search.toLowerCase())
    return matchesCategory && matchesSearch
  })

  // Group categories for filter
  const categories = ['all', 'devops', 'backend', 'frontend', 'tools']

  const handleDelete = async (id: any) => {
    if (confirm('Are you sure you want to delete this skill?')) {
      await removeSkill({ id })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold font-mono text-(--color-ubuntu-orange)">Skill Database</h1>
        <Link to="/admin/skills/new" className="terminal-button">
          <Plus size={18} />
          <span>Add New Skill</span>
        </Link>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         <div className="relative">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-(--color-text-secondary)" size={18} />
           <input 
             type="text" 
             placeholder="Search skills..." 
             className="w-full bg-(--color-surface) border border-(--color-border) rounded pl-10 pr-4 py-2 text-sm font-mono focus:border-(--color-ubuntu-orange) outline-none"
             value={search}
             onChange={(e) => setSearch(e.target.value)}
           />
         </div>
         <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
            <ListFilter size={18} className="text-(--color-text-secondary) shrink-0" />
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-3 py-1 rounded text-xs font-mono capitalize border transition-colors ${
                  filterCategory === cat 
                    ? 'bg-(--color-ubuntu-orange) text-white border-(--color-ubuntu-orange)' 
                    : 'border-(--color-border) text-(--color-text-secondary) hover:bg-(--color-surface)'
                }`}
              >
                {cat}
              </button>
            ))}
         </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-(--color-surface) text-(--color-text-secondary) font-mono text-sm">
                <th className="p-4 border-b border-(--color-border)">Order</th>
                <th className="p-4 border-b border-(--color-border)">Name</th>
                <th className="p-4 border-b border-(--color-border)">Category</th>
                <th className="p-4 border-b border-(--color-border)">Proficiency</th>
                <th className="p-4 border-b border-(--color-border)">Status</th>
                <th className="p-4 border-b border-(--color-border) text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-(--color-border)">
              {filteredSkills.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-(--color-text-secondary) font-mono text-sm">
                    No skills found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredSkills.map(skill => (
                  <tr key={skill._id} className="hover:bg-(--color-surface) transition-colors">
                    <td className="p-4 font-mono text-sm">{skill.displayOrder}</td>
                    <td className="p-4 font-bold">{skill.name}</td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-black/20 rounded text-xs font-mono uppercase text-(--color-text-secondary)">
                        {skill.category}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="w-24 h-2 bg-black/20 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-(--color-ubuntu-orange)" 
                          style={{ width: `${skill.proficiency}%` }}
                        />
                      </div>
                      <div className="text-xs text-(--color-text-secondary) mt-1">{skill.proficiency}%</div>
                    </td>
                    <td className="p-4">
                       {skill.isVisible ? (
                         <span className="text-(--color-terminal-green) text-xs flex items-center gap-1">
                           <Eye size={12} /> Visible
                         </span>
                       ) : (
                         <span className="text-(--color-text-secondary) text-xs flex items-center gap-1">
                           <EyeOff size={12} /> Hidden
                         </span>
                       )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => toggleVisibility({ id: skill._id })}
                          className="p-2 hover:bg-black/20 rounded text-(--color-text-secondary) hover:text-(--color-text-primary)"
                          title="Toggle Visibility"
                        >
                          {skill.isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                        <Link 
                          to="/admin/skills/$id" 
                          params={{ id: skill._id }}
                          className="p-2 hover:bg-black/20 rounded text-(--color-text-secondary) hover:text-(--color-ubuntu-orange)"
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </Link>
                         <button 
                          onClick={() => handleDelete(skill._id)}
                          className="p-2 hover:bg-black/20 rounded text-(--color-text-secondary) hover:text-(--color-terminal-red)"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
