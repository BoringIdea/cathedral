# Cathedral DB Migrations

This directory contains database migration scripts for the Cathedral backend.

## Structure

```
migrations/
├── 20250107000001-event-tables.js    # Migration script
└── sqls/
    ├── 20250107000001-event-tables-up.sql   # Create tables
    └── 20250107000001-event-tables-down.sql # Drop tables
```

## Available Commands

### Install Dependencies
```bash
npm install
```

### Create a New Migration
```bash
npm run migrate:create --name=your-migration-name
```

### Run Migrations
```bash
# Run all pending migrations
npm run migrate:up

# Run specific number of migrations
npx db-migrate up -c 1
```

### Rollback Migrations
```bash
# Rollback last migration
npm run migrate:down

# Rollback specific number of migrations
npx db-migrate down -c 2
```

### Reset Database
```bash
# Rollback all migrations and run them again
npm run migrate:reset
```

### Check Migration Status
```bash
npm run migrate:status
```

### Manual Database Operations
```bash
# Drop all tables (including event tables)
npm run db:drop-all

# Create all tables (including event tables)
npm run db:create-all
```

## Environment Configuration

The migrations use the `database.json` file for configuration. Make sure to set the following environment variables for production:

- `DB_HOST`: Database host
- `DB_PORT`: Database port
- `DB_NAME`: Database name
- `DB_USER`: Database username
- `DB_PASSWORD`: Database password

## Event Tables

The current migration creates the following event tables for storing raw blockchain events:

1. **pool_created_event** - Stores pool creation events
2. **distribute_fee_event** - Stores fee distribution events
3. **claim_fees_event** - Stores fee claim events
4. **sell_tokens_event** - Stores token sell events
5. **buy_tokens_event** - Stores token buy events

Each table includes:
- Event-specific fields
- `slot` and `signature` for blockchain tracking
- `raw_event_data` JSONB field for complete event data
- `created_at` timestamp
- Appropriate indexes for performance

## Usage Examples

### Using Migrations (Recommended)
```bash
# Create event tables using migration
npm run migrate:up

# Rollback event tables
npm run migrate:down

# Check what migrations have run
npm run migrate:status

# Create a new migration for additional tables
npm run migrate:create --name=add-new-feature
```

### Manual Database Operations (Alternative)
```bash
# Drop all tables (including event tables)
npm run db:drop-all

# Create all tables (including event tables)
npm run db:create-all
```

### Creating New Migrations
When you run:
```bash
npm run migrate:create --name=add-new-feature
```

This will create:
- `migrations/YYYYMMDDHHMMSS-add-new-feature.js`
- `migrations/sqls/YYYYMMDDHHMMSS-add-new-feature-up.sql`
- `migrations/sqls/YYYYMMDDHHMMSS-add-new-feature-down.sql`
