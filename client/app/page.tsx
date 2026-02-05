'use client';

import { useState, useEffect } from 'react';
import { WalletInfo } from '@/components/Wallet/WalletInfo';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import { Stats } from './dashboard/status/page';
import { Portfolio } from './dashboard/portfolio/page';

export default function Home() {
  const [apiUrl, setApiUrl] = useState<string>('');

  useEffect(() => {
    setApiUrl(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000');
  }, []);

  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 animate-slideDown">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-8 h-8 text-blue-600" />
            <h1 className="text-4xl font-bold">Portfolio Rebalancer</h1>
          </div>
          <p className="text-gray-600">
            Autonomous Solana Portfolio Rebalancing Agent
          </p>
          <p className="text-sm text-gray-500 mt-2">
            API: {apiUrl}
          </p>
        </div>

        {/* Stats */}
        <Stats />

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-8">
          {/* Left Column - Main Portfolio */}
          <div className="lg:col-span-3">
            <Portfolio />
          </div>

          {/* Right Sidebar */}
          <div className="space-y-4">
            {/* Wallet Info */}
            <WalletInfo />

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors mb-2 font-medium">
                  Rebalance Now
                </button>
                <button className="w-full bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300 transition-colors font-medium">
                  View History
                </button>
              </CardContent>
            </Card>

            {/* Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Drift Threshold (%)</label>
                    <input 
                      type="number" 
                      defaultValue="5" 
                      className="w-full mt-1 border border-input rounded-md px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Max Slippage (%)</label>
                    <input 
                      type="number" 
                      defaultValue="1" 
                      className="w-full mt-1 border border-input rounded-md px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}