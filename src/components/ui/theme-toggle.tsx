import { useState, useEffect } from 'react';
import { Moon, Sun } from "lucide-react";
import { Button } from "./button";

const applyTheme = (newTheme: "light" | "dark") => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (newTheme === "dark") {
    root.classList.add("dark");
    root.classList.remove("light");
  } else {
    root.classList.add("light");
    root.classList.remove("dark");
  }
};

// Get initial theme from localStorage or system preference
const getInitialTheme = (): "light" | "dark" => {
  if (typeof window === 'undefined') return "dark";
  
  const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
  if (savedTheme) return savedTheme;
  
  if (window.matchMedia("(prefers-color-scheme: light)").matches) {
    return "light";
  }
  return "dark";
};

export function ThemeToggle() {
  // Use lazy initializer to avoid hydration mismatch
  const [theme, setTheme] = useState<"light" | "dark">(getInitialTheme);

  // Apply theme to DOM on mount and when theme changes
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  return (
    <Button 
      variant="secondary" 
      size="sm" 
      onClick={toggleTheme} 
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      className="h-10 w-10 rounded-full p-0"
    >
      {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
    </Button>
  );
}
