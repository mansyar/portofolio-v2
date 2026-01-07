import { useMemo } from "react";
import { cn } from "../../lib/utils";

interface SkillBarProps {
  name: string;
  proficiency: number; // 0-100
  icon?: string;
  className?: string;
}

export function SkillBar({ name, proficiency, icon, className }: SkillBarProps) {
  // Generate the string representation [██████░░░░]
  const bar = useMemo(() => {
    const totalBlocks = 20; // 20 blocks means each block is 5%
    const filledBlocks = Math.round((proficiency / 100) * totalBlocks);
    const emptyBlocks = totalBlocks - filledBlocks;
    
    return `[${"█".repeat(filledBlocks)}${"░".repeat(emptyBlocks)}]`;
  }, [proficiency]);

  return (
    <div className={cn("font-mono text-sm sm:text-base", className)}>
      <div className="mb-1 flex items-end justify-between">
        <div className="flex items-center gap-2">
          {icon && <img src={icon} alt="" className="h-5 w-5" />}
          <span className="font-bold text-(--color-text-primary)">{name}</span>
        </div>
        <span className="text-(--color-ubuntu-orange)">{proficiency}%</span>
      </div>
      <div className="overflow-hidden tracking-tighter whitespace-nowrap text-(--color-terminal-green)">
        {bar}
      </div>
    </div>
  );
}
