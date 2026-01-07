import { useEffect, useRef } from 'react';
import './typing-effect.css';

interface TypingEffectProps {
  text: string;
  speed?: number;
  startDelay?: number;
  className?: string;
  cursorChar?: string;
}

export function TypingEffect({ 
  text, 
  speed = 50, 
  startDelay = 0, 
  className = "", 
  cursorChar = "_" 
}: TypingEffectProps) {
  const containerRef = useRef<HTMLSpanElement>(null);
  
  // Calculate total animation duration
  const totalDuration = text.length * speed;
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Set CSS custom properties for animation timing
    containerRef.current.style.setProperty('--typing-chars', String(text.length));
    containerRef.current.style.setProperty('--typing-duration', `${totalDuration}ms`);
    containerRef.current.style.setProperty('--typing-delay', `${startDelay}ms`);
  }, [text.length, totalDuration, startDelay]);

  return (
    <span 
      ref={containerRef}
      className={`typing-effect ${className}`}
      data-text={text}
    >
      <span className="typing-text">{text}</span>
      <span className="typing-cursor">{cursorChar}</span>
    </span>
  );
}
