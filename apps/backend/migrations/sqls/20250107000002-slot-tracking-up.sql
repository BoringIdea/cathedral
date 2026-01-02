-- Create slot tracking table for monitoring blockchain progress
-- Migration: 20250107000002-slot-tracking

CREATE TABLE IF NOT EXISTS slot_tracking (
  id SERIAL PRIMARY KEY,
  program_id TEXT NOT NULL,
  last_processed_slot BIGINT NOT NULL DEFAULT 0,
  last_processed_signature TEXT,
  last_processed_timestamp TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_slot_tracking_program_id ON slot_tracking(program_id);
CREATE INDEX IF NOT EXISTS idx_slot_tracking_last_processed_slot ON slot_tracking(last_processed_slot);

-- Insert initial tracking record for cathedral program
INSERT INTO slot_tracking (program_id, last_processed_slot, is_active) 
VALUES ('cathedral', 0, TRUE)
ON CONFLICT (program_id) DO NOTHING;
