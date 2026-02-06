import dotenv from "dotenv";

dotenv.config();

export const config = {
  solana: {
    rpcUrl: process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com",
    commitment: (process.env.SOLANA_COMMITMENT as any) || "confirmed",
  },
  server: {
    port: parseInt(process.env.PORT || "5000"),
    nodeEnv: process.env.NODE_ENV || "development",
  },
  agent: {
    privateKey: process.env.AGENT_PRIVATE_KEY || "",
  },
  groq: {
    groq_key: process.env.GROQ_API_KEY || "",
  },
  portfolio: {
    driftThreshold: 5,
    maxSlippagePercent: 1,
  },
};
