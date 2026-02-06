export interface PortfolioTarget {
  mint: string;
  symbol: string;
  targetPercentage: number;
  decimals: number;
}

export interface PortfolioDrift {
  symbol: string;
  current: number;
  target: number;
  drift: number; 
  needsRebalance: boolean;
}

export interface PortfolioAllocation {
  mint: string;
  symbol: string;
  amount: number;
  usdValue: number;
  percentage: number;
  targetPercentage: number;
  drift: number;
  decimals: number;
}

export interface PortfolioSnapshot {
  timestamp: Date;
  totalUsdValue: number;
  allocations: PortfolioAllocation[];
  needsRebalancing: boolean;
  driftThreshold: number;
}

export interface TokenPrice {
  mint: string;
  symbol: string;
  price: number;
  decimals: number;
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
