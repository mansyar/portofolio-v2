import { useState } from 'react';
import { createFileRoute, useRouter } from '@tanstack/react-router';
import { useAuth } from '@/hooks/use-auth';
import '@/styles/admin.css';

export const Route = createFileRoute('/admin/login')({
  component: AdminLogin,
});

function AdminLogin() {
  const { signIn, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false); // Toggle between sign-in and sign-up

  // Show loading while auth state is being determined
  if (isAuthLoading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--color-ubuntu-orange)] border-t-transparent" />
          <p className="font-mono text-sm text-[var(--color-text-secondary)]">
            Checking authentication...
          </p>
        </div>
      </div>
    );
  }

  // Redirect if already authenticated
  if (isAuthenticated) {
    router.navigate({ to: '/admin' });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // Use signUp or signIn based on mode
      const flow = isSignUp ? "signUp" : "signIn";
      await signIn("password", { email, password, flow });
      // Success is handled by the auth state change -> redirect
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Authentication failed. Check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center p-4">
      <div className="card w-full max-w-md p-0">
        <div className="flex items-center justify-between border-b border-(--color-border) bg-(--color-surface) px-4 py-2">
          <div className="flex gap-2">
            <div className="h-3 w-3 rounded-full bg-(--color-terminal-red)" />
            <div className="h-3 w-3 rounded-full bg-(--color-terminal-yellow)" />
            <div className="h-3 w-3 rounded-full bg-(--color-terminal-green)" />
          </div>
          <div className="text-sm text-(--color-text-secondary)">admin@login:~</div>
          <div className="w-16" /> {/* Spacer */}
        </div>
        
        <div className="p-8">
          <div className="mb-6 text-center">
            <h1 className="font-mono text-2xl font-bold text-(--color-ubuntu-orange)">
              {isSignUp ? 'Create Account' : 'System Access'}
            </h1>
            <p className="mt-2 text-sm text-(--color-text-secondary)">
              {isSignUp ? 'Set up your admin credentials' : 'Please authenticate to continue'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block font-mono text-xs text-(--color-text-secondary)">
                Email
              </label>
              <div className="terminal-input-wrapper">
                <span className="terminal-prompt">$</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="terminal-input w-full"
                  placeholder="admin@ansyar-world.top"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block font-mono text-xs text-(--color-text-secondary)">
                Password
              </label>
              <div className="terminal-input-wrapper">
                <span className="terminal-prompt">$</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="terminal-input w-full"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-[rgba(233,84,32,0.1)] border-l-2 border-(--color-terminal-red) p-3 text-xs text-(--color-terminal-red)">
                Error: {error}
              </div>
            )}

            <button 
              type="submit" 
              className="terminal-button w-full justify-center"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Processing...' : (isSignUp ? 'Create Account' : 'Access CMS')}
            </button>
          </form>
          
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="font-mono text-xs text-(--color-ubuntu-orange) hover:underline"
            >
              {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
            </button>
          </div>
          
          <div className="mt-6 border-t border-(--color-border) pt-4 text-center">
             <p className="font-mono text-xs text-(--color-text-secondary)">
               Unauthorized access is prohibited
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
