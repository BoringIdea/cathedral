-- Drop event tables for storing raw blockchain events
-- This script drops only the event tables, not the main application tables

-- Drop event tables in reverse order of dependencies
DROP TABLE IF EXISTS buy_tokens_event CASCADE;
DROP TABLE IF EXISTS sell_tokens_event CASCADE;
DROP TABLE IF EXISTS claim_fees_event CASCADE;
DROP TABLE IF EXISTS distribute_fee_event CASCADE;
DROP TABLE IF EXISTS pool_created_event CASCADE;

-- Success message
SELECT 'Event tables dropped successfully!' as message;
