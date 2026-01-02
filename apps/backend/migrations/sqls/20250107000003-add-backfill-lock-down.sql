-- Rollback: Remove backfill lock fields from slot_tracking table
-- Migration: 20250107000003-add-backfill-lock

DROP INDEX IF EXISTS idx_slot_tracking_is_backfilling;

ALTER TABLE slot_tracking 
DROP COLUMN IF EXISTS backfill_completed_at,
DROP COLUMN IF EXISTS backfill_started_at,
DROP COLUMN IF EXISTS is_backfilling;
