// shared primitives for the dashboard
const fmtUSD = (n, dp = 2) => {
  const sign = n < 0 ? "−" : "";
  const v = Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: dp, maximumFractionDigits: dp });
  return sign + "$" + v;
};
const fmtNum = (n, dp = 2) => {
  const sign = n < 0 ? "−" : "";
  return sign + Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: dp, maximumFractionDigits: dp });
};
const fmtPct = (n, dp = 2) => (n >= 0 ? "+" : "−") + Math.abs(n).toFixed(dp) + "%";
const fmtSigned = (n, dp = 2) => (n >= 0 ? "+" : "−") + "$" + Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: dp, maximumFractionDigits: dp });

function Panel({ title, action, children, className = "" }) {
  return (
    <section className={"tt-panel " + className}>
      <header className="tt-panel-head">
        <h3>{title}</h3>
        {action}
      </header>
      <div className="tt-panel-body">{children}</div>
    </section>
  );
}

function Badge({ kind, children }) {
  return <span className={"tt-badge tt-badge-" + kind}>{children}</span>;
}

function SideBadge({ side, lev }) {
  const arrow = side === "long" ? "↑" : "↓";
  return (
    <span className={"tt-badge tt-badge-" + (side === "long" ? "long" : "short")}>
      <span className="tt-arr">{arrow}</span> {side} {lev}×
    </span>
  );
}

function Delta({ value, pct, since }) {
  const positive = value >= 0;
  const cls = positive ? "tt-profit" : "tt-loss";
  return (
    <span className={"tt-delta " + cls}>
      <span className="tt-arr">{positive ? "↑" : "↓"}</span>
      <span className="num">{fmtSigned(value)}</span>
      <span className="num">{fmtPct(pct)}</span>
      {since && <span className="tt-since">{since}</span>}
    </span>
  );
}

function MetricCard({ label, value, valueColor, delta }) {
  return (
    <div className="tt-metric">
      <span className="tt-label">{label}</span>
      <span className="num tt-metric-num" style={{ color: valueColor || "var(--fg-1)" }}>{value}</span>
      {delta}
    </div>
  );
}

window.__prims = { fmtUSD, fmtNum, fmtPct, fmtSigned, Panel, Badge, SideBadge, Delta, MetricCard };
