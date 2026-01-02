-- Create trigger function to automatically update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Create users table
CREATE TABLE IF NOT EXISTS cathedral_users (
  id SERIAL PRIMARY KEY,
  wallet TEXT,
  github_id TEXT,
  github_login TEXT UNIQUE,
  jwt_token TEXT,
  github_repositories_count INTEGER,
  github_stars INTEGER,
  github_followers INTEGER,
  github_name TEXT,
  avatar_url TEXT,
  github_access_token TEXT,
  github_refresh_token TEXT,
  github_access_token_expires_at DATE,
  github_refresh_token_expires_at DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_cathedral_users_updated_at
BEFORE UPDATE ON cathedral_users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create index for github_login
CREATE INDEX idx_cathedral_users_github_login ON cathedral_users(github_login);

-- Create repositories table
CREATE TABLE IF NOT EXISTS repositories (
  id SERIAL PRIMARY KEY,
  link TEXT,
  name TEXT,
  stars TEXT,
  forks TEXT,
  owner TEXT REFERENCES cathedral_users(github_login),
  description TEXT,
  is_fork BOOLEAN DEFAULT FALSE,
  forks_url TEXT,
  contributors INTEGER DEFAULT 1,
  is_deployed BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_repositories_updated_at
BEFORE UPDATE ON repositories
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- If you haven't created the trigger function to update the updated_at column, please create it first
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Create tokens table
CREATE TABLE IF NOT EXISTS tokens (
  id SERIAL PRIMARY KEY,
  creator TEXT,
  name TEXT,
  ticker TEXT,
  img_url TEXT,
  repository_id INTEGER REFERENCES repositories(id),
  mint TEXT,
  decimals INTEGER,
  ata TEXT,
  meta TEXT,
  github_user TEXT,
  repository_name TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create trigger, automatically update updated_at column on each row update
CREATE TRIGGER update_tokens_updated_at
BEFORE UPDATE ON tokens
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better query performance (optional, choose appropriate columns based on your query pattern)
CREATE INDEX idx_tokens_creator ON tokens(creator);
CREATE INDEX idx_tokens_repository_id ON tokens(repository_id);
CREATE INDEX idx_tokens_mint ON tokens(mint);
CREATE INDEX idx_tokens_github_user ON tokens(github_user);

-- Create pools table
CREATE TABLE IF NOT EXISTS pools (
  id SERIAL PRIMARY KEY,
  token_id INTEGER REFERENCES tokens(id),
  pool TEXT UNIQUE,
  creator TEXT,
  token_mint TEXT,
  pool_sol_vault TEXT,
  pool_sol_fee_vault TEXT,
  pool_token_account TEXT,
  supply BIGINT,
  sol_reserve BIGINT,
  total_fee_share_percentage INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_pools_updated_at
BEFORE UPDATE ON pools
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_pools_token_id ON pools(token_id);
CREATE INDEX idx_pools_pool ON pools(pool);

-- Create fee_recipients table
CREATE TABLE IF NOT EXISTS fee_recipients (
  id SERIAL PRIMARY KEY,
  pool_id INTEGER REFERENCES pools(id),
  recipient_type TEXT,
  recipient TEXT,
  share_percentage INTEGER,
  total_fee BIGINT,
  unclaimed_fee BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_fee_recipients_updated_at
BEFORE UPDATE ON fee_recipients
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_fee_recipients_pool_id ON fee_recipients(pool_id);

-- Create fee_claims table
CREATE TABLE IF NOT EXISTS fee_claims (
  id SERIAL PRIMARY KEY,
  fee_recipient_id INTEGER REFERENCES fee_recipients(id),
  amount BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_fee_claims_updated_at
BEFORE UPDATE ON fee_claims
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_fee_claims_fee_recipient_id ON fee_claims(fee_recipient_id);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  pool TEXT REFERENCES pools(pool),
  "user" TEXT,
  side TEXT,
  amount BIGINT,
  price BIGINT,
  unique_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_orders_unique_id ON orders(unique_id);

ALTER TABLE orders ALTER COLUMN unique_id SET NOT NULL;

CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create event tables for storing raw blockchain events

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

CREATE INDEX idx_pool_created_event_pool ON pool_created_event(pool);
CREATE INDEX idx_pool_created_event_creator ON pool_created_event(creator);
CREATE INDEX idx_pool_created_event_token_mint ON pool_created_event(token_mint);
CREATE INDEX idx_pool_created_event_slot ON pool_created_event(slot);
CREATE INDEX idx_pool_created_event_signature ON pool_created_event(signature);
CREATE UNIQUE INDEX idx_pool_created_event_unique ON pool_created_event(signature, slot);

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

CREATE INDEX idx_distribute_fee_event_pool ON distribute_fee_event(pool);
CREATE INDEX idx_distribute_fee_event_recipient ON distribute_fee_event(recipient);
CREATE INDEX idx_distribute_fee_event_slot ON distribute_fee_event(slot);
CREATE INDEX idx_distribute_fee_event_signature ON distribute_fee_event(signature);
CREATE UNIQUE INDEX idx_distribute_fee_event_unique ON distribute_fee_event(signature, slot, recipient);

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

CREATE INDEX idx_claim_fees_event_pool ON claim_fees_event(pool);
CREATE INDEX idx_claim_fees_event_fee_recipient ON claim_fees_event(fee_recipient);
CREATE INDEX idx_claim_fees_event_slot ON claim_fees_event(slot);
CREATE INDEX idx_claim_fees_event_signature ON claim_fees_event(signature);
CREATE UNIQUE INDEX idx_claim_fees_event_unique ON claim_fees_event(signature, slot, fee_recipient);

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

CREATE INDEX idx_sell_tokens_event_pool ON sell_tokens_event(pool);
CREATE INDEX idx_sell_tokens_event_user ON sell_tokens_event("user");
CREATE INDEX idx_sell_tokens_event_slot ON sell_tokens_event(slot);
CREATE INDEX idx_sell_tokens_event_signature ON sell_tokens_event(signature);
CREATE UNIQUE INDEX idx_sell_tokens_event_unique_id ON sell_tokens_event(unique_id);

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

CREATE INDEX idx_buy_tokens_event_pool ON buy_tokens_event(pool);
CREATE INDEX idx_buy_tokens_event_user ON buy_tokens_event("user");
CREATE INDEX idx_buy_tokens_event_slot ON buy_tokens_event(slot);
CREATE INDEX idx_buy_tokens_event_signature ON buy_tokens_event(signature);
CREATE UNIQUE INDEX idx_buy_tokens_event_unique_id ON buy_tokens_event(unique_id);

-- Create slot tracking table for monitoring blockchain progress
CREATE TABLE IF NOT EXISTS slot_tracking (
  id SERIAL PRIMARY KEY,
  program_id TEXT NOT NULL,
  last_processed_slot BIGINT NOT NULL DEFAULT 0,
  last_processed_signature TEXT,
  last_processed_timestamp TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  is_backfilling BOOLEAN DEFAULT FALSE,
  backfill_started_at TIMESTAMP WITH TIME ZONE,
  backfill_completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_slot_tracking_program_id ON slot_tracking(program_id);
CREATE INDEX IF NOT EXISTS idx_slot_tracking_last_processed_slot ON slot_tracking(last_processed_slot);
CREATE INDEX IF NOT EXISTS idx_slot_tracking_is_backfilling ON slot_tracking(is_backfilling);

-- Insert initial tracking record for cathedral program
INSERT INTO slot_tracking (program_id, last_processed_slot, is_active) 
VALUES ('cathedral', 0, TRUE)
ON CONFLICT (program_id) DO NOTHING;