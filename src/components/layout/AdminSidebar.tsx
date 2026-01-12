import { Link } from '@tanstack/react-router';
import { 
  LayoutDashboard, 
  Briefcase, 
  Code2, 
  Image as  ImageIcon, 
  LogOut,
  PenTool,
  User,
  Terminal,
  Mail,
  Wrench,
  Settings,
  Activity
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';

export function AdminSidebar() {
  const { signOut } = useAuth();
  const unreadMessagesCount = useQuery(api.contact.unreadCount);

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/admin', exact: true },
    { label: 'Projects', icon: Briefcase, path: '/admin/projects' },
    { label: 'Skills', icon: Code2, path: '/admin/skills' },
    { label: 'Uses', icon: Wrench, path: '/admin/uses' },
    { label: 'Blog', icon: PenTool, path: '/admin/blog' },
    { label: 'Messages', icon: Mail, path: '/admin/messages', badge: unreadMessagesCount },
    { label: 'Resume', icon: User, path: '/admin/resume' },
    { label: 'Media', icon: ImageIcon, path: '/admin/media' },
    { label: 'Activity Log', icon: Activity, path: '/admin/activity' },
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
            className="nav-link rounded-md relative"
            activeProps={{ className: 'active' }}
          >
            <item.icon />
            <span>{item.label}</span>
            {item.badge && item.badge > 0 && (
              <span className="absolute right-2 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-(--color-ubuntu-orange) text-[10px] font-bold text-white">
                {item.badge}
              </span>
            )}
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
