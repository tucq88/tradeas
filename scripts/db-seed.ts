import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local');
  process.exit(1);
}

const supabase = createClient(url, key);

async function seed() {
  const { error: lotsErr } = await supabase.from('spot_lots').insert([
    {
      asset: 'BTC',
      amount: 0.05,
      entry_price: 60000,
      cost_usd: 3000,
      date: '2024-01-15',
      status: 'wip',
    },
    {
      asset: 'ETH',
      amount: 1.0,
      entry_price: 3000,
      cost_usd: 3000,
      date: '2024-02-01',
      status: 'done',
      exit_price: 3500,
      exit_date: '2024-03-01',
    },
  ]);
  if (lotsErr) throw lotsErr;

  const { error: perpErr } = await supabase.from('perp_positions').insert([
    {
      symbol: 'BTCUSDT',
      direction: 'long',
      entry_price: 65000,
      leverage: 10,
      size_usdt: 1000,
      status: 'open',
    },
  ]);
  if (perpErr) throw perpErr;

  console.log('Seed complete: 2 spot_lots + 1 perp_position inserted.');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
