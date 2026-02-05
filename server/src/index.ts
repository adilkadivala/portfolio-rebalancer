import express, { Request, Response } from "express";
import cors from "cors";
import { config } from "./utils/config";
import { logger } from "./utils/logger";
import { solanaService } from "./services/solana.service";
import { portfolioService } from "./services/portfolio.service";
import { jupiterService } from "./services/jupiter.service";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Routes
app.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/wallet", async (req: Request, res: Response) => {
  try {
    const walletInfo = await solanaService.getWalletInfo();
    res.json(walletInfo);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch wallet info" });
  }
});

app.get("/api/portfolio/snapshot", async (req: Request, res: Response) => {
  try {
    const snapshot = await portfolioService.getPortfolioSnapshot();
    res.json(snapshot);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch portfolio snapshot" });
  }
});

app.get("/api/portfolio/targets", (req: Request, res: Response) => {
  try {
    const targets = portfolioService.getTargets();
    res.json(targets);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch targets" });
  }
});

app.post("/api/portfolio/targets", (req: Request, res: Response) => {
  try {
    const { targets } = req.body;
    portfolioService.setTargets(targets);
    res.json({ message: "Targets updated", targets });
  } catch (error) {
    res.status(500).json({ error: "Failed to update targets" });
  }
});

app.post("/api/swap/simulate", async (req: Request, res: Response) => {
  try {
    const { inputMint, outputMint, amount } = req.body;
    const simulation = await jupiterService.simulateSwap(
      inputMint,
      outputMint,
      amount,
    );
    res.json(simulation);
  } catch (error) {
    res.status(500).json({ error: "Failed to simulate swap" });
  }
});

app.get("/status", async (req: Request, res: Response) => {
  try {
    const drifts = await portfolioService.checkPortfolioDrift();
    const walletInfo = await solanaService.getWalletInfo();

    res.json({
      wallet: walletInfo,
      drifts,
      needsRebalance: drifts.some((d) => d.needsRebalance),
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to get portfolio status" });
  }
});

app.post("/rebalance", async (req: Request, res: Response) => {
  // Manual trigger for testing
  res.json({ message: "Rebalance triggered" });
});

// Start server
const PORT = config.server.port;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${config.server.nodeEnv}`);
  logger.info(`Wallet: ${solanaService.getWalletAddress()}`);
});
