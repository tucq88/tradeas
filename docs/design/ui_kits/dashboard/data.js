// shared mock data for the dashboard
window.__data = {
  portfolio: {
    total: 128402.17,
    delta24h: 1284.20,
    deltaPct: 1.01,
    realized7d: -214.88,
    unrealized: 842.10,
    unrealizedPct: 4.21,
  },
  positions: [
    { sym: "BTC", side: "long", lev: 5,  entry: 64210.0,  mark: 65418.5, size: 0.142, pnl:  842.10, pnlPct: +4.21, liqDist: 12.4 },
    { sym: "ETH", side: "short", lev: 3, entry: 3148.20, mark: 3212.04, size: 1.85,  pnl:  -96.40, pnlPct: -1.21, liqDist: 18.0 },
    { sym: "SOL", side: "long", lev: 10, entry: 142.80,  mark: 138.21, size: 22.4,  pnl: -214.20, pnlPct: -3.20, liqDist:  8.4 },
  ],
  spot: [
    { sym: "BTC", qty: 0.412, mark: 65418.5, cost: 58210.0 },
    { sym: "ETH", qty: 12.40, mark:  3212.0, cost:  2840.0 },
    { sym: "SOL", qty: 84.20, mark:   138.2, cost:   148.0 },
    { sym: "USDC", qty: 18420.00, mark: 1.0, cost: 1.0 },
  ],
};
