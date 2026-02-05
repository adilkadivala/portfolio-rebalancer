import axios from "axios";
import { Connection, PublicKey, VersionedTransaction } from "@solana/web3.js";
import { solanaService } from "./solana.service";
import { logger } from "../utils/logger";

export class JupiterService {
  private readonly JUPITER_API = "https://quote-api.jup.ag/v6";

  async getQuote(inputMint: string, outputMint: string, amount: number) {
    try {
      const response = await axios.get(`${this.JUPITER_API}/quote`, {
        params: {
          inputMint,
          outputMint,
          amount: Math.floor(amount * 1e9), // Convert to lamports
          slippageBps: 50, // 0.5% slippage
        },
      });
      return response.data;
    } catch (error) {
      logger.error("Failed to get Jupiter quote", error);
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
      logger.error("Failed to simulate swap", error);
      throw error;
    }
  }
}

export const jupiterService = new JupiterService();
