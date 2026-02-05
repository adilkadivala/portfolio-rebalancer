const API_URL = typeof window !== 'undefined' 
  ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000')
  : 'http://localhost:5000';

export const api = {
  async health() {
    const res = await fetch(`${API_URL}/health`);
    if (!res.ok) throw new Error('Health check failed');
    return res.json();
  },

  async getWallet() {
    const res = await fetch(`${API_URL}/api/wallet`);
    if (!res.ok) throw new Error('Failed to fetch wallet');
    return res.json();
  },

  async getPortfolioSnapshot() {
    const res = await fetch(`${API_URL}/api/portfolio/snapshot`);
    if (!res.ok) throw new Error('Failed to fetch portfolio');
    return res.json();
  },

  async getPortfolioTargets() {
    const res = await fetch(`${API_URL}/api/portfolio/targets`);
    if (!res.ok) throw new Error('Failed to fetch targets');
    return res.json();
  },

  async setPortfolioTargets(targets: any[]) {
    const res = await fetch(`${API_URL}/api/portfolio/targets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targets }),
    });
    if (!res.ok) throw new Error('Failed to update targets');
    return res.json();
  },

  async simulateSwap(inputMint: string, outputMint: string, amount: number) {
    const res = await fetch(`${API_URL}/api/swap/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inputMint, outputMint, amount }),
    });
    if (!res.ok) throw new Error('Failed to simulate swap');
    return res.json();
  },

  async getSwapQuote(inputMint: string, outputMint: string, amount: number) {
    const params = new URLSearchParams({
      inputMint,
      outputMint,
      amount: amount.toString(),
    });
    const res = await fetch(`${API_URL}/api/swap/quote?${params}`);
    if (!res.ok) throw new Error('Failed to fetch quote');
    return res.json();
  },
};