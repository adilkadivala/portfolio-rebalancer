export interface PortfolioAllocation {
  mint: string;
  symbol: string;
  amount: number;
  usdValue: number;
  percentage: number;
  targetPercentage: number;
  drift: number;
}

export interface PortfolioSnapshot {
  timestamp: string;
  totalUsdValue: number;
  allocations: PortfolioAllocation[];
  needsRebalancing: boolean;
  driftThreshold: number;
}

export interface WalletInfo {
  address: string;
  totalUsdValue: number;
  tokens: Array<{
    mint: string;
    amount: number;
    symbol: string;
    usdValue: number;
  }>;
}

export interface PortfolioTarget {
  mint: string;
  symbol: string;
  targetPercentage: number;
}