import { Link, useLocation } from '@tanstack/react-router'
import { cn } from '../lib/utils'

export default function Header() {
  const location = useLocation()
  
  const navItems = [
    { label: 'Home', to: '/' },
    { label: 'About', to: '/about' },
    { label: 'Skills', to: '/skills' },
    { label: 'Projects', to: '/projects' },
    { label: 'Blog', to: '/blog' },
    { label: 'Uses', to: '/uses' },
    { label: 'Contact', to: '/contact' },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[var(--color-border)] bg-[var(--color-aubergine)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--color-aubergine)]/60">
      <div className="container flex h-14 max-w-screen-2xl items-center px-4">
        <div className="mr-4 flex">
          <Link to="/" className="mr-6 flex items-center space-x-2">
            <span className="font-mono text-xl font-bold text-[var(--color-ubuntu-orange)]">
              ~/ansyar-world
            </span>
          </Link>
        </div>
        
        <nav className="flex flex-1 items-center justify-end space-x-1">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "group relative px-3 py-2 font-mono text-sm transition-colors hover:text-[var(--color-ubuntu-orange)]",
                location.pathname === item.to 
                  ? "text-[var(--color-ubuntu-orange)] font-medium" 
                  : "text-[var(--color-text-secondary)]"
              )}
            >
              <span className="relative z-10">{item.label}</span>
              {location.pathname === item.to && (
                <span className="absolute bottom-0 left-0 h-0.5 w-full bg-[var(--color-ubuntu-orange)]" />
              )}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}
