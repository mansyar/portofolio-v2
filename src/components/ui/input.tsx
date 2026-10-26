import { useId } from "react";
import type { InputHTMLAttributes } from "react";
import { cn } from "../../lib/utils";
import "./input.css";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  wrapperClassName?: string;
}

export function Input({ label, className, wrapperClassName, id: idProp, ...props }: Props) {
  const generatedId = useId();
  const id = idProp ?? generatedId;
  return (
    <div className={cn("input-container", wrapperClassName)}>
      {label && (
        <label className="input-label" htmlFor={id}>
          {label}
        </label>
      )}
      <div className="input-wrapper">
        <span className="input-prompt" aria-hidden="true">
          &gt;
        </span>
        <input id={id} className={cn("input", className)} {...props} />
      </div>
    </div>
  );
}
