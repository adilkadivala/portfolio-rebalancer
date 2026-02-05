import { config } from '../utils/config';
import { logger } from '../utils/logger';
import { PortfolioTarget, PortfolioSnapshot, PortfolioAllocation } from '../types';
import { solanaService } from './solana.service';
import axios from 'axios';

export class PortfolioService {
  private targets: PortfolioTarget[] = [
    { mint: '11111111111111111111111111111111', symbol: 'SOL', targetPercentage: 40 },
    { mint: 'EPjFWaLb3hyccqJ1xNg7Pg8FFUStZYNYWzJRvDb34Awm', symbol: 'USDC', targetPercentage: 30 },
    { mint: 'JUPyiwrYJFskidkutsNvSQkM4cqee9JiNW9LewDqVLw', symbol: 'JUP', targetPercentage: 20 },
    { mint: 'DezXAZ8z7PnrnRJjV3F7C1ft5dYjduGoVvzQVESFVqWj', symbol: 'BONK', targetPercentage: 10 },
  ];

  setTargets(targets: PortfolioTarget[]) {
    this.targets = targets;
    logger.info('Portfolio targets updated');
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
        '11111111111111111111111111111111': 190,      // SOL
        'EPjFWaLb3hyccqJ1xNg7Pg8FFUStZYNYWzJRvDb34Awm': 1,        // USDC
        'JUPyiwrYJFskidkutsNvSQkM4cqee9JiNW9LewDqVLw': 3.5,       // JUP
        'DezXAZ8z7PnrnRJjV3F7C1ft5dYjduGoVvzQVESFVqWj': 0.00001,  // BONK
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
        alloc.percentage = totalUsdValue > 0 ? (alloc.usdValue / totalUsdValue) * 100 : 0;
        alloc.drift = alloc.percentage - alloc.targetPercentage;
      }

      return {
        timestamp: new Date(),
        totalUsdValue,
        allocations,
        needsRebalancing: allocations.some(a => Math.abs(a.drift) > config.portfolio.driftThreshold),
        driftThreshold: config.portfolio.driftThreshold,
      };
    } catch (error) {
      logger.error('Failed to get portfolio snapshot', error);
      throw error;
    }
  }
}

export const portfolioService = new PortfolioService();