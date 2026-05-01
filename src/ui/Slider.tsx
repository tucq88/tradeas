import { useId } from 'react';

type SliderProps = {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  ticks?: number[];
  suffix?: string;
};

export function Slider({
  value,
  onChange,
  min = 1,
  max = 50,
  step = 1,
  ticks = [1, 5, 10, 25, 50],
  suffix = '×',
}: SliderProps) {
  const listId = useId();

  function handleRange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = Number(e.target.value);
    if (Number.isFinite(v)) onChange(v);
  }

  function handleBadge(e: React.ChangeEvent<HTMLInputElement>) {
    const v = Number(e.target.value);
    if (Number.isFinite(v) && v >= min && v <= max) onChange(v);
  }

  return (
    <div className="flex flex-col gap-[6px]">
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          list={listId}
          onChange={handleRange}
          className="flex-1 h-[3px] accent-accent cursor-pointer"
        />
        <datalist id={listId}>
          {ticks.map((t) => (
            <option key={t} value={t} />
          ))}
        </datalist>
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleBadge}
          className="w-[44px] text-center text-[12px] font-mono tabular-nums bg-bg-inset border border-border-1 rounded-sm text-fg-1 focus:outline-none focus:border-border-emph"
        />
        <span className="text-fg-3 text-[12px] font-mono">{suffix}</span>
      </div>
      <div className="flex justify-between px-[1px]">
        {ticks.map((t) => (
          <span key={t} className="text-[10px] text-fg-4 font-mono">{t}</span>
        ))}
      </div>
    </div>
  );
}
