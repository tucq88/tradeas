ALTER TABLE spot_lots ADD COLUMN IF NOT EXISTS coingecko_id text NULL;
CREATE INDEX IF NOT EXISTS spot_lots_coingecko_id_idx ON spot_lots (coingecko_id);
