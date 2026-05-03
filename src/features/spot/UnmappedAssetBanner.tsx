import { useQueryClient } from '@tanstack/react-query';
import { spotLots } from '@/data/spotLots';
import type { SpotLot } from '@/data/types';
import type { CoinListEntry } from '@/data/coingecko/coinList';
import { AssetPicker } from '@/ui/AssetPicker';

type Props = {
  lots: SpotLot[];
  coinList: Map<string, CoinListEntry> | undefined;
  heldIds: string[];
};

export function UnmappedAssetBanner({ lots, coinList, heldIds }: Props) {
  const qc = useQueryClient();

  if (lots.length === 0) return null;

  const handleSelect = (lot: SpotLot, entry: CoinListEntry) => {
    void spotLots.update(lot.id, { coingecko_id: entry.id }).then(() => {
      void qc.invalidateQueries({ queryKey: ['spot-lots'] });
    });
  };

  return (
    <div className="flex flex-col gap-2 rounded-sm border border-border-1 bg-bg-2 px-3 py-2 text-[12px]">
      <p className="text-fg-3 text-[11px]">
        {lots.length} asset{lots.length !== 1 ? 's' : ''} need
        {lots.length === 1 ? 's' : ''} mapping
      </p>
      {lots.map((lot) => (
        <div key={lot.id} className="flex items-center gap-2">
          <span className="font-mono font-semibold text-fg-1 w-14 shrink-0">{lot.asset}</span>
          <AssetPicker
            coinList={coinList}
            heldIds={heldIds}
            onSelect={(entry) => handleSelect(lot, entry)}
          />
        </div>
      ))}
    </div>
  );
}
