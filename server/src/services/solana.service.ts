import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import bs58 from "bs58";
import { config } from "../utils/config";
import { logger } from "../utils/logger";
import { WalletInfo } from "../types";
import { Buffer } from "buffer";
import { AccountLayout } from "@solana/spl-token";


export class SolanaService {
  private connection: Connection;
  private wallet: Keypair;

  constructor() {
    this.connection = new Connection(
      config.solana.rpcUrl,
      config.solana.commitment,
    );

    if (!config.agent.privateKey) {
      throw new Error("AGENT_PRIVATE_KEY must be set");
    }

    const privateKeyBytes = bs58.decode(config.agent.privateKey);
    this.wallet = Keypair.fromSecretKey(privateKeyBytes);
    logger.info(`Wallet initialized: ${this.wallet.publicKey.toBase58()}`);
  }

  getWalletAddress(): string {
    return this.wallet.publicKey.toBase58();
  }

  async getBalance(): Promise<number> {
    const balance = await this.connection.getBalance(this.wallet.publicKey);
    return balance / 1e9;
  }

  async getTokenBalance(mint: string): Promise<number> {
    try {
      const tokenAccounts = await this.connection.getTokenAccountsByOwner(
        this.wallet.publicKey,
        { mint: new PublicKey(mint) },
      );

      if (tokenAccounts.value.length === 0) return 0;

      const accountData = Buffer.from(tokenAccounts.value[0].account.data);
      const parsedAccountInfo = AccountLayout.decode(accountData);
      console.log(`Mint: ${parsedAccountInfo.mint}`);
      console.log(`Owner: ${parsedAccountInfo.owner}`);
      console.log(`Amount: ${parsedAccountInfo.amount}`);
      return Number(parsedAccountInfo.amount) / 1e9; // ADD THIS LINE
    } catch (error) {
      logger.error(`Failed to get token balance for ${mint}`);
      return 0;
    }
  }

  async getWalletInfo(): Promise<WalletInfo> {
    const solBalance = await this.getBalance();

    return {
      address: this.getWalletAddress(),
      totalUsdValue: solBalance * 190, // Assume $190 per SOL (example)
      tokens: [
        {
          mint: "11111111111111111111111111111111",
          amount: solBalance,
          symbol: "SOL",
          usdValue: solBalance * 190,
        },
      ],
    };
  }
}

export const solanaService = new SolanaService();
