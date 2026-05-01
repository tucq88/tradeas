// Top-level dashboard
const { Panel, MetricCard, Delta } = window.__prims;

function Dashboard() {
  const p = window.__data.portfolio;
  return (
    <div className="tt-app">
      <header className="tt-topbar">
        <div className="tt-brand">
          <svg viewBox="0 0 32 32" width="22" height="22" aria-hidden>
            <circle cx="16" cy="16" r="3.2" fill="#5b9dff"/>
            <path d="M5 22 L11 16 L16 19 L22 12 L27 14" stroke="#2ecc71" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="tt-wm">tu<span className="tt-wm-dot">.</span>tradeas</span>
        </div>
        <nav className="tt-nav">
          <a className="is-active">overview</a>
          <a>history</a>
          <a>alerts</a>
          <a>settings</a>
        </nav>
        <div className="tt-topbar-right">
          <span className="tt-label">last sync</span>
          <span className="num tt-fg-2">12:48:04</span>
          <span className="tt-dot tt-dot-ok" title="connected"></span>
        </div>
      </header>

      <section className="tt-summary-row">
        <MetricCard
          label="portfolio · total"
          value={"$" + p.total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          delta={<Delta value={p.delta24h} pct={p.deltaPct} since="24h" />}
        />
        <MetricCard
          label="unrealized pnl"
          value={"+$" + p.unrealized.toFixed(2)}
          valueColor="var(--profit)"
          delta={<Delta value={p.unrealized} pct={p.unrealizedPct} since="on entry" />}
        />
        <MetricCard
          label="realized · 7d"
          value={"−$" + Math.abs(p.realized7d).toFixed(2)}
          valueColor="var(--loss)"
          delta={<span className="tt-delta tt-fg-3"><span className="num">12 trades</span> · <span className="num">w/l 7/5</span></span>}
        />
        <MetricCard
          label="margin used"
          value="$3,820.42"
          delta={<span className="tt-delta tt-fg-3"><span className="num">14.2%</span> of free</span>}
        />
      </section>

      <section className="tt-grid">
        <div className="tt-grid-cell tt-grid-calc"><Calculator /></div>
        <div className="tt-grid-cell tt-grid-pos"><Positions /></div>
        <div className="tt-grid-cell tt-grid-spot"><Spot /></div>
        <div className="tt-grid-cell tt-grid-alloc"><Allocation /></div>
      </section>
    </div>
  );
}

window.Dashboard = Dashboard;
