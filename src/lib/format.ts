const MINUS = "−";

const fixed = (n: number, dp: number) =>
  n.toLocaleString("en-US", {
    minimumFractionDigits: dp,
    maximumFractionDigits: dp,
  });

export const fmtUSD = (n: number, dp = 2): string => {
  const sign = n < 0 ? MINUS : "";
  return sign + "$" + fixed(Math.abs(n), dp);
};

export const fmtNum = (n: number, dp = 2): string => {
  const sign = n < 0 ? MINUS : "";
  return sign + fixed(Math.abs(n), dp);
};

export const fmtPct = (n: number, dp = 2): string =>
  (n >= 0 ? "+" : MINUS) + Math.abs(n).toFixed(dp) + "%";

export const fmtSigned = (n: number, dp = 2): string =>
  (n >= 0 ? "+" : MINUS) + "$" + fixed(Math.abs(n), dp);

// Plain numeric string for form input values — no grouping, no currency symbol
export const numStr = (n: number, dp: number): string =>
  n.toLocaleString("en-US", {
    minimumFractionDigits: dp,
    maximumFractionDigits: dp,
    useGrouping: false,
  });

// Adaptive-precision price formatter — enough decimals to show 4 sig figs
// for sub-$1 values (e.g. 0.0261 → "$0.02610", 64210 → "$64,210.00").
export const fmtPrice = (n: number): string => {
  const abs = Math.abs(n);
  let dp = 2;
  if (abs > 0 && abs < 1) {
    const mag = Math.floor(Math.log10(abs)); // e.g. 0.0261 → -2
    dp = -mag + 3; // -(-2)+3 = 5 → "$0.02610"
  }
  return (n < 0 ? MINUS : "") + "$" + fixed(abs, dp);
};
