"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";

interface UsageStats {
  totalRequests: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  totalCost: number;
  recentUsage?: any[];
}

interface DailyStats {
  date: string;
  requests: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;
}

export function UsageStats() {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsageStats();
  }, []);

  const fetchUsageStats = async () => {
    try {
      setLoading(true);
      const [userStats, daily] = await Promise.all([
        fetch("/api/usage/user").then((res) => res.json()),
        fetch("/api/usage/daily?days=7").then((res) => res.json()),
      ]);

      setStats(userStats);
      setDailyStats(daily);
      setError(null);
    } catch (err) {
      setError("Failed to load usage statistics");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
          <button
            onClick={fetchUsageStats}
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">AI Usage Statistics</h2>
        <p className="text-gray-600 text-sm">
          Track your AI token usage and estimated costs
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-gray-600 mb-1">Total Requests</div>
          <div className="text-2xl font-bold">{stats.totalRequests}</div>
        </Card>

        <Card className="p-4">
          <div className="text-sm text-gray-600 mb-1">Input Tokens</div>
          <div className="text-2xl font-bold">
            {stats.totalInputTokens.toLocaleString()}
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-sm text-gray-600 mb-1">Output Tokens</div>
          <div className="text-2xl font-bold">
            {stats.totalOutputTokens.toLocaleString()}
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-sm text-gray-600 mb-1">Estimated Cost</div>
          <div className="text-2xl font-bold text-green-600">
            ${stats.totalCost.toFixed(4)}
          </div>
        </Card>
      </div>

      {/* Daily Usage Chart */}
      {dailyStats.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Last 7 Days</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Date</th>
                  <th className="text-right py-2">Requests</th>
                  <th className="text-right py-2">Input Tokens</th>
                  <th className="text-right py-2">Output Tokens</th>
                  <th className="text-right py-2">Cost</th>
                </tr>
              </thead>
              <tbody>
                {dailyStats.map((day) => (
                  <tr key={day.date} className="border-b">
                    <td className="py-2">
                      {new Date(day.date).toLocaleDateString()}
                    </td>
                    <td className="text-right">{day.requests}</td>
                    <td className="text-right">
                      {day.inputTokens.toLocaleString()}
                    </td>
                    <td className="text-right">
                      {day.outputTokens.toLocaleString()}
                    </td>
                    <td className="text-right text-green-600">
                      ${day.cost.toFixed(4)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Recent Usage */}
      {stats.recentUsage && stats.recentUsage.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {stats.recentUsage.map((usage: any) => (
              <div
                key={usage.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded"
              >
                <div className="flex-1">
                  <div className="text-sm font-medium">{usage.model}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(usage.createdAt).toLocaleString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm">
                    {usage.totalTokens.toLocaleString()} tokens
                  </div>
                  <div className="text-xs text-green-600">
                    ${usage.estimatedCost.toFixed(4)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Info Card */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <div className="text-blue-600 text-xl">ℹ️</div>
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">About Usage Tracking</p>
            <p>
              Costs are estimated based on Anthropic&apos;s Claude pricing. Actual
              costs may vary. Token counts are approximate and based on the AI
              SDK&apos;s usage reporting.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
