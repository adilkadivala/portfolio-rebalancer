'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatUSD, formatPercent, cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, AlertCircle, RefreshCw } from 'lucide-react';
import type { PortfolioSnapshot } from '@/types';

export default function Portfolio() {
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
    <div className="space-y-8 animate-slide-up">
      {/* Overview Card */}
      <Card className="bg-white/[0.02] border border-border/50 overflow-hidden relative">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5" />
              Aggregate Portfolio Value
            </CardTitle>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-1.5 hover:bg-white/5 rounded-md transition-colors"
            >
              <RefreshCw className={cn("w-3.5 h-3.5 text-muted-foreground", refreshing && "animate-spin")} />
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-3">
            <div className="text-4xl font-bold tracking-tight">
              {formatUSD(snapshot.totalUsdValue)}
            </div>
            <Badge variant={snapshot.needsRebalancing ? "destructive" : "secondary"} className="h-5 text-[10px] font-bold px-2 uppercase rounded-none tracking-widest border-none">
              {snapshot.needsRebalancing ? "Drift Detected" : "Optimal"}
            </Badge>
          </div>
          <div className="mt-4 flex items-center gap-6 text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-t border-white/[0.03] pt-4">
            <div className="flex items-center gap-2">
               <span className="w-1.5 h-1.5 rounded-full bg-primary" />
               Threshold: {snapshot.driftThreshold}%
            </div>
            <div className="flex items-center gap-2">
               <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
               Assets: {snapshot.allocations.length}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {snapshot.allocations.map((alloc) => {
          const driftSeverity = Math.abs(alloc.drift) > snapshot.driftThreshold * 2 ? 'high' : 
                               Math.abs(alloc.drift) > snapshot.driftThreshold ? 'medium' : 'low';
          
          return (
            <Card key={alloc.mint} className="bg-white/[0.01] border border-border/50 hover:border-primary/30 transition-all group relative overflow-hidden">
              {/* Drift Severity Glow */}
              {driftSeverity !== 'low' && (
                <div className={cn(
                  "absolute top-0 right-0 w-24 h-24 blur-[40px] opacity-10 pointer-events-none",
                  driftSeverity === 'high' ? "bg-destructive" : "bg-primary"
                )} />
              )}

              <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 border border-border/50 rounded flex items-center justify-center font-bold text-xs bg-black/40 group-hover:border-primary/50 transition-colors uppercase">
                      {alloc.symbol.slice(0, 2)}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm tracking-tight">{alloc.symbol}</h3>
                      <p className="text-[10px] text-muted-foreground font-mono opacity-50 uppercase tracking-tighter">
                        {formatNumber(alloc.amount, 4)} Units
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm">{formatUSD(alloc.usdValue)}</p>
                    <p className="text-[10px] text-muted-foreground font-bold tracking-widest">{formatPercent(alloc.percentage)} WEIGHT</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-[9px] uppercase tracking-[0.2em] font-bold text-muted-foreground">
                      <span>Allocation Delta</span>
                      <span>Target: {formatPercent(alloc.targetPercentage)}</span>
                    </div>
                    
                    {/* Advanced Progress Bar with Target Marker */}
                    <div className="relative h-1.5 w-full bg-white/[0.03] rounded-full overflow-hidden">
                      {/* Highlight segment between current and target */}
                      <div 
                        className={cn(
                          "absolute h-full transition-all duration-500 opacity-40",
                          alloc.drift > 0 ? "bg-destructive" : "bg-primary"
                        )}
                        style={{ 
                          left: `${Math.min(alloc.percentage, alloc.targetPercentage)}%`,
                          width: `${Math.abs(alloc.drift)}%`
                        }}
                      />
                      {/* Current Percentage */}
                      <div 
                        className="absolute h-full bg-foreground transition-all duration-500"
                        style={{ width: `${alloc.percentage}%` }}
                      />
                      {/* Target Indicator Line */}
                      <div 
                        className="absolute h-full w-0.5 bg-primary/80 z-10 transition-all duration-500"
                        style={{ left: `${alloc.targetPercentage}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex gap-2">
                       {Math.abs(alloc.drift) > 0.1 && (
                        <span className={cn(
                          "text-[9px] font-bold px-2 py-0.5 rounded-none uppercase tracking-widest flex items-center gap-1.5",
                          alloc.drift > 0 ? 'bg-destructive/10 text-destructive' : 'bg-secondary/10 text-secondary'
                        )}>
                          <div className={cn("w-1 h-1 rounded-full animate-pulse", alloc.drift > 0 ? "bg-destructive" : "bg-secondary")} />
                          {alloc.drift > 0 ? 'Surplus' : 'Deficit'}: {formatPercent(Math.abs(alloc.drift), 1)}
                        </span>
                       )}
                       {driftSeverity === 'high' && (
                         <span className="text-[9px] font-bold px-2 py-0.5 bg-destructive/20 text-destructive border border-destructive/20 uppercase tracking-widest">
                            Critical Drift
                         </span>
                       )}
                    </div>
                    <span className="text-[9px] font-mono text-muted-foreground opacity-30 tracking-tight">{alloc.mint.slice(0, 4)}...{alloc.mint.slice(-4)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function formatNumber(value: number, decimals = 4): string {
  return parseFloat(value.toFixed(decimals)).toString();
}