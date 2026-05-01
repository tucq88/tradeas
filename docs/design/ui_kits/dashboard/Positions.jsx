// Open perp positions
const { Panel, SideBadge } = window.__prims;

function Positions() {
  const [data, setData] = React.useState(window.__data.positions);
  const [hover, setHover] = React.useState(null);

  const close = (i) => setData((d) => d.filter((_, idx) => idx !== i));

  const totalPnl = data.reduce((a, p) => a + p.pnl, 0);

  return (
    <Panel
      title={<span>open positions <span className="tt-count">{data.length}</span></span>}
      action={<span className={"num tt-panel-stat " + (totalPnl >= 0 ? "tt-profit" : "tt-loss")}>
        {totalPnl >= 0 ? "+" : "−"}${Math.abs(totalPnl).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>}
    >
      <div className="tt-table">
        <div className="tt-row tt-thead">
          <div>symbol</div><div>side</div>
          <div className="r">entry</div><div className="r">mark</div>
          <div className="r">size</div><div className="r">pnl</div>
          <div className="r">liq dist</div><div></div>
        </div>
        {data.map((p, i) => (
          <div key={p.sym} className={"tt-row " + (hover === i ? "is-hover" : "")} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
            <div className="tt-sym">{p.sym}</div>
            <div><SideBadge side={p.side} lev={p.lev} /></div>
            <div className="r num">{p.entry.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
            <div className="r num">{p.mark.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
            <div className="r num tt-fg-2">{p.size}</div>
            <div className={"r num " + (p.pnl >= 0 ? "tt-profit" : "tt-loss")}>{p.pnl >= 0 ? "+" : "−"}${Math.abs(p.pnl).toFixed(2)} <span className="tt-pct">{p.pnlPct >= 0 ? "+" : "−"}{Math.abs(p.pnlPct).toFixed(2)}%</span></div>
            <div className={"r num " + (p.liqDist < 10 ? "tt-warn" : "tt-fg-2")}>{p.liqDist.toFixed(1)}%</div>
            <div className="r"><button className="tt-row-action" onClick={() => close(i)}>close</button></div>
          </div>
        ))}
        {data.length === 0 && <div className="tt-empty">no open positions</div>}
      </div>
    </Panel>
  );
}

window.Positions = Positions;
