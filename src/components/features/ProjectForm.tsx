import { useState, useEffect } from 'react'
import { useRouter } from '@tanstack/react-router'
import { ChevronLeft, Save, X } from 'lucide-react'

export interface ProjectFormData {
  title: string
  slug: string
  shortDescription?: string
  fullDescription?: string
  thumbnailUrl?: string
  images: string[]
  techStack: string[]
  liveDemoUrl?: string
  githubUrl?: string
  isFeatured: boolean
  displayOrder: number
  isVisible: boolean
}

interface ProjectFormProps {
  initialData?: ProjectFormData
  onSubmit: (data: ProjectFormData) => Promise<void>
  isSubmitting: boolean
  title: string
}

export function ProjectForm({ initialData, onSubmit, isSubmitting, title }: ProjectFormProps) {
  const router = useRouter()
  
  const [formData, setFormData] = useState<ProjectFormData>({
    title: '',
    slug: '',
    shortDescription: '',
    fullDescription: '',
    thumbnailUrl: '',
    images: [],
    techStack: [],
    liveDemoUrl: '',
    githubUrl: '',
    isFeatured: false,
    displayOrder: 0,
    isVisible: true,
  })

  useEffect(() => {
    if (initialData) {
      setFormData(initialData)
    }
  }, [initialData])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked 
        : type === 'number' 
          ? Number(value) 
          : value
    }))
  }
  
  // Auto-generate slug from title if empty
  const handleTitleBlur = () => {
    if (!formData.slug && formData.title) {
       const slug = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
       setFormData(prev => ({ ...prev, slug }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(formData)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
         <div className="flex items-center gap-4">
            <button 
              onClick={() => router.history.back()}
              className="p-2 hover:bg-(--color-surface) rounded-full text-(--color-text-secondary) transition-colors"
            >
              <ChevronLeft />
            </button>
            <h1 className="text-2xl font-bold font-mono text-(--color-ubuntu-orange)">{title}</h1>
         </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6 space-y-6">
             <h3 className="section-title">Core Info</h3>
             
             <div>
               <label className="label">Project Title</label>
               <div className="terminal-input-wrapper">
                 <span className="terminal-prompt">&gt;</span>
                 <input
                   type="text"
                   name="title"
                   value={formData.title}
                   onChange={handleChange}
                   onBlur={handleTitleBlur}
                   className="terminal-input w-full"
                   required
                 />
               </div>
             </div>

             <div>
               <label className="label">Slug (URL)</label>
               <div className="terminal-input-wrapper">
                 <span className="text-gray-500 font-mono text-sm pl-2">/projects/</span>
                 <input
                   type="text"
                   name="slug"
                   value={formData.slug}
                   onChange={handleChange}
                   className="terminal-input w-full"
                   required
                 />
               </div>
             </div>

             <div>
                <label className="label">Short Description</label>
                <textarea
                  name="shortDescription"
                  value={formData.shortDescription || ''}
                  onChange={handleChange}
                  rows={2}
                  className="textarea"
                />
             </div>

             <div>
                <label className="label">Full Description (Markdown)</label>
                <textarea
                  name="fullDescription"
                  value={formData.fullDescription || ''}
                  onChange={handleChange}
                  rows={8}
                  className="textarea font-mono text-sm"
                />
             </div>
          </div>

          <div className="card p-6 space-y-6">
             <h3 className="section-title">Tech Stack & Media</h3>
             
             <ArrayInput 
                label="Tech Stack (Press Enter)"
                items={formData.techStack}
                onChange={items => setFormData(prev => ({...prev, techStack: items}))}
                placeholder="React, TypeScript..."
             />

             {/* Image placeholder - will be MediaPicker later */}
             <div>
               <label className="label">Thumbnail URL</label>
               <input 
                 type="text"
                 name="thumbnailUrl"
                 value={formData.thumbnailUrl || ''}
                 onChange={handleChange}
                 className="terminal-input-simple"
                 placeholder="https://..."
               />
             </div>
             
             <ArrayInput 
                label="Gallery Images (URLs)"
                items={formData.images}
                onChange={items => setFormData(prev => ({...prev, images: items}))}
                placeholder="https://..."
             />
          </div>
        </div>

        {/* Sidebar Settings */}
        <div className="space-y-6">
           <div className="card p-6 space-y-4">
              <h3 className="section-title">Settings</h3>

              <div>
                <label className="label">Display Order</label>
                <input
                   type="number"
                   name="displayOrder"
                   value={formData.displayOrder}
                   onChange={handleChange}
                   className="terminal-input-simple"
                />
              </div>

              <div className="flex items-center gap-3 border border-(--color-border) p-3 rounded bg-(--color-surface)">
                <input
                  type="checkbox"
                  name="isVisible"
                  checked={formData.isVisible}
                  onChange={handleChange}
                  className="checkbox"
                />
                <span className="text-sm font-mono">Visible Publicly</span>
              </div>

              <div className="flex items-center gap-3 border border-(--color-border) p-3 rounded bg-(--color-surface)">
                <input
                  type="checkbox"
                  name="isFeatured"
                  checked={formData.isFeatured}
                  onChange={handleChange}
                  className="checkbox"
                />
                <span className="text-sm font-mono text-(--color-terminal-yellow)">Featured Project</span>
              </div>
           </div>

           <div className="card p-6 space-y-4">
              <h3 className="section-title">External Links</h3>
              <div>
               <label className="label">Live Demo</label>
               <input 
                 type="text"
                 name="liveDemoUrl"
                 value={formData.liveDemoUrl || ''}
                 onChange={handleChange}
                 className="terminal-input-simple"
                 placeholder="https://..."
               />
             </div>
             <div>
               <label className="label">GitHub Repo</label>
               <input 
                 type="text"
                 name="githubUrl"
                 value={formData.githubUrl || ''}
                 onChange={handleChange}
                 className="terminal-input-simple"
                 placeholder="https://github.com/..."
               />
             </div>
           </div>

           <button
             type="submit"
             disabled={isSubmitting}
             className="terminal-button w-full justify-center"
           >
             <Save size={18} />
             {isSubmitting ? 'Saving...' : 'Save Project'}
           </button>
        </div>

      </form>
    </div>
  )
}

function ArrayInput({ label, items, onChange, placeholder }: { 
  label: string, 
  items: string[], 
  onChange: (items: string[]) => void, 
  placeholder?: string 
}) {
  const [input, setInput] = useState('')

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && input.trim()) {
      e.preventDefault()
      onChange([...items, input.trim()])
      setInput('')
    }
  }

  const remove = (index: number) => {
    onChange(items.filter((_, i) => i !== index))
  }

  return (
    <div>
      <label className="label">{label}</label>
      <div className="flex flex-wrap gap-2 mb-2">
        {items.map((item, i) => (
          <span key={i} className="bg-(--color-surface) border border-(--color-border) px-2 py-1 rounded text-xs font-mono flex items-center gap-1">
            {item}
            <button type="button" onClick={() => remove(i)} className="hover:text-(--color-terminal-red)">
              <X size={12} />
            </button>
          </span>
        ))}
      </div>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        className="terminal-input-simple"
        placeholder={placeholder}
      />
    </div>
  )
}
