import { cn } from "../../lib/utils";

interface TerminalWindowProps {
  children?: React.ReactNode;
  className?: string;
  title?: string;
}

export function TerminalWindow({ children, className, title = "user@portfolio:~" }: TerminalWindowProps) {
  return (
    <div className={cn(
      "overflow-hidden rounded-lg border border-(--color-border) bg-(--color-surface) shadow-2xl",
      className
    )}>
      {/* Title Bar */}
      <div className="flex items-center justify-between border-b border-(--color-border) bg-(--color-surface-dark) px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-(--color-terminal-red)"></div>
          <div className="h-3 w-3 rounded-full bg-(--color-terminal-yellow)"></div>
          <div className="h-3 w-3 rounded-full bg-(--color-terminal-green)"></div>
        </div>
        <div className="absolute left-1/2 -translate-x-1/2 font-mono text-sm text-(--color-text-secondary)">
          {title}
        </div>
        <div className="w-14"></div> {/* Spacer for centering */}
      </div>
      
      {/* Content */}
      <div className="relative p-6 font-mono text-sm md:text-base">
        {/* Scanline Effect */}
        <div className="pointer-events-none absolute inset-0 z-10 h-full w-full bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] bg-size-[100%_2px,3px_100%]"></div>
        <div className="animate-scanline pointer-events-none absolute inset-0 z-10 h-1/2 w-full bg-linear-to-b from-white/5 to-transparent opacity-10"></div>
        {children}
      </div>
    </div>
  );
}

export function CodeBlock({ code }: { code: string; language?: string }) {
  return (
    <div className="relative">
      <pre className="overflow-x-auto text-(--color-text-primary)">
        <code>
          {code.split('\n').map((line, i) => (
            <div key={i} className="table-row">
              <span className="table-cell select-none pr-4 text-right text-(--color-text-muted) opacity-50">
                {i + 1}
              </span>
              <span className="table-cell whitespace-pre">
                {line}
              </span>
            </div>
          ))}
        </code>
      </pre>
    </div>
  );
}
