'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Zap, AlertTriangle, TrendingUp } from 'lucide-react';

export default function Stats() {
  const [stats, setStats] = useState({ health: false, wallet: false, portfolio: false });

  useEffect(() => {
    checkStatus();
  }, []);

  async function checkStatus() {
    try {
      await api.health();
      setStats((s) => ({ ...s, health: true }));
    } catch (e) {}

    try {
      await api.getWallet();
      setStats((s) => ({ ...s, wallet: true }));
    } catch (e) {}

    try {
      await api.getPortfolioSnapshot();
      setStats((s) => ({ ...s, portfolio: true }));
    } catch (e) {}
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="bg-white/[0.01] border border-border/50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className={cn("p-2 border rounded", stats.health ? 'bg-secondary/5 border-secondary/20' : 'bg-destructive/5 border-destructive/20')}>
              <Zap className={cn("w-4 h-4", stats.health ? 'text-secondary' : 'text-destructive')} />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Protocol API</p>
              <p className="text-xs font-bold mt-0.5 tracking-tight">{stats.health ? 'OPERATIONAL' : 'OFFLINE'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/[0.01] border border-border/50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className={cn("p-2 border rounded", stats.wallet ? 'bg-secondary/5 border-secondary/20' : 'bg-destructive/5 border-destructive/20')}>
              <TrendingUp className={cn("w-4 h-4", stats.wallet ? 'text-secondary' : 'text-destructive')} />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Indexer Hub</p>
              <p className="text-xs font-bold mt-0.5 tracking-tight">{stats.wallet ? 'SYNCHRONIZED' : 'ASYNC'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/[0.01] border border-border/50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className={cn("p-2 border rounded", stats.portfolio ? 'bg-secondary/5 border-secondary/20' : 'bg-destructive/5 border-destructive/20')}>
              <AlertTriangle className={cn("w-4 h-4", stats.portfolio ? 'text-secondary' : 'text-destructive')} />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Risk Agent</p>
              <p className="text-xs font-bold mt-0.5 tracking-tight">{stats.portfolio ? 'VIGILANT' : 'STALLED'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}