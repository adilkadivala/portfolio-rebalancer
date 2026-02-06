import Groq from "groq-sdk";
import { config } from "../utils/config";
import { logger } from "../utils/logger";
import { PortfolioSnapshot, PortfolioTarget } from "../types";

export class GroqService {
  private groq: Groq;

  constructor() {
    this.groq = new Groq({
      apiKey: config.groq.groq_key,
    });

    if (!config.groq.groq_key) {
      throw new Error("GROQ_API_KEY must be set in .env");
    }

    logger.info("✅ Groq Service initialized");
  }

  /**
   * Analyze portfolio and suggest rebalancing strategy
   */
  async analyzePortfolio(
    snapshot: PortfolioSnapshot,
    targets: PortfolioTarget[],
  ): Promise<string> {
    try {
      const portfolioData = JSON.stringify({
        totalValue: `$${snapshot.totalUsdValue.toFixed(2)}`,
        allocations: snapshot.allocations.map((a) => ({
          symbol: a.symbol,
          current_percentage: a.percentage.toFixed(2) + "%",
          target_percentage: a.targetPercentage + "%",
          drift: a.drift.toFixed(2) + "%",
          usd_value: `$${a.usdValue.toFixed(2)}`,
        })),
        needs_rebalancing: snapshot.needsRebalancing,
        drift_threshold: snapshot.driftThreshold + "%",
      });

      const prompt = `
You are an Elite Institutional DeFi Analyst. Provide a sophisticated, data-driven analysis of this digital asset portfolio:

PORTFOLIO SPECIFICATIONS:
${portfolioData}

TASKS:
1. QUANTITATIVE ANALYSIS: Evaluate the current drift against the ${snapshot.driftThreshold}% tolerance. Is rebalancing mathematically optimal considering potential slippage?
2. ASSET VELOCITY: Identify which assets are showing excessive concentration or critical underweight issues.
3. STRATEGIC POSITIONING: Recommend a specific rebalancing sequence to return to target weights with minimal market impact.
4. RISK EXPOSURE: Categorize risks into Concentration, Liquidity, and Volatility buckets.
5. EXECUTIVE SUMMARY: Provide a definitive 2-sentence tactical recommendation.

TONE: Professional, analytical, and authoritative. Avoid fluff.
`;

      const response = await this.groq.chat.completions.create({
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        model: "llama-3.3-70b-versatile", // Fast and capable
        temperature: 0.3, // Lower = more consistent
        max_tokens: 500,
      });

      const analysis =
        response.choices[0]?.message?.content || "Unable to analyze";

      logger.info("📊 Portfolio analysis from Groq:", analysis);

      return analysis;
    } catch (error) {
      logger.error("Failed to analyze portfolio with Groq", error);
      throw error;
    }
  }

  /**
   * Decide if we should rebalance right now
   */
  async shouldRebalanceNow(
    snapshot: PortfolioSnapshot,
    marketConditions: {
      volatility: "low" | "medium" | "high";
      trend: "bullish" | "neutral" | "bearish";
      solana_price_change: number; // percentage
    },
  ): Promise<{
    should_rebalance: boolean;
    reason: string;
    priority: "low" | "medium" | "high";
  }> {
    try {
      const prompt = `
Act as a High-Frequency Executive Portfolio Governor. Determine if an immediate rebalancing execution is warranted.

PROTOCOL PARAMETERS:
- Net Worth: $${snapshot.totalUsdValue.toFixed(2)}
- Operational Threshold: ${snapshot.driftThreshold}%
- Imbalanced Vectors: ${snapshot.allocations
        .filter((a) => Math.abs(a.drift) > snapshot.driftThreshold)
        .map((a) => `${a.symbol} (${a.drift.toFixed(1)}% drift)`)
        .join(", ")}

EXTERNAL MARKET TELEMETRY:
- Volatility Index: ${marketConditions.volatility.toUpperCase()}
- Sentiment Trend: ${marketConditions.trend.toUpperCase()}
- SOL Velocity (24h): ${marketConditions.solana_price_change.toFixed(2)}%

GOVERNANCE LOGIC:
1. EXECUTION INHIBITORS: Is volatility too high (>Medium) to allow for efficient swap execution?
2. MOMENTUM OVERLAY: Does the trend (${marketConditions.trend}) suggest that maintaining a temporary drift is actually more profitable than rebalancing?
3. DRIFT SEVERITY: Does any asset exceed the threshold by more than 2x?

OUTPUT SPECIFICATION (JSON ONLY):
{
  "should_rebalance": boolean,
  "reason": "Technical justification for the decision",
  "priority": "low/medium/high"
}
`;

      const response = await this.groq.chat.completions.create({
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.2,
        max_tokens: 200,
      });

      const content = response.choices[0]?.message?.content || "{}";

      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const decision = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

      logger.info("🤖 Rebalance decision from Groq:", decision);

      return {
        should_rebalance: decision.should_rebalance || false,
        reason: decision.reason || "Unable to decide",
        priority: decision.priority || "medium",
      };
    } catch (error) {
      logger.error("Failed to get rebalance decision from Groq", error);
      // Fallback to simple logic if Groq fails
      return {
        should_rebalance: snapshot.needsRebalancing,
        reason: "Using default threshold-based decision",
        priority: "medium",
      };
    }
  }

  /**
   * Suggest optimal trade order
   */
  async suggestTradeOrder(
    snapshot: PortfolioSnapshot,
  ): Promise<Array<{ from: string; to: string; reason: string }>> {
    try {
      const overweight = snapshot.allocations
        .filter((a) => a.drift > 0)
        .sort((a, b) => b.drift - a.drift);

      const underweight = snapshot.allocations
        .filter((a) => a.drift < 0)
        .sort((a, b) => a.drift - b.drift);

      const prompt = `
You are a DeFi trading expert. Given this portfolio imbalance:

OVERWEIGHT (need to sell):
${overweight.map((a) => `- ${a.symbol}: ${a.drift.toFixed(1)}% over target`).join("\n")}

UNDERWEIGHT (need to buy):
${underweight.map((a) => `- ${a.symbol}: ${Math.abs(a.drift).toFixed(1)}% below target`).join("\n")}

Suggest the optimal order of trades to minimize slippage and gas costs.
Consider:
1. Sell largest overweights first (lower prices impact)
2. Buy underweights in order of importance
3. Minimize number of transactions

Respond ONLY with a JSON array:
[
  {"from": "SOL", "to": "USDC", "reason": "highest drift, large liquidity pair"},
  ...
]

Max 4 trades.
`;

      const response = await this.groq.chat.completions.create({
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.3,
        max_tokens: 400,
      });

      const content = response.choices[0]?.message?.content || "[]";
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      const trades = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

      logger.info("🎯 Trade order suggested by Groq:", trades);

      return trades;
    } catch (error) {
      logger.error("Failed to suggest trade order", error);
      return [];
    }
  }

  /**
   * Generate natural language portfolio report
   */
  async generatePortfolioReport(snapshot: PortfolioSnapshot): Promise<string> {
    try {
      const allocation = snapshot.allocations
        .map(
          (a) =>
            `${a.symbol}: ${a.percentage.toFixed(1)}% (target: ${a.targetPercentage}%)`,
        )
        .join(", ");

      const prompt = `
Generate a brief, friendly portfolio report for a crypto investor:

Total Portfolio Value: $${snapshot.totalUsdValue.toFixed(2)}

Current Allocation:
${allocation}

Status: ${snapshot.needsRebalancing ? "NEEDS REBALANCING" : "BALANCED"}

Write a 2-3 sentence summary that:
1. Compliments the portfolio (even if it needs rebalancing)
2. Explains the current status in simple terms
3. Suggests next action if needed

Keep it friendly and informative, like a chat with a DeFi advisor.
`;

      const response = await this.groq.chat.completions.create({
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.7, // More creative
        max_tokens: 300,
      });

      const report =
        response.choices[0]?.message?.content || "Portfolio report unavailable";

      logger.info("📝 Portfolio report generated by Groq");

      return report;
    } catch (error) {
      logger.error("Failed to generate portfolio report", error);
      return "Unable to generate report at this time.";
    }
  }

  /**
   * Risk assessment
   */
  async assessRisk(snapshot: PortfolioSnapshot): Promise<{
    risk_level: "low" | "medium" | "high";
    explanation: string;
    recommendations: string[];
  }> {
    try {
      const concentrated = snapshot.allocations
        .filter((a) => a.percentage > 50)
        .map((a) => `${a.symbol} (${a.percentage.toFixed(1)}%)`);

      const prompt = `
Perform a Comprehensive Risk Audit on the following digital asset structure:

ASSET DISTRIBUTION:
${snapshot.allocations
  .map(
    (a) =>
      `- ${a.symbol}: $${a.usdValue.toFixed(2)} [${a.percentage.toFixed(1)}% of total]`,
  )
  .join("\n")}

CONCENTRATION ALERT: ${concentrated.length > 0 ? `DETECTED IN ${concentrated.join(", ")}` : "DIVERSIFIED"}
LIQUIDITY TOTAL: $${snapshot.totalUsdValue.toFixed(2)}

AUDIT REQUIREMENTS:
1. CONCENTRATION INDEX: Score the risk of the current allocation distribution.
2. VOLATILITY RATING: Evaluate the beta coefficient risk based on SOL/JUP exposure.
3. LIQUIDITY DEPTH: Assess how quickly the current assets can be liquidated on the Solana network via Jupiter.

RESPONSE FORMAT (JSON ONLY):
{
  "risk_level": "low/medium/high",
  "explanation": "Quantitative risk justification",
  "recommendations": ["Tactical mitigation 1", "Tactical mitigation 2"]
}
`;

      const response = await this.groq.chat.completions.create({
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.3,
        max_tokens: 400,
      });

      const content = response.choices[0]?.message?.content || "{}";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const assessment = jsonMatch
        ? JSON.parse(jsonMatch[0])
        : { risk_level: "medium" };

      return {
        risk_level: assessment.risk_level || "medium",
        explanation: assessment.explanation || "Risk assessment unavailable",
        recommendations: assessment.recommendations || [],
      };
    } catch (error) {
      logger.error("Failed to assess risk", error);
      return {
        risk_level: "medium",
        explanation: "Risk assessment temporarily unavailable",
        recommendations: [],
      };
    }
  }
}

export const groqService = new GroqService();
