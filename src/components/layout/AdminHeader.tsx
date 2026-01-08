import { Menu } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

// Props to control mobile sidebar toggle if we lift state later
interface AdminHeaderProps {
  onToggleSidebar?: () => void;
}

export function AdminHeader({ onToggleSidebar }: AdminHeaderProps) {
  const { isLoading } = useAuth();

  return (
    <header className="admin-header">
      <div className="flex items-center gap-4">
        <button 
          className="md:hidden text-(--color-text-secondary) hover:text-(--color-text-primary)"
          onClick={onToggleSidebar}
        >
          <Menu />
        </button>
        <h1 className="text-lg font-semibold text-(--color-text-primary)">
          System
        </h1>
      </div>

      <div className="flex items-center gap-4">
        {isLoading ? (
          <div className="h-2 w-20 bg-(--color-surface) animate-pulse rounded" />
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm text-(--color-text-secondary) font-mono">
              admin@ansyar-world.top
            </span>
            <div className="h-8 w-8 rounded bg-(--color-surface) border border-(--color-border) flex items-center justify-center text-(--color-ubuntu-orange) font-bold">
              A
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

