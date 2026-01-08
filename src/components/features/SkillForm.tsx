import { useState, useEffect } from 'react'
import { useRouter } from '@tanstack/react-router'
import { ChevronLeft, Save } from 'lucide-react'

// Define the interface for the form data
export interface SkillFormData {
  name: string
  category: "devops" | "backend" | "frontend" | "tools"
  icon?: string
  proficiency: number
  yearsOfExperience?: number
  description?: string
  displayOrder: number
  isVisible: boolean
}

interface SkillFormProps {
  initialData?: SkillFormData
  onSubmit: (data: SkillFormData) => Promise<void>
  isSubmitting: boolean
  title: string
}

export function SkillForm({ initialData, onSubmit, isSubmitting, title }: SkillFormProps) {
  const router = useRouter()
  
  const [formData, setFormData] = useState<SkillFormData>({
    name: '',
    category: 'devops',
    icon: '',
    proficiency: 50,
    yearsOfExperience: 1,
    description: '',
    displayOrder: 0,
    isVisible: true,
  })

  useEffect(() => {
    if (initialData) {
      setFormData(initialData)
    }
  }, [initialData])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(formData)
  }

  return (
    <div className="max-w-2xl mx-auto">
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

      <div className="card p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Name & Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-mono text-(--color-text-secondary) mb-2">Skill Name</label>
              <div className="terminal-input-wrapper">
                <span className="terminal-prompt">$</span>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="terminal-input w-full"
                  placeholder="e.g. Docker"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-mono text-(--color-text-secondary) mb-2">Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full bg-transparent border border-(--color-border) rounded p-2 text-(--color-text-primary) font-mono focus:border-(--color-ubuntu-orange) outline-none"
              >
                <option value="devops" className="bg-(--color-surface)">DevOps</option>
                <option value="backend" className="bg-(--color-surface)">Backend</option>
                <option value="frontend" className="bg-(--color-surface)">Frontend</option>
                <option value="tools" className="bg-(--color-surface)">Tools</option>
              </select>
            </div>
          </div>

          {/* Proficiency & Experience */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div>
               <label className="block text-sm font-mono text-(--color-text-secondary) mb-2">
                 Proficiency ({formData.proficiency}%)
               </label>
               <input 
                 type="range"
                 name="proficiency"
                 min="0"
                 max="100"
                 value={formData.proficiency}
                 onChange={handleChange}
                 className="w-full h-2 bg-(--color-surface) rounded-lg appearance-none cursor-pointer accent-(--color-ubuntu-orange)"
               />
             </div>

             <div>
               <label className="block text-sm font-mono text-(--color-text-secondary) mb-2">Years Exp.</label>
               <div className="terminal-input-wrapper">
                 <input
                   type="number"
                   name="yearsOfExperience"
                   value={formData.yearsOfExperience || ''}
                   onChange={handleChange}
                   className="terminal-input w-full pl-2"
                   min="0"
                   step="0.5"
                 />
               </div>
             </div>
          </div>

          {/* Icon & Order */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-mono text-(--color-text-secondary) mb-2">Icon (URL/Name)</label>
              <div className="terminal-input-wrapper">
                 <input
                   type="text"
                   name="icon"
                   value={formData.icon || ''}
                   onChange={handleChange}
                   className="terminal-input w-full pl-2"
                   placeholder="e.g. docker-icon"
                 />
              </div>
            </div>

            <div>
              <label className="block text-sm font-mono text-(--color-text-secondary) mb-2">Display Order</label>
              <div className="terminal-input-wrapper">
                 <input
                   type="number"
                   name="displayOrder"
                   value={formData.displayOrder}
                   onChange={handleChange}
                   className="terminal-input w-full pl-2"
                 />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-mono text-(--color-text-secondary) mb-2">Description</label>
            <textarea
              name="description"
              value={formData.description || ''}
              onChange={handleChange}
              rows={3}
              className="w-full bg-transparent border border-(--color-border) rounded p-3 text-(--color-text-primary) font-mono focus:border-(--color-ubuntu-orange) outline-none resize-none"
              placeholder="Brief description of experience..."
            />
          </div>

          {/* Visibility */}
          <div className="flex items-center gap-3 border border-(--color-border) p-3 rounded bg-(--color-surface)">
             <input
               type="checkbox"
               name="isVisible"
               checked={formData.isVisible}
               onChange={handleChange}
               className="h-4 w-4 rounded border-gray-300 text-(--color-ubuntu-orange) focus:ring-(--color-ubuntu-orange)"
             />
             <span className="text-sm font-mono">Visible on public site</span>
          </div>

          <div className="flex justify-end pt-4">
             <button
               type="submit"
               disabled={isSubmitting}
               className="terminal-button"
             >
               <Save size={18} />
               {isSubmitting ? 'Saving...' : 'Save Skill'}
             </button>
          </div>
        </form>
      </div>
    </div>
  )
}
