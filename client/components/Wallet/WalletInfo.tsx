'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { shortenAddress, formatUSD } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
    <Card className="bg-white/[0.01] border border-border/50 overflow-hidden relative">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em]">
          <Wallet className="w-3.5 h-3.5" />
          Custodian Vault
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <p className="text-3xl font-bold tracking-tight">
              {formatUSD(wallet.totalUsdValue)}
            </p>
            <p className="text-[9px] font-mono text-muted-foreground mt-2 opacity-40 break-all leading-relaxed">
              {wallet.address}
            </p>
          </div>
          
          <div className="pt-4 border-t border-white/[0.03] space-y-3">
            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              <span>Network</span>
              <Badge variant="outline" className="text-[9px] h-5 px-2 border-primary/20 text-primary bg-primary/5 rounded-none font-bold uppercase">
                 SOLANA MAINNET
              </Badge>
            </div>
            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              <span>Status</span>
              <span className="text-secondary font-bold">CONNECTED</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}