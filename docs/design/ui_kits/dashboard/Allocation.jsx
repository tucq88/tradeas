// Allocation — horizontal stacked bar (replaces pie)
const { Panel } = window.__prims;

function Allocation() {
  const data = window.__data.spot.map((h) => ({ sym: h.sym, value: h.qty * h.mark }));
  const total = data.reduce((a, d) => a + d.value, 0);
  const slices = data
    .map((d) => ({ ...d, pct: (d.value / total) * 100 }))
    .sort((a, b) => b.value - a.value);

  const colors = {
    BTC: "#a8b0bd",
    ETH: "#5b9dff",
    SOL: "#f5a524",
    USDC: "#2ecc71",
  };

  const [hover, setHover] = React.useState(null);

  return (
    <Panel title="allocation">
      <div className="tt-alloc2">
        <div className="tt-alloc2-head">
          <span className="tt-alloc2-total num">${(total / 1000).toFixed(1)}k</span>
          <span className="tt-alloc2-totlab">across {slices.length} assets</span>
        </div>
        <div
          className="tt-alloc2-bar"
          onMouseLeave={() => setHover(null)}
        >
          {slices.map((s, i) => (
            <span
              key={s.sym}
              className="tt-alloc2-seg"
              style={{
                background: colors[s.sym] || "#666",
                width: `${s.pct}%`,
                opacity: hover == null || hover === i ? 1 : 0.35,
              }}
              onMouseEnter={() => setHover(i)}
              title={`${s.sym} · ${s.pct.toFixed(1)}%`}
            ></span>
          ))}
        </div>
        <ul className="tt-alloc2-legend">
          {slices.map((s, i) => (
            <li
              key={s.sym}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              className={hover === i ? "is-hover" : ""}
            >
              <span className="tt-alloc2-dot" style={{ background: colors[s.sym] }}></span>
              <span className="tt-alloc2-name">{s.sym}</span>
              <span className="num tt-alloc2-pct">{s.pct.toFixed(1)}%</span>
              <span className="num tt-alloc2-val">${(s.value / 1000).toFixed(1)}k</span>
            </li>
          ))}
        </ul>
      </div>
    </Panel>
  );
}

window.Allocation = Allocation;
