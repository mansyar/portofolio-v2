import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "outline" | "terminal";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants = {
    default: "bg-(--color-ubuntu-orange) text-white border-transparent",
    secondary: "bg-(--color-surface) text-(--color-text-primary) border-(--color-border)",
    outline: "bg-transparent text-(--color-text-secondary) border-(--color-border)",
    terminal: "bg-black text-(--color-terminal-green) border-(--color-terminal-green) font-mono",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-sm border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
