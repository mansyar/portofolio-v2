import { X, CheckSquare } from 'lucide-react';
import './BulkActionBar.css';

interface BulkActionBarProps {
  selectedCount: number;
  onClear: () => void;
  actions: {
    label: string;
    icon: React.ElementType;
    onClick: () => void;
    variant?: 'default' | 'danger' | 'success' | 'warning';
    disabled?: boolean;
  }[];
}

export function BulkActionBar({ selectedCount, onClear, actions }: BulkActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="bulk-action-bar-container">
      <div className="bulk-action-bar">
        <div className="bulk-info">
          <CheckSquare className="text-(--color-ubuntu-orange)" size={18} />
          <span className="font-mono text-sm">
            {selectedCount} item{selectedCount > 1 ? 's' : ''} selected
          </span>
        </div>

        <div className="bulk-divider" />

        <div className="bulk-actions">
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <button
                key={index}
                onClick={action.onClick}
                disabled={action.disabled}
                className={`bulk-action-button variant-${action.variant || 'default'}`}
                title={action.label}
              >
                <Icon size={16} />
                <span className="hidden sm:inline">{action.label}</span>
              </button>
            );
          })}
        </div>

        <div className="bulk-divider" />

        <button 
          onClick={onClear}
          className="bulk-clear-button"
          title="Clear Selection"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
