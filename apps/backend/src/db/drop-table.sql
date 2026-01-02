-- Drop all tables and functions
-- This script drops all tables in the correct order to avoid foreign key constraints

-- Drop event tables first (they don't have foreign key dependencies)
DROP TABLE IF EXISTS buy_tokens_event CASCADE;
DROP TABLE IF EXISTS sell_tokens_event CASCADE;
DROP TABLE IF EXISTS claim_fees_event CASCADE;
DROP TABLE IF EXISTS distribute_fee_event CASCADE;
DROP TABLE IF EXISTS pool_created_event CASCADE;

-- Drop main application tables in reverse order of dependencies
DROP TABLE IF EXISTS fee_claims CASCADE;
DROP TABLE IF EXISTS fee_recipients CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS pools CASCADE;
DROP TABLE IF EXISTS tokens CASCADE;
DROP TABLE IF EXISTS repositories CASCADE;
DROP TABLE IF EXISTS cathedral_users CASCADE;

-- Drop the trigger function
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Success message
SELECT 'All tables and functions dropped successfully!' as message;
