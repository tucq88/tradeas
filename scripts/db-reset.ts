import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local');
  process.exit(1);
}

const supabase = createClient(url, key);

async function reset() {
  // Using delete-all instead of TRUNCATE — some Supabase setups restrict TRUNCATE
  const { error: lotsErr } = await supabase
    .from('spot_lots')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
  if (lotsErr) throw lotsErr;

  const { error: perpErr } = await supabase
    .from('perp_positions')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
  if (perpErr) throw perpErr;

  console.log('Reset complete: both tables cleared.');
}

reset().catch((err) => {
  console.error('Reset failed:', err);
  process.exit(1);
});
