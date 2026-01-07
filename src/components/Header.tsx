import { Link } from "@tanstack/react-router";
import { Terminal } from "lucide-react";
import { useLocation } from "@tanstack/react-router";
import { ThemeToggle } from "./ui/theme-toggle";

export default function Header() {
  const location = useLocation();
  const currentPath = location.pathname;

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "About", path: "/about" },
    { name: "Skills", path: "/skills" },
    { name: "Projects", path: "/projects" },
    { name: "Blog", path: "/blog" },
    { name: "Uses", path: "/uses" },
    { name: "Contact", path: "/contact" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-(--color-border) bg-(--color-bg-primary)/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Link to="/" className="group flex items-center gap-2">
          <div className="rounded border border-(--color-border) bg-(--color-surface-dark) p-1.5 transition-colors group-hover:border-(--color-ubuntu-orange)">
            <Terminal size={20} className="text-(--color-ubuntu-orange)" />
          </div>
          <span className="text-lg font-bold tracking-tight">
            ansyar<span className="text-(--color-text-secondary)">.dev</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => {
            const isActive = 
              link.path === "/" 
                ? currentPath === "/" 
                : currentPath.startsWith(link.path);
            
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "border border-(--color-border) bg-(--color-surface-dark) text-(--color-ubuntu-orange)"
                    : "text-(--color-text-secondary) hover:bg-(--color-surface-dark)/50 hover:text-(--color-text-primary)"
                }`}
              >
                {link.name}
              </Link>
            );
          })}
          
          <div className="ml-2 border-l border-(--color-border) pl-2">
             <ThemeToggle />
          </div>
        </nav>

        {/* Mobile Nav Placeholder - for now just ThemeToggle */}
        <div className="flex items-center gap-4 md:hidden">
           <ThemeToggle />
           {/* Mobile menu toggle would go here */}
        </div>
      </div>
    </header>
  );
}
