import { HTMLAttributes } from "react";
import { cn } from "../../lib/utils";
import "./card.css";

interface Props extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  children: React.ReactNode;
  variant?: "default" | "terminal";
}

export function Card({ 
  title, 
  children, 
  className, 
  variant = "default",
  ...props 
}: Props) {
  return (
    <div 
      className={cn("card", `card--${variant}`, className)} 
      {...props}
    >
      <div className="card__titlebar">
        <div className="card__dots">
          <span className="card__dot card__dot--close" />
          <span className="card__dot card__dot--minimize" />
          <span className="card__dot card__dot--maximize" />
        </div>
        {title && <span className="card__title">{title}</span>}
      </div>
      <div className="card__content">{children}</div>
    </div>
  );
}
