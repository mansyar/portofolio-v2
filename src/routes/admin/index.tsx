import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { StatCard } from "@/components/ui/stat-card";
import { Briefcase, Code2, PenTool, MessageSquare, Plus, ArrowRight, Clock } from "lucide-react";
import { AnalyticsWidget } from "@/components/features/AnalyticsWidget";

export const Route = createFileRoute("/admin/")({
  component: Dashboard,
});

export function Dashboard() {
  const stats = useQuery(api.dashboard.getStats);
  const recentMessages = useQuery(api.dashboard.getRecentMessages);

  if (!stats) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-32 bg-(--color-surface) rounded-lg border border-(--color-border)"
            />
          ))}
        </div>
        <div className="h-64 bg-(--color-surface) rounded-lg border border-(--color-border)" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Analytics Widget */}
      <AnalyticsWidget />

      {/* Stats Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Projects"
          value={stats.projects}
          icon={Briefcase}
          color="var(--color-ubuntu-orange)"
        />
        <StatCard
          label="Total Skills"
          value={stats.skills}
          icon={Code2}
          color="#aa00ff" // Purple
        />
        <StatCard
          label="Blog Posts"
          value={stats.blogPosts}
          icon={PenTool}
          color="#2196f3" // Blue
        />
        <StatCard
          label="Unread Messages"
          value={stats.unreadMessages}
          icon={MessageSquare}
          color={
            stats.unreadMessages > 0 ? "var(--color-terminal-red)" : "var(--color-terminal-green)"
          }
        />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity / Messages */}
        <section className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold font-mono text-(--color-ubuntu-orange)">
              Warning System Logs
            </h2>
            <Link
              to="/admin/messages"
              className="text-sm text-(--color-text-secondary) flex items-center gap-1 hover:text-(--color-ubuntu-orange) transition-colors"
            >
              View All <ArrowRight size={14} />
            </Link>
          </div>

          <div className="card p-0 overflow-hidden">
            <div className="bg-(--color-surface) border-b border-(--color-border) px-4 py-3 flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-(--color-terminal-red)" />
              <div className="h-3 w-3 rounded-full bg-(--color-terminal-yellow)" />
              <div className="h-3 w-3 rounded-full bg-(--color-terminal-green)" />
              <span className="ml-2 text-xs font-mono text-(--color-text-secondary)">
                /var/log/messages.log
              </span>
            </div>

            <div className="divide-y divide-(--color-border)">
              {recentMessages?.length === 0 ? (
                <div className="p-8 text-center text-(--color-text-secondary) font-mono text-sm">
                  No recent messages found. System clean.
                </div>
              ) : (
                recentMessages?.map((msg) => (
                  <div
                    key={msg._id}
                    className="p-4 hover:bg-(--color-surface) transition-colors group"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span
                        className={`text-sm font-bold ${!msg.isRead ? "text-(--color-ubuntu-orange)" : "text-(--color-text-primary)"}`}
                      >
                        {msg.subject}
                      </span>
                      <span className="text-xs text-(--color-text-secondary) font-mono flex items-center gap-1">
                        <Clock size={12} />
                        {new Date(msg._creationTime).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-(--color-text-secondary) line-clamp-1 mb-2">
                      {msg.message}
                    </p>
                    <div className="flex items-center gap-2 text-xs font-mono text-(--color-text-secondary)">
                      <span className="text-(--color-terminal-green)">from:</span> {msg.email}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold font-mono text-(--color-ubuntu-orange)">
            Quick Execute
          </h2>
          <div className="grid gap-3">
            <Link to="/admin/projects/new" className="terminal-button justify-between group">
              <span>Initialize Project</span>
              <Plus size={18} className="group-hover:rotate-90 transition-transform" />
            </Link>
            <Link to="/admin/blog/new" className="terminal-button justify-between group">
              <span>Draft New Post</span>
              <Plus size={18} className="group-hover:rotate-90 transition-transform" />
            </Link>
            <Link to="/admin/skills/new" className="terminal-button justify-between group">
              <span>Add Skill Node</span>
              <Plus size={18} className="group-hover:rotate-90 transition-transform" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
