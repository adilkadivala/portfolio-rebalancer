'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { shortenAddress, formatUSD } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Wallet } from 'lucide-react';
import type { WalletInfo as WalletInfoType } from '@/types';

export function WalletInfo() {
  const [wallet, setWallet] = useState<WalletInfoType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadWallet();
    const interval = setInterval(loadWallet, 30000);
    return () => clearInterval(interval);
  }, []);

  async function loadWallet() {
    try {
      const data = await api.getWallet();
      setWallet(data);
      setError(null);
    } catch (err) {
      setError('Failed to load wallet');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="text-center py-4">Loading...</div>;
  if (error) return <div className="text-red-500 text-sm">{error}</div>;
  if (!wallet) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="w-5 h-5" />
          Wallet
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <p className="text-xs text-gray-500">Address</p>
            <p className="text-sm font-mono text-gray-700">{shortenAddress(wallet.address)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Total Value</p>
            <p className="text-lg font-bold">{formatUSD(wallet.totalUsdValue)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}