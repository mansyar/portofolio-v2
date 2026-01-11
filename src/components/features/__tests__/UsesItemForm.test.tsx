import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UsesItemForm } from '../UsesItemForm';
import { useMutation } from 'convex/react';
import { Id } from '../../../../convex/_generated/dataModel';
import { useRouter } from '@tanstack/react-router';

// Mock convex
vi.mock('convex/react', () => ({
  useMutation: vi.fn(),
}));

// Mock router
vi.mock('@tanstack/react-router', () => ({
  useRouter: vi.fn(),
}));

describe('UsesItemForm', () => {
  const mockNavigate = vi.fn();
  const mockMutation = vi.fn().mockResolvedValue({ success: true });

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as unknown as { mockReturnValue: (v: unknown) => void }).mockReturnValue({
      navigate: mockNavigate,
    });
    (useMutation as unknown as { mockReturnValue: (v: unknown) => void }).mockReturnValue(mockMutation);
  });

  const defaultProps = {
    mode: 'create' as const,
  };

  it('renders all form fields correctly', () => {
    render(<UsesItemForm {...defaultProps} />);

    expect(screen.getByLabelText(/Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Link URL/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Display Order/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Visible on public site/i)).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(<UsesItemForm {...defaultProps} />);
    
    const submitButton = screen.getByRole('button', { name: /Create Item/i });
    fireEvent.click(submitButton);

    // HTML5 validation prevents submission, but since we can't easily test browser 
    // validation in this env, we check if mutation was NOT called
    expect(mockMutation).not.toHaveBeenCalled();
  });

  it('populates fields with initial data in edit mode', () => {
    const initialData = {
      id: "abc" as Id<"usesItems">,
      name: 'Test Setup',
      category: 'Hardware',
      description: 'Cool setup',
      displayOrder: 5,
      isVisible: false,
    };

    render(<UsesItemForm mode="edit" initialData={initialData} />);

    expect(screen.getByLabelText(/Name/i)).toHaveValue('Test Setup');
    expect(screen.getByLabelText(/Category/i)).toHaveValue('Hardware');
    expect(screen.getByLabelText(/Description/i)).toHaveValue('Cool setup');
    expect(screen.getByLabelText(/Display Order/i)).toHaveValue(5);
    expect(screen.getByLabelText(/Visible on public site/i)).not.toBeChecked();
  });

  it('submits correct data in create mode', async () => {
    render(<UsesItemForm {...defaultProps} />);

    fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: 'New Item' } });
    fireEvent.change(screen.getByLabelText(/Category/i), { target: { value: 'Software' } });
    fireEvent.change(screen.getByLabelText(/Display Order/i), { target: { value: '10' } });

    fireEvent.click(screen.getByRole('button', { name: /Create Item/i }));

    await waitFor(() => {
      expect(mockMutation).toHaveBeenCalledWith({
        name: 'New Item',
        category: 'Software',
        description: '',
        url: '',
        imageUrl: '',
        displayOrder: 10,
        isVisible: true,
      });
    });

    expect(mockNavigate).toHaveBeenCalledWith({ to: '/admin/uses' });
  });
});
