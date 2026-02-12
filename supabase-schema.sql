-- Run this SQL in your Supabase SQL Editor to create the required tables.

-- Stores player sign-ups per time slot
create table if not exists slot_signups (
  id uuid default gen_random_uuid() primary key,
  slot_key text not null,        -- format: "2025-03-15_09:00"
  player_name text not null,
  created_at timestamptz default now(),
  unique(slot_key, player_name)
);

-- Stores comments per time slot
create table if not exists slot_comments (
  id uuid default gen_random_uuid() primary key,
  slot_key text not null unique,  -- format: "2025-03-15_09:00"
  comment text not null default '',
  updated_at timestamptz default now()
);

-- Stores finalized slots
create table if not exists slot_finalized (
  id uuid default gen_random_uuid() primary key,
  slot_key text not null unique,
  finalized_by text not null,
  finalized_at timestamptz default now()
);

-- Enable realtime for all tables
alter publication supabase_realtime add table slot_signups;
alter publication supabase_realtime add table slot_comments;
alter publication supabase_realtime add table slot_finalized;

-- Row Level Security (allow all for simplicity - no auth)
alter table slot_signups enable row level security;
alter table slot_comments enable row level security;
alter table slot_finalized enable row level security;

create policy "Allow all on slot_signups" on slot_signups for all using (true) with check (true);
create policy "Allow all on slot_comments" on slot_comments for all using (true) with check (true);
create policy "Allow all on slot_finalized" on slot_finalized for all using (true) with check (true);
