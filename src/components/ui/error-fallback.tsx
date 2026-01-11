import { Terminal, RefreshCw, Home, AlertCircle } from 'lucide-react';
import { Button } from './button';
import { Link } from '@tanstack/react-router';

interface ErrorFallbackProps {
  error: Error & { digest?: string };
  reset?: () => void;
  title?: string;
}

export function ErrorFallback({ error, reset, title = 'SYSTEM_ERROR' }: ErrorFallbackProps) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
      <div className="mb-6 rounded-full border border-(--color-border) bg-(--color-surface-dark) p-4 shadow-lg shadow-red-500/10">
        <AlertCircle className="text-(--color-terminal-red)" size={48} />
      </div>

      <div className="mb-4 font-mono text-sm text-(--color-text-secondary)">
        [ <span className="text-(--color-terminal-red)">FAILED</span> ] {title}
      </div>

      <h1 className="mb-4 text-2xl font-bold md:text-3xl lg:text-4xl">
        Oops! Something went wrong
      </h1>

      <div className="mb-8 max-w-lg overflow-hidden rounded border border-(--color-border) bg-(--color-surface-dark) p-4 text-left shadow-inner">
        <div className="mb-2 flex items-center gap-2 border-b border-(--color-border) pb-2 text-xs font-mono text-(--color-text-secondary)">
          <Terminal size={14} />
          <span>error_stack.log</span>
        </div>
        <pre className="overflow-x-auto font-mono text-xs leading-relaxed text-(--color-terminal-red)">
          <code>{error.message || 'An unexpected error occurred.'}</code>
          {error.digest && (
            <div className="mt-2 text-(--color-text-secondary)">
              Digest: {error.digest}
            </div>
          )}
        </pre>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4">
        {reset && (
          <Button onClick={reset} className="gap-2">
            <RefreshCw size={16} />
            <span>RETRY_PROCESS</span>
          </Button>
        )}
        <Link to="/">
          <Button variant="secondary" className="gap-2">
            <Home size={16} />
            <span>RETURN_HOME</span>
          </Button>
        </Link>
      </div>

      <div className="mt-12 font-mono text-[10px] text-(--color-text-secondary) opacity-50">
        ERROR_HANDLER_V2.0.0 // STATUS: STANDBY
      </div>
    </div>
  );
}
