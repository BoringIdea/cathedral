-- Create event tables for storing raw blockchain events
-- This script creates only the event tables, not the main application tables

-- Create pool_created_event table
CREATE TABLE IF NOT EXISTS pool_created_event (
  id SERIAL PRIMARY KEY,
  pool TEXT,
  creator TEXT,
  token_mint TEXT,
  pool_sol_vault TEXT,
  pool_sol_fee_vault TEXT,
  pool_token_account TEXT,
  slot BIGINT,
  signature TEXT,
  raw_event_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pool_created_event_pool ON pool_created_event(pool);
CREATE INDEX IF NOT EXISTS idx_pool_created_event_creator ON pool_created_event(creator);
CREATE INDEX IF NOT EXISTS idx_pool_created_event_token_mint ON pool_created_event(token_mint);
CREATE INDEX IF NOT EXISTS idx_pool_created_event_slot ON pool_created_event(slot);
CREATE INDEX IF NOT EXISTS idx_pool_created_event_signature ON pool_created_event(signature);
CREATE UNIQUE INDEX IF NOT EXISTS idx_pool_created_event_unique ON pool_created_event(signature, slot);

-- Create distribute_fee_event table
CREATE TABLE IF NOT EXISTS distribute_fee_event (
  id SERIAL PRIMARY KEY,
  pool TEXT,
  fee_share_percentage INTEGER,
  recipient TEXT,
  recipient_type TEXT,
  slot BIGINT,
  signature TEXT,
  raw_event_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_distribute_fee_event_pool ON distribute_fee_event(pool);
CREATE INDEX IF NOT EXISTS idx_distribute_fee_event_recipient ON distribute_fee_event(recipient);
CREATE INDEX IF NOT EXISTS idx_distribute_fee_event_slot ON distribute_fee_event(slot);
CREATE INDEX IF NOT EXISTS idx_distribute_fee_event_signature ON distribute_fee_event(signature);
CREATE UNIQUE INDEX IF NOT EXISTS idx_distribute_fee_event_unique ON distribute_fee_event(signature, slot, recipient);

-- Create claim_fees_event table
CREATE TABLE IF NOT EXISTS claim_fees_event (
  id SERIAL PRIMARY KEY,
  pool TEXT,
  fee_recipient TEXT,
  claim_amount BIGINT,
  slot BIGINT,
  signature TEXT,
  raw_event_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_claim_fees_event_pool ON claim_fees_event(pool);
CREATE INDEX IF NOT EXISTS idx_claim_fees_event_fee_recipient ON claim_fees_event(fee_recipient);
CREATE INDEX IF NOT EXISTS idx_claim_fees_event_slot ON claim_fees_event(slot);
CREATE INDEX IF NOT EXISTS idx_claim_fees_event_signature ON claim_fees_event(signature);
CREATE UNIQUE INDEX IF NOT EXISTS idx_claim_fees_event_unique ON claim_fees_event(signature, slot, fee_recipient);

-- Create sell_tokens_event table
CREATE TABLE IF NOT EXISTS sell_tokens_event (
  id SERIAL PRIMARY KEY,
  pool TEXT,
  "user" TEXT,
  amount_tokens BIGINT,
  price BIGINT,
  slot BIGINT,
  signature TEXT,
  unique_id TEXT,
  raw_event_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sell_tokens_event_pool ON sell_tokens_event(pool);
CREATE INDEX IF NOT EXISTS idx_sell_tokens_event_user ON sell_tokens_event("user");
CREATE INDEX IF NOT EXISTS idx_sell_tokens_event_slot ON sell_tokens_event(slot);
CREATE INDEX IF NOT EXISTS idx_sell_tokens_event_signature ON sell_tokens_event(signature);
CREATE UNIQUE INDEX IF NOT EXISTS idx_sell_tokens_event_unique_id ON sell_tokens_event(unique_id);

-- Create buy_tokens_event table
CREATE TABLE IF NOT EXISTS buy_tokens_event (
  id SERIAL PRIMARY KEY,
  pool TEXT,
  "user" TEXT,
  amount_tokens BIGINT,
  price BIGINT,
  slot BIGINT,
  signature TEXT,
  unique_id TEXT,
  raw_event_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_buy_tokens_event_pool ON buy_tokens_event(pool);
CREATE INDEX IF NOT EXISTS idx_buy_tokens_event_user ON buy_tokens_event("user");
CREATE INDEX IF NOT EXISTS idx_buy_tokens_event_slot ON buy_tokens_event(slot);
CREATE INDEX IF NOT EXISTS idx_buy_tokens_event_signature ON buy_tokens_event(signature);
CREATE UNIQUE INDEX IF NOT EXISTS idx_buy_tokens_event_unique_id ON buy_tokens_event(unique_id);

-- Success message
SELECT 'Event tables created successfully!' as message;
