import express, { Request, Response } from "express";
import cors from "cors";
import { config } from "./utils/config";
import { logger } from "./utils/logger";
import { solanaService } from "./services/solana.service";
import { portfolioService } from "./services/portfolio.service";
import { jupiterService } from "./services/jupiter.service";
import { groqService } from "./services/groq.service";
import { rebalancerService } from "./services/rebalancer-service";

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

app.post("/api/portfolio/rebalance", async (req: Request, res: Response) => {
  try {
    const snapshot = await portfolioService.getPortfolioSnapshot();
    const trades = await portfolioService.suggestRebalanceTrades(snapshot);

    if (trades.length === 0) {
      res.json({ message: "Portfolio is already balanced", trades: [] });
      return;
    }

    // Since this is a manual trigger, we can just run the check and rebalance logic
    // We'll run it in the background or wait for it? For API let's wait but with timeout or just trigger.
    // The rebalancerService already has a private method; we could expose it or just let it run.
    
    // For now, let's just trigger a rebalance cycle
    (rebalancerService as any).checkAndRebalance(); 
    
    res.json({ 
      message: "Rebalance cycle triggered", 
      trades 
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to trigger rebalance" });
  }
});

// AI Analysis - Analyze portfolio using Groq

app.get("/api/ai/analyze", async (req: Request, res: Response) => {
  try {
    const snapshot = await portfolioService.getPortfolioSnapshot();
    const targets = portfolioService.getTargets();

    const analysis = await groqService.analyzePortfolio(snapshot, targets);

    res.json({
      analysis,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Error analyzing portfolio", error);
    res.status(500).json({ error: "Failed to analyze portfolio" });
  }
});

// AI Decision - Should we rebalance?

app.post("/api/ai/rebalance-decision", async (req: Request, res: Response) => {
  try {
    const snapshot = await portfolioService.getPortfolioSnapshot();

    // Mock market conditions - you'd get real data in production
    const marketConditions = {
      volatility: "medium" as const,
      trend: "neutral" as const,
      solana_price_change: 2.5,
    };

    const decision = await groqService.shouldRebalanceNow(
      snapshot,
      marketConditions,
    );

    res.json({
      decision,
      current_drift_threshold: snapshot.driftThreshold,
      needs_rebalancing: snapshot.needsRebalancing,
    });
  } catch (error) {
    logger.error("Error making rebalance decision", error);
    res.status(500).json({ error: "Failed to make decision" });
  }
});

// AI Trade Order - Suggest optimal trade sequence

app.get("/api/ai/trade-order", async (req: Request, res: Response) => {
  try {
    const snapshot = await portfolioService.getPortfolioSnapshot();
    const trades = await groqService.suggestTradeOrder(snapshot);

    res.json({
      suggested_trades: trades,
      total_trades: trades.length,
    });
  } catch (error) {
    logger.error("Error suggesting trade order", error);
    res.status(500).json({ error: "Failed to suggest trades" });
  }
});

// AI Report - Natural language portfolio report

app.get("/api/ai/report", async (req: Request, res: Response) => {
  try {
    const snapshot = await portfolioService.getPortfolioSnapshot();
    const report = await groqService.generatePortfolioReport(snapshot);

    res.json({
      report,
      portfolio_value: `$${snapshot.totalUsdValue.toFixed(2)}`,
      balanced: !snapshot.needsRebalancing,
    });
  } catch (error) {
    logger.error("Error generating report", error);
    res.status(500).json({ error: "Failed to generate report" });
  }
});

// AI Risk Assessment

app.get("/api/ai/risk", async (req: Request, res: Response) => {
  try {
    const snapshot = await portfolioService.getPortfolioSnapshot();
    const risk = await groqService.assessRisk(snapshot);

    res.json({
      risk_assessment: risk,
      portfolio_value: `$${snapshot.totalUsdValue.toFixed(2)}`,
    });
  } catch (error) {
    logger.error("Error assessing risk", error);
    res.status(500).json({ error: "Failed to assess risk" });
  }
});

// Start server
const PORT = config.server.port;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${config.server.nodeEnv}`);
  logger.info(`Wallet: ${solanaService.getWalletAddress()}`);
  
  // Start the autonomous rebalancer
  rebalancerService.start();
});
