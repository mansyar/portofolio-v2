import { ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/utils";
import "./button.css";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
  size?: "sm" | "md";
}

export function Button({ 
  children, 
  className, 
  variant = "primary", 
  size = "md", 
  ...props 
}: Props) {
  return (
    <button 
      className={cn("btn", `btn-${variant}`, `btn-${size}`, className)} 
      {...props}
    >
      {children}
    </button>
  );
}
