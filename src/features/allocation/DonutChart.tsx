// Hand-rolled SVG donut — avoids a chart dependency. Each slice is two arc paths.
import { fmtUSD, fmtSigned, fmtNum } from '@/lib/format';

export type Slice = {
  asset: string;
  currentValue: number;
  pctOfBook: number;
  unrealizedPnl: number | null;
  color: string;
};

type Props = {
  slices: Slice[];
  selectedAsset: string | null;
  onSelect: (asset: string | null) => void;
  onHover: (asset: string | null) => void;
  hoveredAsset: string | null;
};

const CX = 100;
const CY = 100;
const OUTER_R = 90;
const INNER_R = 55;

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function buildArcPath(startDeg: number, endDeg: number, gap: number): string {
  const s = startDeg + gap;
  // SVG arc with identical start/end points renders nothing — cap full-circle sweeps
  const e = Math.min(endDeg - gap, s + 359.999);
  if (e <= s) return '';
  const o1 = polar(CX, CY, OUTER_R, s);
  const o2 = polar(CX, CY, OUTER_R, e);
  const i1 = polar(CX, CY, INNER_R, s);
  const i2 = polar(CX, CY, INNER_R, e);
  const large = e - s > 180 ? 1 : 0;
  return (
    `M ${o1.x} ${o1.y} A ${OUTER_R} ${OUTER_R} 0 ${large} 1 ${o2.x} ${o2.y} ` +
    `L ${i2.x} ${i2.y} A ${INNER_R} ${INNER_R} 0 ${large} 0 ${i1.x} ${i1.y} Z`
  );
}

const fmtAllocPct = (pct: number) => `${fmtNum(pct * 100, 1)}%`;

export function DonutChart({ slices, selectedAsset, onSelect, onHover, hoveredAsset }: Props) {
  const gap = slices.length > 1 ? 0.5 : 0;
  const activeAsset = hoveredAsset ?? selectedAsset;
  const activeSlice = activeAsset ? slices.find((s) => s.asset === activeAsset) ?? null : null;

  let cumulative = 0;
  const arcs = slices.map((slice) => {
    const sweep = slice.pctOfBook * 360;
    const start = cumulative;
    cumulative += sweep;
    return { slice, start, end: cumulative };
  });

  return (
    <div className="relative w-full max-w-[200px] mx-auto">
      <svg
        viewBox="0 0 200 200"
        className="w-full block cursor-pointer"
        onClick={(e) => {
          if (e.target === e.currentTarget) onSelect(null);
        }}
      >
        {arcs.map(({ slice, start, end }) => {
          const d = buildArcPath(start, end, gap);
          if (!d) return null;
          const fill = selectedAsset === slice.asset ? 'var(--accent)' : slice.color;
          const dimmed = !!(activeAsset && activeAsset !== slice.asset);
          return (
            <path
              key={slice.asset}
              d={d}
              fill={fill}
              opacity={dimmed ? 0.5 : 1}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(selectedAsset === slice.asset ? null : slice.asset);
              }}
              onMouseEnter={() => onHover(slice.asset)}
              onMouseLeave={() => onHover(null)}
            />
          );
        })}
      </svg>
      {activeSlice && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-bg-1 border border-border-1 rounded-sm px-2 py-1 text-center max-w-[90px]">
            <div className="font-sans font-semibold text-fg-1 text-[11px] leading-none mb-1">
              {activeSlice.asset}
            </div>
            <div className="font-mono text-fg-1 text-[10px] tabular-nums">
              {fmtUSD(activeSlice.currentValue)}
            </div>
            <div className="font-mono text-fg-2 text-[10px] tabular-nums">
              {fmtAllocPct(activeSlice.pctOfBook)}
            </div>
            {activeSlice.unrealizedPnl !== null && (
              <div
                className={`font-mono text-[10px] tabular-nums ${
                  activeSlice.unrealizedPnl >= 0 ? 'text-profit' : 'text-loss'
                }`}
              >
                {fmtSigned(activeSlice.unrealizedPnl, 0)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
