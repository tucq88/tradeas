export type SpotLot = {
  id: string;
  created_at: string;
  asset: string;
  amount: number;
  entry_price: number;
  cost_usd: number;
  date: string;
  status: 'wip' | 'done';
  exit_price: number | null;
  exit_date: string | null;
  coingecko_id: string | null;
};

export type SpotLotInput = Omit<SpotLot, 'id' | 'created_at' | 'coingecko_id'> & {
  coingecko_id?: string | null;
};
export type SpotLotPatch = Partial<Omit<SpotLot, 'id' | 'created_at'>>;

export type PerpPosition = {
  id: string;
  created_at: string;
  symbol: string;
  direction: 'long' | 'short';
  entry_price: number;
  leverage: number;
  size_usdt: number;
  status: 'open' | 'closed';
  closed_at: string | null;
  exit_price: number | null;
  mmr_override: number | null;
};

export type PerpPositionInput = Omit<PerpPosition, 'id' | 'created_at'>;
export type PerpPositionPatch = Partial<Omit<PerpPosition, 'id' | 'created_at'>>;
