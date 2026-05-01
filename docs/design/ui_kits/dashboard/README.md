# tu.tradeas — Overlord Dashboard

A pixel-fidelity recreation of the four-panel single-page dashboard.

## Files
- `index.html` — entry point, mounts the dashboard with click-thru interactivity.
- `Dashboard.jsx` — top-level layout: header + 2×2 panel grid.
- `Calculator.jsx` — pre-trade calculator with mode selector tabs.
- `Positions.jsx` — open perp positions table.
- `Spot.jsx` — spot portfolio holdings.
- `Allocation.jsx` — pie chart with legend.
- `data.js` — shared mock data.
- `primitives.jsx` — small shared bits: Badge, Delta, MetricCard, etc.

## Run
Open `index.html` directly. React, ReactDOM, and Babel load from CDN.
