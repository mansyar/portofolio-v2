import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  color?: string; // e.g., 'var(--color-ubuntu-orange)'
}

export function StatCard({ label, value, icon: Icon, color = 'var(--color-ubuntu-orange)' }: StatCardProps) {
  return (
    <div className="card p-4 flex items-center justify-between">
      <div>
        <p className="text-(--color-text-secondary) text-sm font-mono mb-1">{label}</p>
        <h3 className="text-3xl font-bold font-mono text-(--color-text-primary)">
          {value}
        </h3>
      </div>
      <div 
        className="h-12 w-12 rounded flex items-center justify-center bg-(--color-surface) border border-(--color-border)"
        style={{ color }}
      >
        <Icon size={24} />
      </div>
    </div>
  );
}
