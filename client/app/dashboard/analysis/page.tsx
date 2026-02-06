"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { 
  BrainCircuit, 
  Sparkles, 
  ShieldCheck, 
  RefreshCw, 
  AlertTriangle,
  Activity
} from "lucide-react";

export default function AIAnalysis() {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [decision, setDecision] = useState<any>(null);
  const [risk, setRisk] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAIInsights();
  }, []);

  async function loadAIInsights() {
    try {
      setLoading(true);

      const [analysisRes, decisionRes, riskRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ai/analyze`),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ai/rebalance-decision`, { method: "POST" }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ai/risk`)
      ]);

      if (analysisRes.ok) {
        const data = await analysisRes.json();
        setAnalysis(data.analysis);
      }
      if (decisionRes.ok) {
        const data = await decisionRes.json();
        setDecision(data.decision);
      }
      if (riskRes.ok) {
        const data = await riskRes.json();
        setRisk(data.risk_assessment);
      }
    } catch (error) {
      console.error("Failed to load AI insights", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8 animate-slide-up">
      <Card className="bg-white/[0.02] border border-border/50 overflow-hidden relative">
        <CardHeader className="border-b border-white/[0.03] bg-white/[0.01] px-6 py-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              Strategic Overview
            </CardTitle>
            <button
               onClick={() => loadAIInsights()}
               disabled={loading}
               className="p-1.5 hover:bg-white/5 rounded-md transition-all"
            >
               <RefreshCw className={cn("w-3.5 h-3.5 text-muted-foreground", loading && "animate-spin")} />
            </button>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          {loading ? (
            <div className="space-y-6">
              <Skeleton className="h-3 w-3/4 opacity-20" />
              <Skeleton className="h-24 w-full opacity-10" />
              <Skeleton className="h-3 w-1/2 opacity-20" />
            </div>
          ) : (
            <div className="space-y-10">
              {/* Decision Badge */}
              {decision && (
                <div className={cn(
                  "p-5 border flex items-start gap-4 transition-all",
                  decision.should_rebalance 
                    ? 'bg-destructive/5 border-destructive/20' 
                    : 'bg-secondary/5 border-secondary/20'
                )}>
                  <div className={cn("p-2 rounded flex-shrink-0", decision.should_rebalance ? 'bg-destructive/10' : 'bg-secondary/10')}>
                    <BrainCircuit className={cn("w-4 h-4", decision.should_rebalance ? 'text-destructive' : 'text-secondary')} />
                  </div>
                  <div>
                    <h4 className="font-bold text-[11px] uppercase tracking-widest mb-1.5">
                      {decision.should_rebalance ? 'Rebalance Optimal' : 'Equilibrium Maintained'}
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed leading-5">{decision.reason}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Risk Alert */}
                {risk && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                       <ShieldCheck className="w-3.5 h-3.5 text-secondary" />
                       Risk Profile
                    </div>
                    <div className="space-y-2">
                       <Badge variant="outline" className="text-[9px] font-bold uppercase py-0.5 px-2 rounded-none border-secondary/30 text-secondary">
                          {risk.risk_level}
                       </Badge>
                       <p className="text-xs text-muted-foreground leading-relaxed italic opacity-80">{risk.explanation}</p>
                    </div>
                  </div>
                )}

                {/* Report Text */}
                {analysis && (
                  <div className="space-y-4">
                     <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        <Activity className="w-3.5 h-3.5 text-primary" />
                        Executive Summary
                     </div>
                     <p className="text-xs text-muted-foreground/80 leading-relaxed border-l border-primary/20 pl-6 py-1">
                       {analysis}
                     </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
