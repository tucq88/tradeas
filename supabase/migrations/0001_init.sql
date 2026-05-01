create extension if not exists pgcrypto;

create table if not exists spot_lots (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  asset text not null,
  amount numeric not null,
  entry_price numeric not null,
  cost_usd numeric not null,
  date date not null,
  status text not null check (status in ('wip', 'done')),
  exit_price numeric null,
  exit_date date null
);

create table if not exists perp_positions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  symbol text not null,
  direction text not null check (direction in ('long', 'short')),
  entry_price numeric not null,
  leverage numeric not null,
  size_usdt numeric not null,
  status text not null check (status in ('open', 'closed')),
  closed_at timestamptz null,
  exit_price numeric null
);
