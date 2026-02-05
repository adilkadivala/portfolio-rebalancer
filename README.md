# DeFi Portfolio Rebalancer Agent

An autonomous agent that monitors and rebalances your Solana DeFi portfolio to maintain target allocations.

Built for [Colosseum Agent Hackathon](https://colosseum.com/agent-hackathon/)

## Problem Statement

Crypto traders need to continuously rebalance their portfolios (e.g., 40% SOL, 30% USDC, 20% JUP, 10% ALT), but manual rebalancing is:

- **Time-consuming** - Requires constant price monitoring
- **Emotionally-driven** - Subject to FOMO and panic selling
- **Inefficient** - Misses optimal rebalance windows

## Solution

An autonomous portfolio rebalancer that:

Monitors your Solana wallet in real-time  
 Checks portfolio drift from target allocation every hour  
 Suggests rebalancing trades when drift exceeds 5%  
 Executes swaps via Jupiter API with safety limits  
 Logs all trades for transparency and verification

## Architecture

```
┌─────────────────┐
│   Next.js UI    │ ← Portfolio dashboard
└────────┬────────┘
         │
┌────────▼────────┐
│  Node.js API    │ ← Express server
└────────┬────────┘
         │
    ┌────┴────┬──────────┬──────────┐
    │         │          │          │
┌───▼───┐ ┌──▼───┐ ┌────▼─────┐ ┌──▼──────┐
│Solana │ │Jupit-│ │Portfolio │ │Rebalan- │
│Service│ │er API│ │ Service  │ │cer Cron │
└───────┘ └──────┘ └──────────┘ └─────────┘
```

## Tech Stack

- **Backend**: Node.js + TypeScript + Express
- **Blockchain**: Solana Web3.js
- **Swap Engine**: Jupiter Aggregator API
- **Frontend**: Next.js + React + TailwindCSS
- **Database**: PostgreSQL/SQLite (trade history)
- **Wallet**: Solana Keypair (AgentWallet compatible)

## Installation

### Prerequisites

- Node.js 18+
- pbun/bun/yarn
- Solana CLI (optional)

### Setup

1. **Clone the repository**

   ```bash
   git clone <your-repo>
   cd pfreballance
   ```

2. **Install dependencies**

   ```bash
   # Backend
   cd server
   bun install

   # Frontend (if applicable)
   cd ../client
   bun install
   ```

3. **Configure environment variables**

   ```bash
   cd server
   cp .env.example .env
   ```

   Edit `.env`:

   ```env
   # Solana Configuration
   SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
   SOLANA_COMMITMENT=confirmed

   # Agent Wallet (Base58 private key)
   AGENT_PRIVATE_KEY=your_base58_private_key_here

   # Jupiter API
   JUPITER_API_URL=https://quote-api.jup.ag/v6

   # Portfolio Settings
   DRIFT_THRESHOLD=5
   REBALANCE_INTERVAL=3600000

   # Server
   PORT=3000
   NODE_ENV=development
   ```

4. **Generate a wallet (if needed)**
   ```bash
   solana-keygen new --outfile ~/.config/solana/agent-wallet.json
   # Convert to base58: use bs58 library or online tool
   ```

## Usage

### Start the Backend

```bash
cd server
bun run dev
```

The server will:

- Initialize Solana connection
- Load your wallet
- Start monitoring portfolio every hour
- Expose API at `http://localhost:3000`

### API Endpoints

#### Get Portfolio Status

```bash
GET /api/portfolio/status
```

**Response:**

```json
{
  "wallet": {
    "address": "YourWalletAddress...",
    "totalUsdValue": 10000,
    "tokens": [...]
  },
  "drifts": [
    {
      "symbol": "SOL",
      "current": 45.2,
      "target": 40,
      "drift": 5.2,
      "needsRebalance": true
    }
  ],
  "needsRebalance": true
}
```

#### Manual Rebalance Trigger

```bash
POST /api/portfolio/rebalance
```

### Configure Portfolio Targets

Edit `server/src/services/portfolio.service.ts`:

```typescript
private targets: PortfolioTarget[] = [
  { mint: '11111111111111111111111111111111', symbol: 'SOL', targetPercentage: 40 },
  { mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', symbol: 'USDC', targetPercentage: 30 },
  { mint: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', symbol: 'JUP', targetPercentage: 20 },
  { mint: 'your_token_mint', symbol: 'ALT', targetPercentage: 10 },
];
```

## Testing

### Test on Devnet First

1. **Switch to devnet**

   ```env
   SOLANA_RPC_URL=https://api.devnet.solana.com
   ```

2. **Get devnet SOL**

   ```bash
   solana airdrop 2 <your-wallet-address> --url devnet
   ```

3. **Test with small amounts**
   - Use devnet tokens
   - Set low drift threshold (e.g., 1%)
   - Monitor logs for rebalance triggers

### Run Tests

```bash
bun test
```

## Example Portfolio Flow

### Initial State

```
SOL:  60% ($6000) → Target: 40%
USDC: 20% ($2000) → Target: 30%
JUP:  15% ($1500) → Target: 20%
ALT:   5% ($500)  → Target: 10%
```

### Agent Action

```
1. Detected drift > 5% threshold
2. Suggested trades:
   - SELL 2000 USD worth of SOL
   - BUY 1000 USD worth of USDC
   - BUY 500 USD worth of JUP
   - BUY 500 USD worth of ALT
3. Executed swaps via Jupiter
4. Logged transactions on-chain
```

### Final State (Balanced)

```
SOL:  40% ($4000) → Target: 40%
USDC: 30% ($3000) → Target: 30%
JUP:  20% ($2000) → Target: 20%
ALT:  10% ($1000) → Target: 10%
```

## Safety Features

- **Drift Threshold**: Only rebalances when drift > 5%
- **Slippage Protection**: Max 0.5% slippage on swaps
- **Transaction Simulation**: Tests swaps before execution
- **Rate Limiting**: Maximum 1 rebalance per hour
- **Balance Checks**: Ensures sufficient funds before trading

## Demo Video

[Link to your demo video showing live rebalancing]

## Roadmap

### V1 (Current - Hackathon)

- [x] Portfolio monitoring
- [x] Drift calculation
- [x] Jupiter swap integration
- [ ] Basic dashboard UI
- [ ] Trade history logging

### V2 (Post-Hackathon)

- [ ] Multi-wallet support
- [ ] Advanced rebalancing strategies
- [ ] On-chain program for transparency
- [ ] Real-time price feeds (Pyth/Switchboard)
- [ ] Telegram/Discord notifications
- [ ] Backtesting engine

## Contributing

This is a hackathon project, but contributions are welcome!

```bash
# Fork the repo
git checkout -b feature/your-feature
git commit -m "Add feature"
git push origin feature/your-feature
# Open a PR
```

## License

MIT License - See [LICENSE](LICENSE) file

## Author

Built by [@k-adi](https://github.com/k-adi) for Colosseum Agent Hackathon 2026

## Acknowledgments

- [Colosseum](https://colosseum.com/) for hosting the hackathon
- [Jupiter](https://jup.ag/) for swap aggregation
- [Solana](https://solana.com/) for the blockchain infrastructure

---

** Disclaimer**: This is experimental software built during a hackathon. Use at your own risk. Always test on devnet first and start with small amounts.
