'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Zap, AlertTriangle, TrendingUp } from 'lucide-react';

export function Stats() {
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
    <div className="grid grid-cols-3 gap-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${stats.health ? 'bg-green-100' : 'bg-red-100'}`}>
              <Zap className={`w-5 h-5 ${stats.health ? 'text-green-600' : 'text-red-600'}`} />
            </div>
            <div>
              <p className="text-xs text-gray-500">API Status</p>
              <p className="font-semibold">{stats.health ? 'Connected' : 'Offline'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${stats.wallet ? 'bg-green-100' : 'bg-red-100'}`}>
              <TrendingUp className={`w-5 h-5 ${stats.wallet ? 'text-green-600' : 'text-red-600'}`} />
            </div>
            <div>
              <p className="text-xs text-gray-500">Wallet</p>
              <p className="font-semibold">{stats.wallet ? 'Connected' : 'Error'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${stats.portfolio ? 'bg-green-100' : 'bg-red-100'}`}>
              <AlertTriangle className={`w-5 h-5 ${stats.portfolio ? 'text-green-600' : 'text-red-600'}`} />
            </div>
            <div>
              <p className="text-xs text-gray-500">Portfolio</p>
              <p className="font-semibold">{stats.portfolio ? 'Synced' : 'Error'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}