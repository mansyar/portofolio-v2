import { Link } from '@tanstack/react-router';
import { 
  LayoutDashboard, 
  Briefcase, 
  Code2, 
  Image as ImageIcon, 
  Settings, 
  LogOut,
  PenTool,
  User,
  Terminal
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

export function AdminSidebar() {
  const { signOut } = useAuth();

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/admin', exact: true },
    { label: 'Projects', icon: Briefcase, path: '/admin/projects' },
    { label: 'Skills', icon: Code2, path: '/admin/skills' },
    { label: 'Blog', icon: PenTool, path: '/admin/blog' },
    { label: 'Resume', icon: User, path: '/admin/resume' },
    { label: 'Media', icon: ImageIcon, path: '/admin/media' },
    { label: 'Settings', icon: Settings, path: '/admin/settings' },
  ];

  return (
    <aside className="admin-sidebar">
      {/* Brand */}
      <div className="h-(--admin-header-height) flex items-center px-6 border-b border-(--color-border)">
        <div className="flex items-center gap-2 text-(--color-ubuntu-orange)">
          <Terminal size={24} />
          <span className="font-bold text-lg tracking-wider">CMS_v1</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-3 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            activeOptions={{ exact: item.exact }}
            className="nav-link rounded-md"
            activeProps={{ className: 'active' }}
          >
            <item.icon />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* User Footer */}
      <div className="p-4 border-t border-(--color-border)">
        <button 
          onClick={() => signOut()}
          className="nav-link w-full rounded-md text-(--color-terminal-red) hover:bg-opacity-10 hover:bg-(--color-terminal-red)"
        >
          <LogOut />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
