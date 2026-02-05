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
      
      const drifts = await portfolioService.checkPortfolioDrift();
      const trades = await portfolioService.suggestRebalanceTrades(drifts);

      if (trades.length > 0) {
        logger.info('Rebalance needed', { trades });
        // TODO: Execute trades with safety checks
        // await this.executeTrades(trades);
      } else {
        logger.info('Portfolio balanced');
      }
    } catch (error) {
      logger.error('Rebalance check failed', error);
    }
  }
}

export const rebalancerService = new RebalancerService();