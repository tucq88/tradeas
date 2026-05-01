import { useSettings } from '@/state/settings';
import { Input } from '@/ui/Input';
import { Button } from '@/ui/Button';
import { InfoTooltip } from '@/ui/InfoTooltip';

type Props = {
  open: boolean;
  onClose: () => void;
};

export function SettingsDrawer({ open, onClose }: Props) {
  const [settings, update] = useSettings();

  if (!open) return null;

  function handleChange(field: keyof typeof settings, raw: string) {
    const val = parseFloat(raw);
    if (!Number.isNaN(val)) update({ [field]: val });
  }

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-80 bg-bg-1 border-l border-border-1 flex flex-col">
      <div className="flex items-center justify-between h-11 px-[18px] border-b border-border-1">
        <span className="font-sans font-medium text-[13px] text-fg-1 lowercase">settings</span>
        <Button onClick={onClose} className="h-7 px-2 text-xs">✕</Button>
      </div>
      <div className="flex flex-col gap-4 px-[18px] pt-4 pb-6 overflow-y-auto">
        <div className="flex flex-col gap-[6px]">
          <span className="label-caps">account balance</span>
          <Input
            defaultValue={String(settings.accountBalanceUsd)}
            key={`bal-${settings.accountBalanceUsd}`}
            suffix="USD"
            inputMode="decimal"
            onChange={(e) => handleChange('accountBalanceUsd', e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-[6px]">
          <span className="label-caps">risk %</span>
          <Input
            defaultValue={String(settings.riskPct)}
            key={`risk-${settings.riskPct}`}
            suffix="%"
            inputMode="decimal"
            onChange={(e) => handleChange('riskPct', e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-[6px]">
          <span className="label-caps flex items-center gap-1">
            MMR %
            <InfoTooltip text="Maintenance Margin Rate — minimum % of position value Binance requires before forced liquidation. 0.5% is the default tier-1 rate." />
          </span>
          <Input
            defaultValue={String(settings.mmrPct)}
            key={`mmr-${settings.mmrPct}`}
            suffix="%"
            inputMode="decimal"
            onChange={(e) => handleChange('mmrPct', e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-[6px]">
          <span className="label-caps">refresh interval</span>
          <Input
            defaultValue={String(settings.refreshSec)}
            key={`ref-${settings.refreshSec}`}
            suffix="sec"
            inputMode="decimal"
            onChange={(e) => handleChange('refreshSec', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
