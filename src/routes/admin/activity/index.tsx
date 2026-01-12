import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Terminal, Clock, User, Activity, FileText, Database, Settings } from 'lucide-react';
import { format } from 'date-fns';

export const Route = createFileRoute('/admin/activity/')({
  component: ActivityLogPage,
});

function ActivityLogPage() {
  const logs = useQuery(api.activity.list, { limit: 50 });

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'create': return <Database size={14} className="text-blue-400" />;
      case 'update': return <FileText size={14} className="text-yellow-400" />;
      case 'delete': return <Terminal size={14} className="text-red-400" />;
      case 'publish': return <Activity size={14} className="text-green-400" />;
      case 'unpublish': return <Activity size={14} className="text-gray-400" />;
      case 'bulk_delete': return <Terminal size={14} className="text-red-600" />;
      case 'bulk_update': return <FileText size={14} className="text-yellow-600" />;
      default: return <Activity size={14} />;
    }
  };

  const getEntityTypeIcon = (type: string) => {
    switch (type) {
      case 'project': return <Database size={14} />;
      case 'skill': return <Settings size={14} />;
      case 'blogPost': return <FileText size={14} />;
      case 'usesItem': return <Database size={14} />;
      case 'setting': return <Settings size={14} />;
      case 'media': return <Database size={14} />;
      default: return <Activity size={14} />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="text-(--color-ubuntu-orange)" />
            Activity Log
          </h1>
          <p className="text-(--color-text-secondary) mt-1">
            System audit trail and admin actions.
          </p>
        </div>
      </div>

      <div className="terminal-card overflow-hidden">
        <div className="terminal-header border-bottom border-(--color-border) p-3 flex items-center gap-2 bg-[rgba(255,255,255,0.05)]">
          <Terminal size={16} />
          <span className="text-xs font-mono font-bold">AUDIT_TRAIL.LOG</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse font-mono text-sm">
            <thead>
              <tr className="border-bottom border-(--color-border) text-left opacity-70">
                <th className="p-3 font-normal">TIMESTAMP</th>
                <th className="p-3 font-normal">ACTOR</th>
                <th className="p-3 font-normal">ACTION</th>
                <th className="p-3 font-normal">ENTITY</th>
                <th className="p-3 font-normal text-right">DETAILS</th>
              </tr>
            </thead>
            <tbody>
              {!logs ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center animate-pulse">
                    Scanning for logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center italic text-(--color-text-secondary)">
                    No activity recorded yet.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id} className="border-bottom border-(--color-border) hover:bg-[rgba(255,255,255,0.02)] transition-colors group">
                    <td className="p-3 whitespace-nowrap text-xs flex items-center gap-2">
                      <Clock size={12} className="opacity-50" />
                      {format(log.timestamp, 'MMM dd, HH:mm:ss')}
                    </td>
                    <td className="p-3 whitespace-nowrap text-xs">
                      <div className="flex items-center gap-2">
                        <User size={12} className="opacity-50" />
                        <span className="text-(--color-ubuntu-orange)">{log.actorEmail.split('@')[0]}</span>
                      </div>
                    </td>
                    <td className="p-3 whitespace-nowrap text-xs">
                      <div className="flex items-center gap-2">
                        {getActionIcon(log.action)}
                        <span className="uppercase">{log.action.replace('_', ' ')}</span>
                      </div>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="opacity-50">{getEntityTypeIcon(log.entityType)}</span>
                        <span className="font-bold">{log.entityTitle || log.entityId.slice(0, 8)}</span>
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      {log.metadata && (
                        <span className="text-[10px] bg-[rgba(255,255,255,0.05)] px-1 py-0.5 rounded opacity-50 group-hover:opacity-100">
                          {JSON.stringify(log.metadata)}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
