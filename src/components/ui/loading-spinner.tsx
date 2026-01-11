import { Terminal } from "lucide-react";

export function LoadingSpinner() {
  return (
    <div className="flex h-[50vh] w-full flex-col items-center justify-center gap-4 text-(--color-terminal-green)">
      <div className="flex items-center gap-2 font-mono text-lg">
        <Terminal className="h-6 w-6 animate-pulse" />
        <span>BOOTING_SYSTEM...</span>
      </div>
      <div className="h-1 w-48 overflow-hidden rounded-full bg-(--color-surface) border border-(--color-border)">
        <div className="h-full bg-(--color-terminal-green) animate-loading-bar" />
      </div>
    </div>
  );
}
