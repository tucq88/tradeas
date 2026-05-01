import type { FC } from 'react';
import { Classic } from './modes/Classic';
import { StopFirst } from './modes/StopFirst';
import { SizeFirst } from './modes/SizeFirst';

export type ScratchpadCtx = {
  side: 'long' | 'short';
  balance: number;
  riskPct: number;
};

export type ModeId = 'classic' | 'stopFirst' | 'sizeFirst';

export type Mode = {
  id: ModeId;
  label: string;
  Component: FC<ScratchpadCtx>;
};

export const MODES: Mode[] = [
  { id: 'classic', label: 'classic', Component: Classic },
  { id: 'stopFirst', label: 'stop-first', Component: StopFirst },
  { id: 'sizeFirst', label: 'size-first', Component: SizeFirst },
];
