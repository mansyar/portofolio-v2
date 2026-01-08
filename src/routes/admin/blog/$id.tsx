import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';
import { BlogPostForm } from '../../../components/features/BlogPostForm';
import { Terminal } from 'lucide-react';

export const Route = createFileRoute('/admin/blog/$id')({
  component: EditBlogPost,
});

function EditBlogPost() {
  const { id } = Route.useParams();
  const post = useQuery(api.blog.getAdminPost, { id: id as Id<"blogPosts"> });

  if (!post) {
    return (
      <div className="flex h-64 items-center justify-center font-mono text-(--color-text-secondary)">
        LOADING_POST_DATA...
      </div>
    );
  }

  const formData = {
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt || '',
    content: post.content,
    coverImageUrl: post.coverImageUrl || '',
    categoryId: post.categoryId,
    tagIds: post.tagIds,
    status: post.status as 'draft' | 'published',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Terminal className="text-(--color-ubuntu-orange)" />
        <h1 className="text-2xl font-bold">EDIT_POST <span className="text-(--color-text-secondary)">[{post.title}]</span></h1>
      </div>

      <div className="terminal-card p-6">
        <BlogPostForm mode="edit" initialData={{ ...formData, id: post._id }} />
      </div>
    </div>
  );
}
