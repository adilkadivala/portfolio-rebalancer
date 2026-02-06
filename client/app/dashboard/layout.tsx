'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  TrendingUp, 
  Settings, 
  LayoutDashboard, 
  History as HistoryIcon, 
  Shield, 
  ChevronRight,
  Cpu,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [rebalancing, setRebalancing] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  async function handleManualRebalance() {
    try {
      setRebalancing(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/portfolio/rebalance`, {
        method: 'POST'
      });
      const data = await res.json();
      alert(data.message || 'Rebalance triggered');
    } catch (error) {
       alert('Failed to trigger rebalance');
    } finally {
      setRebalancing(false);
    }
  }

  const navItems = [
    { name: 'Executive Suite', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Portfolio', href: '/dashboard/portfolio', icon: TrendingUp },
    { name: 'Intelligence', href: '/dashboard/analysis', icon: Shield },
    { name: 'Connectivity', href: '/dashboard/status', icon: RefreshCw },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row font-sans">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border p-8 bg-black/20 space-y-10">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Cpu className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold tracking-tight text-base leading-none">ANTIGRAVITY</h1>
            <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-semibold mt-1 opacity-70">DEFI PROTOCOL</p>
          </div>
        </Link>

        <nav className="flex-1 -mx-2 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <Button 
                  variant="ghost" 
                  className={cn(
                    "w-full justify-start gap-3 transition-colors px-3 h-10 rounded-md text-sm",
                    isActive 
                      ? "bg-white/[0.03] text-foreground font-semibold shadow-xs" 
                      : "text-muted-foreground hover:text-foreground hover:bg-white/[0.02]"
                  )}
                >
                  <item.icon className={cn("w-4 h-4", isActive ? "text-primary" : "opacity-50")} /> 
                  <span className="flex-1">{item.name}</span>
                  {isActive && <div className="w-1 h-1 rounded-full bg-primary" />}
                </Button>
              </Link>
            );
          })}
        </nav>

        <div className="pt-6 border-t border-border/50">
           <div className="flex items-center justify-between px-2 mb-4">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Network</span>
              <div className="flex items-center gap-1.5">
                 <div className="w-1.5 h-1.5 rounded-full bg-secondary shadow-[0_0_8px_rgba(20,241,149,0.3)] animate-pulse" />
                 <span className="text-[10px] text-secondary font-bold">LIVE</span>
              </div>
           </div>
           <Button variant="outline" className="w-full text-xs h-9 border-border/50 bg-black/10 hover:bg-black/20">
              Mainnet Beta
           </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen relative overflow-hidden bg-background">
        {/* Subtle Ambient Light */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/3 blur-[100px] rounded-full pointer-events-none" />

        {/* Header */}
        <header className={cn(
          "sticky top-0 z-50 transition-all px-8 py-5 flex items-center justify-between",
          scrolled ? "bg-background/90 backdrop-blur-sm border-b border-border" : "bg-transparent"
        )}>
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-[0.1em]">
              {navItems.find(i => i.href === pathname)?.name || 'Executive Dashboard'}
            </h2>
          </div>

          <div className="flex items-center gap-4">
             <div className="flex items-center gap-3 pr-4 border-r border-border">
                <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                   <Settings className="w-4 h-4" />
                </Button>
             </div>
             <Button 
                variant="default" 
                className="rounded-full px-5 h-9 text-xs font-bold transition-all active:scale-95 shadow-lg shadow-primary/10" 
                onClick={handleManualRebalance} 
                disabled={rebalancing}
             >
                {rebalancing ? <RefreshCw className="w-3 h-3 animate-spin mr-2" /> : null}
                {rebalancing ? 'EXECUTING' : 'REBALANCE ASSETS'}
                {!rebalancing && <ChevronRight className="w-3 h-3 ml-2 opacity-50" />}
             </Button>
          </div>
        </header>

        <div className="p-8 md:p-12 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
