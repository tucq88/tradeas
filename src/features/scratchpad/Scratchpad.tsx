import { useState } from 'react';
import { Card } from '@/ui/Card';
import { Tabs } from '@/ui/Tabs';
import { Button } from '@/ui/Button';
import { useSettings } from '@/state/settings';
import { MODES, type ModeId } from './registry';

export function Scratchpad() {
  const [modeId, setModeId] = useState<ModeId>('classic');
  const [side, setSide] = useState<'long' | 'short'>('long');
  const [settings] = useSettings();

  const activeMode = MODES.find((m) => m.id === modeId)!;
  const { Component } = activeMode;
  const tabs = MODES.map((m) => ({ id: m.id, label: m.label }));

  return (
    <Card
      title="scratchpad"
      action={
        <Tabs
          tabs={tabs}
          active={modeId}
          onChange={(id) => setModeId(id as ModeId)}
        />
      }
    >
      <div className="flex gap-2">
        <Button
          className={`flex-1${side === 'long' ? ' bg-profit text-bg-0 border-transparent hover:bg-profit' : ''}`}
          onClick={() => setSide('long')}
        >
          ↑ long
        </Button>
        <Button
          className={`flex-1${side === 'short' ? ' bg-loss text-bg-0 border-transparent hover:bg-loss' : ''}`}
          onClick={() => setSide('short')}
        >
          ↓ short
        </Button>
      </div>
      <div className="flex gap-4 px-1">
        <span className="label-caps">
          balance <span className="font-mono text-fg-2 normal-case">${settings.accountBalanceUsd.toLocaleString()}</span>
        </span>
        <span className="label-caps">
          risk <span className="font-mono text-fg-2 normal-case">{settings.riskPct}%</span>
        </span>
      </div>
      <Component
        key={modeId}
        side={side}
        balance={settings.accountBalanceUsd}
        riskPct={settings.riskPct}
      />
    </Card>
  );
}
