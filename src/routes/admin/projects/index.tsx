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
  Star
} from 'lucide-react'

export const Route = createFileRoute('/admin/projects/')({
  component: ProjectsList,
})

function ProjectsList() {
  const projects = useQuery(api.projects.listAll)
  const removeProject = useMutation(api.projects.remove)
  const toggleVisibility = useMutation(api.projects.toggleVisibility)
  
  const [search, setSearch] = useState('')

  if (!projects) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-10 bg-(--color-surface) w-full rounded" />
        <div className="h-64 bg-(--color-surface) w-full rounded" />
      </div>
    )
  }

  const filteredProjects = projects.filter(p => 
    p.title.toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = async (id: any) => {
    if (confirm('Are you sure you want to delete this project?')) {
      await removeProject({ id })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold font-mono text-(--color-ubuntu-orange)">Project Portfolio</h1>
        <Link to="/admin/projects/new" className="terminal-button">
          <Plus size={18} />
          <span>New Project</span>
        </Link>
      </div>

      {/* Filter */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-(--color-text-secondary)" size={18} />
        <input 
          type="text" 
          placeholder="Search projects..." 
          className="w-full bg-(--color-surface) border border-(--color-border) rounded pl-10 pr-4 py-2 text-sm font-mono focus:border-(--color-ubuntu-orange) outline-none"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-(--color-surface) text-(--color-text-secondary) font-mono text-sm">
                <th className="p-4 border-b border-(--color-border)">Order</th>
                <th className="p-4 border-b border-(--color-border)">Title</th>
                <th className="p-4 border-b border-(--color-border)">Tech</th>
                <th className="p-4 border-b border-(--color-border)">Featured</th>
                <th className="p-4 border-b border-(--color-border)">Status</th>
                <th className="p-4 border-b border-(--color-border) text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-(--color-border)">
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-(--color-text-secondary) font-mono text-sm">
                    No projects found.
                  </td>
                </tr>
              ) : (
                filteredProjects.map(project => (
                  <tr key={project._id} className="hover:bg-(--color-surface) transition-colors">
                    <td className="p-4 font-mono text-sm">{project.displayOrder}</td>
                    <td className="p-4 font-bold">
                       <div>{project.title}</div>
                       <div className="text-xs text-(--color-text-secondary) font-normal font-mono">{project.slug}</div>
                    </td>
                    <td className="p-4">
                       <div className="flex flex-wrap gap-1 max-w-[200px]">
                         {project.techStack.slice(0, 3).map(tech => (
                           <span key={tech} className="text-[10px] bg-black/20 px-1.5 py-0.5 rounded font-mono text-(--color-text-secondary)">
                             {tech}
                           </span>
                         ))}
                         {project.techStack.length > 3 && (
                           <span className="text-[10px] text-(--color-text-secondary)">+{project.techStack.length - 3}</span>
                         )}
                       </div>
                    </td>
                    <td className="p-4">
                       {project.isFeatured && <Star size={16} className="text-(--color-terminal-yellow) fill-(--color-terminal-yellow)" />}
                    </td>
                    <td className="p-4">
                       {project.isVisible ? (
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
                          onClick={() => toggleVisibility({ id: project._id })}
                          className="p-2 hover:bg-black/20 rounded text-(--color-text-secondary) hover:text-(--color-text-primary)"
                          title="Toggle Visibility"
                        >
                          {project.isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                        <Link 
                          to="/admin/projects/$id" 
                          params={{ id: project._id }}
                          className="p-2 hover:bg-black/20 rounded text-(--color-text-secondary) hover:text-(--color-ubuntu-orange)"
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </Link>
                         <button 
                          onClick={() => handleDelete(project._id)}
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
