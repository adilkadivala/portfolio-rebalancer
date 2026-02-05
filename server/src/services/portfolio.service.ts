import { config } from "../utils/config";
import { logger } from "../utils/logger";
import {
  PortfolioTarget,
  PortfolioSnapshot,
  PortfolioAllocation,
  PortfolioDrift,
} from "../types";
import { solanaService } from "./solana.service";

export class PortfolioService {
  private targets: PortfolioTarget[] = [
    {
      mint: "11111111111111111111111111111111",
      symbol: "SOL",
      targetPercentage: 40,
    },
    {
      mint: "EPjFWaLb3hyccqJ1xNg7Pg8FFUStZYNYWzJRvDb34Awm",
      symbol: "USDC",
      targetPercentage: 30,
    },
    {
      mint: "JUPyiwrYJFskidkutsNvSQkM4cqee9JiNW9LewDqVLw",
      symbol: "JUP",
      targetPercentage: 20,
    },
    {
      mint: "DezXAZ8z7PnrnRJjV3F7C1ft5dYjduGoVvzQVESFVqWj",
      symbol: "BONK",
      targetPercentage: 10,
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

      // Mock data for MVP - you'll integrate real price feeds later
      const mockPrices: { [key: string]: number } = {
        "11111111111111111111111111111111": 190, // SOL
        EPjFWaLb3hyccqJ1xNg7Pg8FFUStZYNYWzJRvDb34Awm: 1, // USDC
        JUPyiwrYJFskidkutsNvSQkM4cqee9JiNW9LewDqVLw: 3.5, // JUP
        DezXAZ8z7PnrnRJjV3F7C1ft5dYjduGoVvzQVESFVqWj: 0.00001, // BONK
      };

      for (const target of this.targets) {
        const amount = await solanaService.getTokenBalance(target.mint);
        const price = mockPrices[target.mint] || 0;
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

    // Get current balances
    const balances = await Promise.all(
      this.targets.map(async (target) => {
        const balance =
          target.symbol === "SOL"
            ? await solanaService.getBalance()
            : await solanaService.getTokenBalance(target.mint);

        // TODO: Get real price from Jupiter/Pyth
        const price = target.symbol === "SOL" ? 190 : 1; // Placeholder
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

  async suggestRebalanceTrades(drifts: PortfolioDrift[]) {
    const needsRebalance = drifts.filter((d) => d.needsRebalance);

    if (needsRebalance.length === 0) {
      logger.info("Portfolio is balanced");
      return [];
    }

    const trades = needsRebalance.map((drift) => ({
      action: drift.drift > 0 ? "SELL" : "BUY",
      symbol: drift.symbol,
      amount: Math.abs(drift.drift),
    }));

    return trades;
  }
}

export const portfolioService = new PortfolioService();
