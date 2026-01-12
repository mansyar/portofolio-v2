import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { toast } from 'sonner';
import { Send, Loader2 } from 'lucide-react';
import './NewsletterForm.css';

export function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const subscribe = useMutation(api.newsletter.subscribe);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      const result = await subscribe({ email });
      if (result.alreadySubscribed) {
        toast.info('YOU_ARE_ALREADY_SUBSCRIBED');
      } else {
        toast.success('SUBSCRIPTION_SUCCESSFUL');
      }
      setEmail('');
    } catch (error) {
      toast.error('SUBSCRIPTION_FAILED', {
        description: error instanceof Error ? error.message : "Unknown error"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="newsletter-inline">
      <span className="newsletter-inline-label">Stay in the loop</span>
      <div className="newsletter-inline-input-group">
        <span className="newsletter-inline-prompt">$</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          disabled={loading}
          className="newsletter-inline-input"
        />
        <button
          type="submit"
          disabled={loading || !email}
          className="newsletter-inline-submit"
          aria-label="Subscribe"
        >
          {loading ? (
            <Loader2 className="animate-spin" size={14} />
          ) : (
            <Send size={14} />
          )}
        </button>
      </div>
    </form>
  );
}
