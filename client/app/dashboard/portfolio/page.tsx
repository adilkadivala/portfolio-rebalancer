'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatUSD, formatPercent } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { TrendingUp, AlertCircle, RefreshCw } from 'lucide-react';
import type { PortfolioSnapshot } from '@/types';

export function Portfolio() {
  const [snapshot, setSnapshot] = useState<PortfolioSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPortfolio();
    const interval = setInterval(loadPortfolio, 10000);
    return () => clearInterval(interval);
  }, []);

  async function loadPortfolio() {
    try {
      const data = await api.getPortfolioSnapshot();
      setSnapshot(data);
    } catch (error) {
      console.error('Failed to load portfolio', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await loadPortfolio();
    setRefreshing(false);
  }

  if (loading) {
    return <div className="text-center py-8">Loading portfolio...</div>;
  }

  if (!snapshot) {
    return <div className="text-center py-8 text-red-500">Failed to load portfolio</div>;
  }

  return (
    <div className="space-y-4">
      {/* Overview Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Portfolio Overview
            </CardTitle>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 hover:bg-gray-100 rounded-md"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold mb-2">{formatUSD(snapshot.totalUsdValue)}</div>
          <p className="text-sm text-gray-600">Total Portfolio Value</p>
        </CardContent>
      </Card>

      {/* Rebalancing Alert */}
      {snapshot.needsRebalancing && (
        <Card className="border-yellow-400 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-yellow-700">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span className="font-medium">Your portfolio needs rebalancing</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Assets Card */}
      <Card>
        <CardHeader>
          <CardTitle>Asset Allocation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {snapshot.allocations.map((alloc) => (
              <div key={alloc.mint} className="border-b pb-4 last:border-0">
                {/* Header */}
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold text-gray-900">{alloc.symbol}</p>
                    <p className="text-sm text-gray-500">{formatNumber(alloc.amount)} tokens</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{formatUSD(alloc.usdValue)}</p>
                    <p className="text-sm text-gray-600">{formatPercent(alloc.percentage)}of portfolio</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-linear-to-r from-blue-500 to-blue-600 h-2.5 rounded-full transition-all"
                        style={{ width: `${Math.min(alloc.percentage, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-600 min-w-fit">
                      Target: {formatPercent(alloc.targetPercentage)}
                    </span>
                  </div>
                </div>

                {/* Drift indicator */}
                {Math.abs(alloc.drift) > 0.1 && (
                  <p
                    className={`text-xs font-medium ${
                      alloc.drift > 0 ? 'text-red-600' : 'text-green-600'
                    }`}
                  >
                    {alloc.drift > 0 ? '↑' : '↓'} {formatPercent(Math.abs(alloc.drift))} from target
                  </p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function formatNumber(value: number, decimals = 4): string {
  return parseFloat(value.toFixed(decimals)).toString();
}