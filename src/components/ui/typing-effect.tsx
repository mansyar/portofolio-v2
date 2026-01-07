import { useState, useEffect } from 'react';

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
  const [displayedText, setDisplayedText] = useState("");
  const [isStarted, setIsStarted] = useState(false);

  useEffect(() => {
    const startTimeout = setTimeout(() => {
      setIsStarted(true);
    }, startDelay);

    return () => clearTimeout(startTimeout);
  }, [startDelay]);

  useEffect(() => {
    if (!isStarted) return;

    let currentIndex = 0;
    const intervalId = setInterval(() => {
      if (currentIndex <= text.length) {
        setDisplayedText(text.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(intervalId);
      }
    }, speed);

    return () => clearInterval(intervalId);
  }, [text, speed, isStarted]);

  return (
    <span className={className}>
      {displayedText}
      <span className="animate-pulse">{cursorChar}</span>
    </span>
  );
}
