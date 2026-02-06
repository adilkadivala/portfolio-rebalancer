import { config } from "../utils/config";
import { logger } from "../utils/logger";
import {
  PortfolioTarget,
  PortfolioSnapshot,
  PortfolioAllocation,
  PortfolioDrift,
} from "../types";
import { solanaService } from "./solana.service";
import { jupiterService } from "./jupiter.service";

export class PortfolioService {
  private targets: PortfolioTarget[] = [
    {
      mint: "11111111111111111111111111111111",
      symbol: "SOL",
      targetPercentage: 40,
      decimals: 9,
    },
    {
      mint: "EPjFWaLb3hyccqJ1xNg7Pg8FFUStZYNYWzJRvDb34Awm",
      symbol: "USDC",
      targetPercentage: 30,
      decimals: 6,
    },
    {
      mint: "JUPyiwrYJFskidkutsNvSQkM4cqee9JiNW9LewDqVLw",
      symbol: "JUP",
      targetPercentage: 20,
      decimals: 6, // JUP is 6 decimals
    },
    {
      mint: "DezXAZ8z7PnrnRJjV3F7C1ft5dYjduGoVvzQVESFVqWj",
      symbol: "BONK",
      targetPercentage: 10,
      decimals: 5, // BONK is 5 decimals
    },
  ];

  private driftThreshold = 5;

  setTargets(targets: PortfolioTarget[]) {
    this.targets = targets;
    logger.info("Portfolio targets updated");
  }

  getTargets(): PortfolioTarget[] {
    return this.targets;
  }

  async getPortfolioSnapshot(): Promise<PortfolioSnapshot> {
    try {
      const allocations: PortfolioAllocation[] = [];
      let totalUsdValue = 0;

      const mints = this.targets.map(t => t.mint);
      const prices = await jupiterService.getTokenPrices(mints);

      for (const target of this.targets) {
        const amount = await solanaService.getTokenBalance(target.mint);
        const price = prices[target.mint] || 0;
        const usdValue = amount * price;
        totalUsdValue += usdValue;

        allocations.push({
          mint: target.mint,
          symbol: target.symbol,
          amount,
          usdValue,
          percentage: 0,
          targetPercentage: target.targetPercentage,
          drift: 0,
          decimals: target.decimals,
        });
      }

      // Calculate percentages and drift
      for (const alloc of allocations) {
        alloc.percentage =
          totalUsdValue > 0 ? (alloc.usdValue / totalUsdValue) * 100 : 0;
        alloc.drift = alloc.percentage - alloc.targetPercentage;
      }

      return {
        timestamp: new Date(),
        totalUsdValue,
        allocations,
        needsRebalancing: allocations.some(
          (a) => Math.abs(a.drift) > config.portfolio.driftThreshold,
        ),
        driftThreshold: config.portfolio.driftThreshold,
      };
    } catch (error) {
      logger.error("Failed to get portfolio snapshot", error);
      throw error;
    }
  }

  async checkPortfolioDrift(): Promise<PortfolioDrift[]> {
    const drifts: PortfolioDrift[] = [];
    let totalValue = 0;

    const mints = this.targets.map(t => t.mint);
    const prices = await jupiterService.getTokenPrices(mints);

    // Get current balances
    const balances = await Promise.all(
      this.targets.map(async (target) => {
        const balance =
          target.symbol === "SOL"
            ? await solanaService.getBalance()
            : await solanaService.getTokenBalance(target.mint);

        const price = prices[target.mint] || 0;
        const value = balance * price;
        totalValue += value;

        return { ...target, balance, value };
      }),
    );
    balances.forEach((item) => {
      const currentPercentage = (item.value / totalValue) * 100;
      const drift = currentPercentage - item.targetPercentage;

      drifts.push({
        symbol: item.symbol,
        current: currentPercentage,
        target: item.targetPercentage,
        drift: drift,
        needsRebalance: Math.abs(drift) > this.driftThreshold,
      });
    });

    logger.info("Portfolio drift checked", { drifts });
    return drifts;
  }

  async suggestRebalanceTrades(snapshot: PortfolioSnapshot) {
    const trades: any[] = [];
    const pivotMint = "EPjFWaLb3hyccqJ1xNg7Pg8FFUStZYNYWzJRvDb34Awm"; // USDC
    
    // 1. Identify Overweight (Sells to USDC)
    for (const alloc of snapshot.allocations) {
      if (alloc.drift > this.driftThreshold && alloc.mint !== pivotMint) {
        // We need to sell this much USD value of the token
        const usdToSell = (alloc.drift / 100) * snapshot.totalUsdValue;
        const price = alloc.usdValue / alloc.amount;
        const tokensToSell = usdToSell / price;
        
        const amountAtoms = Math.floor(tokensToSell * Math.pow(10, alloc.decimals));

        if (amountAtoms > 0) {
          trades.push({
            action: "SELL",
            inputMint: alloc.mint,
            outputMint: pivotMint,
            amountAtoms,
            symbol: alloc.symbol,
            usdValue: usdToSell
          });
        }
      }
    }

    // 2. Identify Underweight (Buys from USDC)
    for (const alloc of snapshot.allocations) {
      if (alloc.drift < -this.driftThreshold && alloc.mint !== pivotMint) {
        const usdToBuy = (Math.abs(alloc.drift) / 100) * snapshot.totalUsdValue;
        
        // We sell USDC to buy this token
        const amountAtoms = Math.floor(usdToBuy * 1e6); // USDC has 6 decimals

        if (amountAtoms > 0) {
          trades.push({
            action: "BUY",
            inputMint: pivotMint,
            outputMint: alloc.mint,
            amountAtoms,
            symbol: alloc.symbol,
            usdValue: usdToBuy
          });
        }
      }
    }

    return trades;
  }
}

export const portfolioService = new PortfolioService();
