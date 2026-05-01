// Spot portfolio
const { Panel } = window.__prims;

function Spot() {
  const data = window.__data.spot;
  const total = data.reduce((a, h) => a + h.qty * h.mark, 0);

  return (
    <Panel
      title={<span>spot portfolio</span>}
      action={<span className="num tt-panel-stat tt-fg-1">${total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>}
    >
      <div className="tt-table">
        <div className="tt-row tt-thead tt-thead-spot">
          <div>asset</div>
          <div className="r">qty</div>
          <div className="r">mark</div>
          <div className="r">value</div>
          <div className="r">cost basis</div>
          <div className="r">pnl</div>
        </div>
        {data.map((h) => {
          const value = h.qty * h.mark;
          const pnl = (h.mark - h.cost) * h.qty;
          const pnlPct = h.cost ? ((h.mark - h.cost) / h.cost) * 100 : 0;
          return (
            <div key={h.sym} className="tt-row tt-row-spot">
              <div className="tt-sym">{h.sym}</div>
              <div className="r num tt-fg-2">{h.qty.toLocaleString("en-US", { maximumFractionDigits: 4 })}</div>
              <div className="r num tt-fg-2">{h.mark.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
              <div className="r num">${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <div className="r num tt-fg-3">{h.cost.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
              <div className={"r num " + (pnl >= 0 ? "tt-profit" : "tt-loss")}>
                {pnl >= 0 ? "+" : "−"}${Math.abs(pnl).toFixed(2)} <span className="tt-pct">{pnlPct >= 0 ? "+" : "−"}{Math.abs(pnlPct).toFixed(2)}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

window.Spot = Spot;
