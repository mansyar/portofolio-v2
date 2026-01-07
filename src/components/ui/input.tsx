import { InputHTMLAttributes } from "react";
import { cn } from "../../lib/utils";
import "./input.css";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  wrapperClassName?: string;
}

export function Input({ 
  label, 
  className, 
  wrapperClassName,
  ...props 
}: Props) {
  return (
    <div className={cn("input-container", wrapperClassName)}>
      {label && <label className="input-label">{label}</label>}
      <div className="input-wrapper">
        <span className="input-prompt">&gt;</span>
        <input 
          className={cn("input", className)} 
          {...props} 
        />
      </div>
    </div>
  );
}
