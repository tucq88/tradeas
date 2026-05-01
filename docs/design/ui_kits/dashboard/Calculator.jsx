// Pre-trade calculator panel
const { Panel } = window.__prims;

function Calculator() {
  const modes = ["size", "risk", "r:r", "liq"];
  const [mode, setMode] = React.useState("size");
  const [side, setSide] = React.useState("long");
  const [entry, setEntry] = React.useState("64,210.00");
  const [stop, setStop] = React.useState("62,840.00");
  const [size, setSize] = React.useState("0.142");
  const [lev, setLev] = React.useState("5");

  // computed
  const notional = (parseFloat(size) * parseFloat(entry.replace(/,/g, ""))) || 0;
  const risk = (parseFloat(entry.replace(/,/g, "")) - parseFloat(stop.replace(/,/g, ""))) * (parseFloat(size) || 0);
  const liq = parseFloat(entry.replace(/,/g, "")) * (1 - 1 / parseFloat(lev));

  const Field = ({ label, value, set, suffix, computed, focus }) => (
    <div className="tt-field">
      <span className="tt-label">{label}</span>
      <div className={"tt-input " + (focus ? "is-focus" : "")}>
        <input value={value} onChange={(e) => set(e.target.value)} spellCheck={false} />
        <span className="tt-input-suffix">{suffix}</span>
      </div>
      {computed && <span className="tt-computed">{computed}</span>}
    </div>
  );

  return (
    <Panel
      title="pre-trade calculator"
      action={
        <div className="tt-seg">
          {modes.map((m) => (
            <button key={m} className={mode === m ? "is-active" : ""} onClick={() => setMode(m)}>{m}</button>
          ))}
        </div>
      }
    >
      <div className="tt-side-toggle">
        <button className={"tt-side-btn long " + (side === "long" ? "is-active" : "")} onClick={() => setSide("long")}>↑ long</button>
        <button className={"tt-side-btn short " + (side === "short" ? "is-active" : "")} onClick={() => setSide("short")}>↓ short</button>
      </div>
      <div className="tt-field-grid">
        <Field label="entry" value={entry} set={setEntry} suffix="USD" computed={<>≈ <strong>{(notional ? (notional / parseFloat(entry.replace(/,/g, ""))).toFixed(3) : "0.000")} BTC</strong></>} />
        <Field label="stop" value={stop} set={setStop} suffix="USD" focus computed={<>risk <strong>{Math.abs(risk).toFixed(2)} USD</strong></>} />
        <Field label="size" value={size} set={setSize} suffix="BTC" computed={<>notional <strong>${notional.toFixed(2)}</strong></>} />
        <Field label="leverage" value={lev} set={setLev} suffix="×" computed={<>liq <strong>{liq.toFixed(1)}</strong></>} />
      </div>
      <div className="tt-summary">
        <div className="tt-summary-grid">
          <div><span className="tt-label">margin</span><span className="num">${(notional / parseFloat(lev || 1)).toFixed(2)}</span></div>
          <div><span className="tt-label">notional</span><span className="num">${notional.toFixed(2)}</span></div>
          <div><span className="tt-label">fee est</span><span className="num">$5.47</span></div>
        </div>
        <div className="tt-summary-rr">
          <div className="tt-summary-rr-l">
            <span className="tt-label">risk : reward</span>
            <span className="tt-rr-val"><span className="num">1</span><span className="tt-rr-colon">:</span><span className="num">2.4</span></span>
            <span className="tt-rr-tag">acceptable</span>
          </div>
          <button className={"tt-btn-primary " + (side === "short" ? "is-short" : "")}>place {side}</button>
        </div>
      </div>
    </Panel>
  );
}

window.Calculator = Calculator;
