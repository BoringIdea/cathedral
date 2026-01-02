-- Add backfill lock fields to slot_tracking table
-- Migration: 20250107000003-add-backfill-lock

ALTER TABLE slot_tracking 
ADD COLUMN IF NOT EXISTS is_backfilling BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS backfill_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS backfill_completed_at TIMESTAMP WITH TIME ZONE;

-- Create index for backfill lock queries
CREATE INDEX IF NOT EXISTS idx_slot_tracking_is_backfilling ON slot_tracking(is_backfilling);

-- Reset any stuck backfill locks (in case of previous crashes)
UPDATE slot_tracking 
SET is_backfilling = FALSE 
WHERE is_backfilling = TRUE;
