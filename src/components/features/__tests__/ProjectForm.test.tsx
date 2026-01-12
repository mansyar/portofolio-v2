import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProjectForm, ProjectFormData } from '../ProjectForm';
import { Id } from '../../../../convex/_generated/dataModel';
import { useRouter } from '@tanstack/react-router';

// Mock hooks
// Mock hooks
const { mockMutate } = vi.hoisted(() => ({
  mockMutate: vi.fn(),
}));

vi.mock('../../../hooks/use-toast-mutation', () => ({
  useToastMutation: () => ({
    mutate: mockMutate,
    isPending: false,
  }),
}));

// Mock router
vi.mock('@tanstack/react-router', () => ({
  useRouter: vi.fn(),
}));

describe('ProjectForm', () => {
  const mockNavigate = vi.fn();
  
  // We use the hoisted mockMutate
  // const mockUpdateProject = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as unknown as { mockReturnValue: (v: unknown) => void }).mockReturnValue({
      navigate: mockNavigate,
      history: { back: vi.fn() }
    });

    mockMutate.mockClear();
  });

  const defaultProps = {
    mode: 'create' as const,
  };

  it('renders standard and case study fields', () => {
    render(<ProjectForm {...defaultProps} />);

    // Standard fields
    expect(screen.getByLabelText(/Title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Slug/i)).toBeInTheDocument();
    
    // Case Study fields
    expect(screen.getByText('CASE_STUDY_DETAILS')).toBeInTheDocument();
    expect(screen.getByLabelText(/Challenge \(Markdown\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Approach \(Markdown\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Outcome \(Markdown\)/i)).toBeInTheDocument();
  });

  it('populates case study fields in edit mode', () => {
    const initialData: ProjectFormData & { id: Id<"projects"> } = {
      id: "123" as Id<"projects">,
      title: 'Test Project',
      slug: 'test-project',
      shortDescription: '',
      fullDescription: '',
      thumbnailUrl: '',
      images: [],
      techStack: [],
      liveDemoUrl: '',
      githubUrl: '',
      isFeatured: false,
      displayOrder: 1,
      isVisible: true,
      challenge: 'Hard problem',
      approach: 'Smart solution',
      outcome: 'Great success',
    };

    render(<ProjectForm mode="edit" initialData={initialData} />);

    expect(screen.getByLabelText(/Challenge/i)).toHaveValue('Hard problem');
    expect(screen.getByLabelText(/Approach/i)).toHaveValue('Smart solution');
    expect(screen.getByLabelText(/Outcome/i)).toHaveValue('Great success');
  });

  it('submits case study data', async () => {
    render(<ProjectForm {...defaultProps} />);

    // Fill required
    fireEvent.change(screen.getByLabelText(/Title/i), { target: { value: 'New Case Study' } });
    // Slug auto-generates
    
    // Fill Case Study
    fireEvent.change(screen.getByLabelText(/Challenge/i), { target: { value: 'The Challenge' } });
    fireEvent.change(screen.getByLabelText(/Approach/i), { target: { value: 'The Approach' } });
    fireEvent.change(screen.getByLabelText(/Outcome/i), { target: { value: 'The Outcome' } });

    fireEvent.click(screen.getByRole('button', { name: /Create Project/i }));

    await waitFor(() => {
      // Check that the mutation was called with our new fields
      // Note: allow any other fields to match as we just care about case study here
      expect(mockMutate).toHaveBeenCalledWith(expect.objectContaining({
        title: 'New Case Study',
        challenge: 'The Challenge',
        approach: 'The Approach',
        outcome: 'The Outcome',
      }));
    });
  });
});
