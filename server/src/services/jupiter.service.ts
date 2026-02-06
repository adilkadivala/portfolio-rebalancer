import axios from "axios";
import { Connection, PublicKey, VersionedTransaction } from "@solana/web3.js";
import { solanaService } from "./solana.service";
import { logger } from "../utils/logger";

export class JupiterService {
  private readonly JUPITER_QUOTE_API = "https://quote-api.jup.ag/v6";
  private readonly DEXSCREENER_API = "https://api.dexscreener.com/latest/dex/tokens";

  async getQuote(inputMint: string, outputMint: string, amount: number) {
    try {
      const response = await axios.get(`${this.JUPITER_QUOTE_API}/quote`, {
        params: {
          inputMint,
          outputMint,
          amount: Math.floor(amount), // Amount is already in base units for SPL/lamports
          slippageBps: 50, // 0.5% slippage
        },
      });
      return response.data;
    } catch (error) {
      logger.error("Failed to get Jupiter quote", error);
      throw error;
    }
  }

  async executeSwap(quoteResponse: any) {
    try {
      const wallet = solanaService.getWallet();
      const connection = solanaService.getConnection();

      // Get swap transaction
      const { swapTransaction } = await axios.post(`${this.JUPITER_QUOTE_API}/swap`, {
        quoteResponse,
        userPublicKey: wallet.publicKey.toString(),
        wrapAndUnwrapSol: true,
      }).then(res => res.data);

      // Deserialize and sign
      const swapTransactionBuf = Buffer.from(swapTransaction, 'base64');
      const transaction = VersionedTransaction.deserialize(swapTransactionBuf);
      transaction.sign([wallet]);

      // Execute
      const rawTransaction = transaction.serialize();
      const txid = await connection.sendRawTransaction(rawTransaction, {
        skipPreflight: true,
        maxRetries: 2,
      });

      logger.info(`Swap executed: https://solscan.io/tx/${txid}`);
      return txid;
    } catch (error) {
      logger.error("Failed to execute Jupiter swap", error);
      throw error;
    }
  }

  async getTokenPrices(mints: string[]): Promise<{ [mint: string]: number }> {
    try {
      if (mints.length === 0) return {};

      const response = await axios.get(`${this.DEXSCREENER_API}/${mints.join(",")}`);

      const prices: { [mint: string]: number } = {};
      const pairs = response.data.pairs || [];

      // DexScreener returns pairs, we want the price of the searched token
      for (const mint of mints) {
        // Find the best pair for this mint (usually the one with highest liquidity or USDC/SOL pair)
        const pair = pairs.find((p: any) => p.baseToken.address === mint);
        prices[mint] = pair ? parseFloat(pair.priceUsd) : 0;
      }

      // Fallback for SOL if it's the native mint
      if (mints.includes("11111111111111111111111111111111") && !prices["11111111111111111111111111111111"]) {
          // Wrapped SOL often has the price we need
          const wsolPair = pairs.find((p: any) => p.baseToken.address === "So11111111111111111111111111111111111111112");
          prices["11111111111111111111111111111111"] = wsolPair ? parseFloat(wsolPair.priceUsd) : 0;
      }

      return prices;
    } catch (error) {
      logger.error("Failed to fetch token prices from DexScreener", error);
      return {};
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
