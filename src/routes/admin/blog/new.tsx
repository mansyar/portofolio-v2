import { createFileRoute } from '@tanstack/react-router';
import { BlogPostForm } from '../../../components/features/BlogPostForm';
import { Terminal } from 'lucide-react';

export const Route = createFileRoute('/admin/blog/new')({
  component: NewBlogPost,
});

function NewBlogPost() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Terminal className="text-(--color-ubuntu-orange)" />
        <h1 className="text-2xl font-bold">CREATE_NEW_POST</h1>
      </div>

      <div className="terminal-card p-6">
        <BlogPostForm mode="create" />
      </div>
    </div>
  );
}
