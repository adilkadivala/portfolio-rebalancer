import { portfolioService } from './portfolio.service';
import { jupiterService } from './jupiter.service';
import { logger } from '../utils/logger';

export class RebalancerService {
  private isRunning = false;
  private intervalId?: NodeJS.Timeout;

  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    logger.info('Rebalancer service started');

    // Check every hour
    this.intervalId = setInterval(() => this.checkAndRebalance(), 60 * 60 * 1000);
    
    // Initial check
    this.checkAndRebalance();
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.isRunning = false;
      logger.info('Rebalancer service stopped');
    }
  }

  private async checkAndRebalance() {
    try {
      logger.info('Checking portfolio...');
      
      const snapshot = await portfolioService.getPortfolioSnapshot();
      const trades = await portfolioService.suggestRebalanceTrades(snapshot);

      if (trades.length > 0) {
        logger.info('Rebalance cycle started', { tradeCount: trades.length });
        await this.executeTrades(trades);
      } else {
        logger.info('Portfolio balanced');
      }
    } catch (error) {
      logger.error('Rebalance check failed', error);
    }
  }

  private async executeTrades(trades: any[]) {
    for (const trade of trades) {
      try {
        logger.info(`Executing trade: ${trade.action} ${trade.symbol} ($${trade.usdValue.toFixed(2)})`);
        
        // 1. Get Quote
        const quote = await jupiterService.getQuote(
          trade.inputMint,
          trade.outputMint,
          trade.amountAtoms
        );

        // 2. Execute Swap
        const txid = await jupiterService.executeSwap(quote);
        logger.info(`Trade success: ${txid}`);

        // Wait a bit between trades to avoid RPC rate limits
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        logger.error(`Trade failed for ${trade.symbol}`, error);
      }
    }
  }
}

export const rebalancerService = new RebalancerService();