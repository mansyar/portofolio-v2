import { useState, useEffect, useCallback } from "react";
import { useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { StatCard } from "../ui/stat-card";
import { 
  Eye, 
  Users, 
  Activity, 
  MousePointer2,
  RefreshCw,
  AlertCircle
} from "lucide-react";
import "./AnalyticsWidget.css";

type TimeRange = "today" | "7d" | "30d";

export function AnalyticsWidget() {
  const [range, setRange] = useState<TimeRange>("7d");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{
    visitors: { value: number; change: number };
    pageviews: { value: number; change: number };
    visits: { value: number; change: number };
    bounces: { value: number; change: number };
    activeVisitors: number;
  } | null>(null);

  const getStatsAction = useAction(api.analytics.getStats);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    const now = Date.now();
    let startAt = now;

    switch (range) {
      case "today":
        startAt = new Date().setHours(0, 0, 0, 0);
        break;
      case "7d":
        startAt = now - 7 * 24 * 60 * 60 * 1000;
        break;
      case "30d":
        startAt = now - 30 * 24 * 60 * 60 * 1000;
        break;
    }

    try {
      const result = await getStatsAction({ startAt, endAt: now });
      if (result) {
        setStats(result);
      } else {
        setError("Failed to fetch analytics data. Check Umami configuration.");
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred while fetching analytics.");
    } finally {
      setLoading(false);
    }
  }, [range, getStatsAction]);

  useEffect(() => {
    fetchStats();
    // Refresh active visitors every 60 seconds
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  if (loading && !stats) {
    return (
      <div className="analytics-widget space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-6 w-48 bg-(--color-surface) animate-pulse rounded" />
          <div className="h-8 w-32 bg-(--color-surface) animate-pulse rounded" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-(--color-surface) animate-pulse rounded-lg border border-(--color-border)" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-widget space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-mono text-(--color-ubuntu-orange) flex items-center gap-2">
            <Activity size={20} />
            Visitor Insights
          </h2>
          <p className="text-xs text-(--color-text-secondary) font-mono mt-1">
            Real-time traffic and engagement metrics
          </p>
        </div>

        <div className="flex items-center gap-2 bg-(--color-surface) p-1 rounded-md border border-(--color-border)">
          {(["today", "7d", "30d"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1 text-xs font-mono transition-all rounded ${
                range === r 
                  ? "bg-(--color-ubuntu-orange) text-white shadow-sm" 
                  : "text-(--color-text-secondary) hover:text-(--color-text-primary)"
              }`}
            >
              {r.toUpperCase()}
            </button>
          ))}
          <button 
            onClick={fetchStats}
            disabled={loading}
            className="p-1 text-(--color-text-secondary) hover:text-(--color-ubuntu-orange) transition-colors disabled:opacity-50"
            title="Refresh logs"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {error ? (
        <div className="card p-4 border-(--color-terminal-red) bg-(--color-terminal-red)/10 flex items-center gap-3">
          <AlertCircle className="text-(--color-terminal-red)" size={20} />
          <p className="text-sm font-mono text-(--color-terminal-red)">{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            label="Unique Visitors" 
            value={stats?.visitors.value ?? 0} 
            icon={Users} 
            color="#aa00ff"
          />
          <StatCard 
            label="Page Views" 
            value={stats?.pageviews.value ?? 0} 
            icon={Eye} 
            color="var(--color-ubuntu-orange)"
          />
          <StatCard 
            label="Total Visits" 
            value={stats?.visits.value ?? 0} 
            icon={MousePointer2} 
            color="#2196f3"
          />
          <div className="card p-4 flex items-center justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-2">
              <div className="h-2 w-2 rounded-full bg-(--color-terminal-green) animate-ping" />
            </div>
            <div>
              <p className="text-(--color-text-secondary) text-sm font-mono mb-1">Active Now</p>
              <h3 className="text-3xl font-bold font-mono text-(--color-terminal-green)">
                {stats?.activeVisitors ?? 0}
              </h3>
            </div>
            <div className="h-12 w-12 rounded flex items-center justify-center bg-(--color-surface) border border-(--color-border) text-(--color-terminal-green)">
              <Activity size={24} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
