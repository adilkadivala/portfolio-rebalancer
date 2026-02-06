'use client';

import { TrendingUp, CreditCard, Sparkles } from 'lucide-react';
import Stats from './status/page';
import Portfolio from './portfolio/page';
import AIAnalysis from './analysis/page';
import { WalletInfo } from '@/components/Wallet/WalletInfo';

export default function DashboardOverview() {
  return (
    <div className="space-y-10">
      {/* Status Bar */}
      <section>
         <Stats />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Portfolio Column */}
        <div className="lg:col-span-8 space-y-8">
           <div>
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> Liquidity Overview
              </h3>
              <Portfolio />
           </div>
        </div>

        {/* Sidebar Column */}
        <div className="lg:col-span-4 space-y-8">
           <div>
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <CreditCard className="w-4 h-4" /> Vault
              </h3>
              <WalletInfo />
           </div>

           <div>
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> AI Intelligence
              </h3>
              <AIAnalysis />
           </div>
        </div>
      </section>
    </div>
  );
}
