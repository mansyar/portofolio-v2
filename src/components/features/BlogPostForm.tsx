import { useState, useEffect } from 'react';
import { useQuery } from 'convex/react';
import { useToastMutation } from '../../hooks/use-toast-mutation';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { useRouter } from '@tanstack/react-router';
import { RichTextEditor } from '../editor/RichTextEditor';
import { Terminal, Save, X, Globe, EyeOff } from 'lucide-react';

interface BlogPostFormData {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImageUrl: string;
  categoryId?: Id<"blogCategories">;
  tagIds: Id<"blogTags">[];
  status: 'draft' | 'published';
}

interface BlogPostFormProps {
  initialData?: BlogPostFormData & { id?: Id<"blogPosts"> };
  mode: 'create' | 'edit';
}

function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
}

export function BlogPostForm({ initialData, mode }: BlogPostFormProps) {
  const router = useRouter();
  const categories = useQuery(api.blog.getCategories);
  const tags = useQuery(api.blog.getTags);
  
  const createPost = useToastMutation(api.blog.createPost, {
    successMessage: 'post published successfully',
    errorMessage: 'failed to publish post'
  });
  const updatePost = useToastMutation(api.blog.updatePost, {
    successMessage: 'post updated successfully',
    errorMessage: 'failed to update post'
  });

  const [formData, setFormData] = useState<BlogPostFormData>({
    title: initialData?.title || '',
    slug: initialData?.slug || '',
    excerpt: initialData?.excerpt || '',
    content: initialData?.content || '',
    coverImageUrl: initialData?.coverImageUrl || '',
    categoryId: initialData?.categoryId,
    tagIds: initialData?.tagIds || [],
    status: initialData?.status || 'draft',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [autoSlug, setAutoSlug] = useState(mode === 'create');

  useEffect(() => {
    if (autoSlug && mode === 'create') {
      setFormData((prev: BlogPostFormData) => ({ ...prev, slug: slugify(formData.title) }));
    }
  }, [formData.title, autoSlug, mode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: BlogPostFormData) => ({ ...prev, [name]: value }));
    
    if (name === 'slug') {
      setAutoSlug(false);
    }
  };

  const handleTagToggle = (tagId: Id<"blogTags">) => {
    setFormData((prev: BlogPostFormData) => ({
      ...prev,
      tagIds: prev.tagIds.includes(tagId)
        ? prev.tagIds.filter(id => id !== tagId)
        : [...prev.tagIds, tagId]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (mode === 'create') {
        await createPost(formData);
      } else if (initialData?.id) {
        await updatePost({ id: initialData.id, ...formData });
      }
      router.navigate({ to: '/admin/blog' });
    } catch {
      // Handled by toast
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="input-container">
            <label className="input-label">Title</label>
            <div className="input-wrapper">
              <span className="input-prompt">$</span>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="input"
                placeholder="Blog post title..."
              />
            </div>
          </div>

          <div className="input-container">
            <label className="input-label">Slug</label>
            <div className="input-wrapper">
              <span className="input-prompt">/</span>
              <input
                type="text"
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                required
                className="input"
                placeholder="url-slug-here"
              />
            </div>
          </div>

          <div className="input-container">
            <label className="input-label">Excerpt</label>
            <div className="input-wrapper">
              <span className="input-prompt">{">"}</span>
              <textarea
                name="excerpt"
                value={formData.excerpt}
                onChange={handleChange}
                className="input min-h-[80px] py-2"
                placeholder="Short summary for listing pages..."
              />
            </div>
          </div>

          <RichTextEditor 
            label="Content"
            content={formData.content}
            onChange={(content: string) => setFormData((prev: BlogPostFormData) => ({ ...prev, content }))}
            placeholder="Write your post here..."
          />
        </div>

        {/* Sidebar Settings */}
        <div className="space-y-6">
          <div className="terminal-card p-4 space-y-4 border border-(--color-border) bg-[rgba(0,0,0,0.2)] rounded">
            <h3 className="text-sm font-bold border-bottom border-(--color-border) pb-2 flex items-center gap-2">
              <Terminal size={14} className="text-(--color-ubuntu-orange)" />
              PUBLISHING
            </h3>
            
            <div className="flex items-center justify-between p-2 rounded bg-[rgba(255,255,255,0.05)]">
              <span className="text-xs font-mono">Status</span>
              <button
                type="button"
                onClick={() => setFormData((prev: BlogPostFormData) => ({ ...prev, status: prev.status === 'draft' ? 'published' : 'draft' }))}
                className={`admin-badge ${formData.status === 'published' ? 'success' : 'neutral'} cursor-pointer flex items-center gap-1`}
              >
                {formData.status === 'published' ? <Globe size={10} /> : <EyeOff size={10} />}
                {formData.status.toUpperCase()}
              </button>
            </div>

            <div className="input-container">
              <label className="input-label">Category</label>
              <select 
                name="categoryId" 
                value={formData.categoryId || ''} 
                onChange={handleChange}
                className="input bg-[rgba(0,0,0,0.2)] border border-(--color-border) p-2 rounded text-sm w-full outline-none focus:border-(--color-ubuntu-orange)"
              >
                <option value="">Select Category</option>
                {categories?.map(cat => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="input-container">
              <label className="input-label">Cover Image URL</label>
              <div className="input-wrapper">
                <span className="input-prompt">{">"}</span>
                <input
                  type="text"
                  name="coverImageUrl"
                  value={formData.coverImageUrl}
                  onChange={handleChange}
                  className="input text-xs"
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>

          <div className="terminal-card p-4 space-y-4 border border-(--color-border) bg-[rgba(0,0,0,0.2)] rounded">
             <h3 className="text-sm font-bold border-bottom border-(--color-border) pb-2">TAGS</h3>
             <div className="flex flex-wrap gap-2">
                {tags?.map(tag => (
                  <button
                    key={tag._id}
                    type="button"
                    onClick={() => handleTagToggle(tag._id)}
                    className={`text-[10px] px-2 py-1 rounded border transition-colors ${
                      formData.tagIds.includes(tag._id)
                        ? 'bg-(--color-ubuntu-orange) border-(--color-ubuntu-orange) text-white'
                        : 'bg-transparent border-(--color-border) text-(--color-text-secondary) hover:border-(--color-text-secondary)'
                    }`}
                  >
                    {tag.name}
                  </button>
                ))}
             </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="terminal-button btn-primary w-full flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Save size={18} />
              )}
              {mode === 'create' ? 'Deploy Post' : 'Overwrite Post'}
            </button>
            <button
              type="button"
              onClick={() => router.navigate({ to: '/admin/blog' })}
              className="terminal-button btn-secondary w-full flex items-center justify-center gap-2"
            >
              <X size={18} />
              Abort
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
