import { describe, it, expect } from 'vitest';

// Logic tests for Content Discovery
describe('Content Discovery Logic', () => {
  describe('Project Tech Stack Scoring', () => {
    const currentProject = {
      techStack: ['React', 'TypeScript', 'Tailwind', 'Convex']
    };

    const projects = [
      { id: '1', techStack: ['React', 'Node.js'] }, // 1 shared
      { id: '2', techStack: ['TypeScript', 'Convex', 'PostgreSQL'] }, // 2 shared
      { id: '3', techStack: ['Docker', 'Kubernetes'] }, // 0 shared
      { id: '4', techStack: ['React', 'TypeScript', 'Tailwind', 'Vite'] }, // 3 shared
    ];

    it('correctly scores projects by shared tech stack', () => {
      const scored = projects.map(p => ({
        ...p,
        sharedTech: p.techStack.filter(t => currentProject.techStack.includes(t)).length
      })).filter(p => p.sharedTech > 0)
         .sort((a, b) => b.sharedTech - a.sharedTech);

      expect(scored[0].id).toBe('4'); // 3 shared
      expect(scored[1].id).toBe('2'); // 2 shared
      expect(scored[2].id).toBe('1'); // 1 shared
      expect(scored.length).toBe(3);
    });
  });

  describe('Related Blog Posts Matching', () => {
    const currentPost = { categoryId: 'cat1', id: 'post1' };
    const allPosts = [
      { id: 'post2', categoryId: 'cat1', status: 'published' },
      { id: 'post3', categoryId: 'cat2', status: 'published' },
      { id: 'post4', categoryId: 'cat1', status: 'draft' },
      { id: 'post5', categoryId: 'cat1', status: 'published' },
    ];

    it('correctly filters related published posts in same category excluding current', () => {
      const related = allPosts.filter(p => 
        p.categoryId === currentPost.categoryId && 
        p.status === 'published' && 
        p.id !== currentPost.id
      );

      expect(related.map(p => p.id)).toContain('post2');
      expect(related.map(p => p.id)).toContain('post5');
      expect(related.length).toBe(2);
    });
  });
});
