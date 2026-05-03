import { useState, useRef, useEffect, useCallback } from 'react';
import type { CoinListEntry } from '@/data/coingecko/coinList';
import { TokenLogo } from './TokenLogo';

type Props = {
  coinList: Map<string, CoinListEntry> | undefined;
  heldIds: string[];
  onSelect: (entry: CoinListEntry) => void;
  placeholder?: string;
};

type Sections = { held: CoinListEntry[]; all: CoinListEntry[] };

function buildOptions(
  coinList: Map<string, CoinListEntry> | undefined,
  heldIds: string[],
  query: string,
): Sections {
  if (!coinList) return { held: [], all: [] };
  const q = query.toLowerCase();
  const heldSet = new Set(heldIds);
  const held: CoinListEntry[] = [];
  const all: CoinListEntry[] = [];

  for (const entry of coinList.values()) {
    if (q && !entry.symbol.toLowerCase().includes(q) && !entry.name.toLowerCase().includes(q))
      continue;
    if (heldSet.has(entry.id)) held.push(entry);
    else all.push(entry);
  }

  held.sort((a, b) => a.symbol.localeCompare(b.symbol));
  all.sort((a, b) => {
    if (a.mcap_rank !== undefined && b.mcap_rank !== undefined) return a.mcap_rank - b.mcap_rank;
    if (a.mcap_rank !== undefined) return -1;
    if (b.mcap_rank !== undefined) return 1;
    return a.symbol.localeCompare(b.symbol);
  });

  return { held, all: all.slice(0, 100) };
}

export function AssetPicker({ coinList, heldIds, onSelect, placeholder = 'Search asset…' }: Props) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const options = buildOptions(coinList, heldIds, query);
  const flat = [...options.held, ...options.all];

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setCursor(-1);
      }
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, []);

  const commit = useCallback(
    (entry: CoinListEntry) => {
      onSelect(entry);
      setQuery('');
      setOpen(false);
      setCursor(-1);
    },
    [onSelect],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) {
      if (e.key === 'ArrowDown') { setOpen(true); setCursor(0); e.preventDefault(); }
      return;
    }
    if (e.key === 'ArrowDown') {
      setCursor((c) => Math.min(c + 1, flat.length - 1));
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      setCursor((c) => Math.max(c - 1, 0));
      e.preventDefault();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (cursor >= 0 && cursor < flat.length) commit(flat[cursor]);
    } else if (e.key === 'Escape') {
      setOpen(false);
      setCursor(-1);
    }
  };

  const showDropdown = open && flat.length > 0;

  return (
    <div ref={containerRef} className="relative flex-1">
      <input
        ref={inputRef}
        type="text"
        className="w-full bg-bg-1 border border-border-1 rounded-sm px-2 py-1 text-[12px] text-fg-1 font-mono placeholder:text-fg-3 focus:outline-none focus:border-border-2"
        placeholder={placeholder}
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); setCursor(-1); }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
      />
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 max-h-[320px] overflow-y-auto bg-bg-1 border border-border-1 rounded-sm z-10">
          {options.held.length > 0 && (
            <>
              <div className="text-fg-3 text-[10px] uppercase tracking-wider px-2 py-1">
                Your assets
              </div>
              {options.held.map((entry, i) => (
                <PickerRow key={entry.id} entry={entry} active={i === cursor} onSelect={commit} />
              ))}
            </>
          )}
          {options.all.length > 0 && (
            <>
              <div className="text-fg-3 text-[10px] uppercase tracking-wider px-2 py-1">
                All coins
              </div>
              {options.all.map((entry, i) => (
                <PickerRow
                  key={entry.id}
                  entry={entry}
                  active={options.held.length + i === cursor}
                  onSelect={commit}
                />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function PickerRow({
  entry,
  active,
  onSelect,
}: {
  entry: CoinListEntry;
  active: boolean;
  onSelect: (e: CoinListEntry) => void;
}) {
  return (
    <div
      className={`flex items-center gap-2 px-2 py-1.5 cursor-pointer ${active ? 'bg-bg-2' : 'hover:bg-bg-2'}`}
      onPointerDown={(e) => { e.preventDefault(); onSelect(entry); }}
    >
      <TokenLogo symbol={entry.symbol} src={entry.image} />
      <span className="font-mono font-semibold text-fg-1 text-[11px]">
        {entry.symbol.toUpperCase()}
      </span>
      <span className="text-fg-3 text-[11px] truncate">{entry.name}</span>
      {entry.mcap_rank !== undefined && (
        <span className="text-fg-3 text-[10px] ml-auto shrink-0">#{entry.mcap_rank}</span>
      )}
    </div>
  );
}
