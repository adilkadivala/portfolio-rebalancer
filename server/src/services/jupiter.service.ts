import axios from 'axios';
import { logger } from '../utils/logger';

export class JupiterService {
  async getQuote(inputMint: string, outputMint: string, amount: number) {
    try {
      const amountInSmallestUnit = Math.floor(amount * 1e6);

      const response = await axios.get('https://api.jup.ag/price/v2', {
        params: {
          ids: [inputMint, outputMint].join(','),
        },
      });

      return {
        inputMint,
        outputMint,
        amount,
        timestamp: new Date(),
        quote: response.data,
      };
    } catch (error) {
      logger.error('Failed to get Jupiter quote', error);
      throw error;
    }
  }

  async simulateSwap(inputMint: string, outputMint: string, amount: number) {
    try {
      const quote = await this.getQuote(inputMint, outputMint, amount);
      return {
        inputAmount: amount,
        estimatedOutput: amount * 0.99, // 1% slippage for MVP
        priceImpact: 0.5,
        quote,
      };
    } catch (error) {
      logger.error('Failed to simulate swap', error);
      throw error;
    }
  }
}

export const jupiterService = new JupiterService();