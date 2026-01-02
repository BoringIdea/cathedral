import {
  pgTable,
  serial,
  text,
  integer,
  date,
  bigint,
  boolean,
  timestamp,
  jsonb,
} from 'drizzle-orm/pg-core';

export const users = pgTable('cathedral_users', {
  id: serial('id').primaryKey(),
  wallet: text('wallet'), // solana wallet address
  githubId: text('github_id'),
  githubLogin: text('github_login'),
  jwtToken: text('jwt_token'),
  githubRepositoriesCount: integer('github_repositories_count'),
  githubStars: integer('github_stars'),
  githubFollowers: integer('github_followers'),
  githubName: text('github_name'),
  avatarUrl: text('avatar_url'), // github avatar url
  githubAccessToken: text('github_access_token'),
  githubRefreshToken: text('github_refresh_token'),
  githubAccessTokenExpiresAt: date('github_access_token_expires_at'),
  githubRefreshTokenExpiresAt: date('github_refresh_token_expires_at'),
  createdAt: date('created_at'),
  updatedAt: date('updated_at'),
});

export const repositories = pgTable('repositories', {
  id: serial('id').primaryKey(),
  link: text('link'),
  name: text('name'),
  stars: text('stars'),
  forks: text('forks'),
  owner: text('owner').references(() => users.githubLogin), // link to the user table's githubLogin field
  description: text('description'),
  isFork: boolean('is_fork'), // is this repository a fork
  forksUrl: text('forks_url'), // forks url of the repository
  contributors: integer('contributors'), // number of contributors
  isDeployed: boolean('is_deployed'),
  isDeleted: boolean('is_deleted'), // is deleted by user
  createdAt: date('created_at'),
  updatedAt: date('updated_at'),
});

export const tokens = pgTable('tokens', {
  id: serial('id').primaryKey(),
  creator: text('creator'), // creator wallet address
  name: text('name'),
  ticker: text('ticker'),
  imgUrl: text('img_url'),
  repositoryId: integer('repository_id').references(() => repositories.id), // link to the repository table's id field
  mint: text('mint'), // mint address
  decimals: integer('decimals'),
  ata: text('ata'), // associated token address
  meta: text('meta'), // token metadata address
  githubUser: text('github_user'),
  repositoryName: text('repository_name'),
  description: text('description'),
  createdAt: date('created_at'),
  updatedAt: date('updated_at'),
});

export const pools = pgTable('pools', {
  id: serial('id').primaryKey(),
  tokenId: integer('token_id').references(() => tokens.id), // link to the token table's id field
  pool: text('pool').unique(), // pool address
  creator: text('creator'), // user wallet address
  tokenMint: text('token_mint'), // token mint address
  poolSolVault: text('pool_sol_vault'), // pool sol vault address
  poolSolFeeVault: text('pool_sol_fee_vault'), // pool sol fee vault address
  poolTokenAccount: text('pool_token_account'), // pool token account address
  supply: bigint('supply', { mode: 'number' }),
  solReserve: bigint('sol_reserve', { mode: 'number' }),
  totalFeeSharePercentage: integer('total_fee_share_percentage'), // 0-100
  createdAt: date('created_at'),
  updatedAt: date('updated_at'),
});

export const feeRecipients = pgTable('fee_recipients', {
  id: serial('id').primaryKey(),
  poolId: integer('pool_id').references(() => pools.id), // link to the pools table's id field
  recipientType: text('recipient_type'), // FeeRecipientType
  recipient: text('recipient'), // Pubkey address
  sharePercentage: integer('share_percentage'), // 0-100
  totalFee: bigint('total_fee', { mode: 'number' }),
  unclaimedFee: bigint('unclaimed_fee', { mode: 'number' }),
  createdAt: date('created_at'),
  updatedAt: date('updated_at'),
});

export const feeClaims = pgTable('fee_claims', {
  id: serial('id').primaryKey(),
  feeRecipientId: integer('fee_recipient_id').references(
    () => feeRecipients.id,
  ), // link to the feeRecipients table's id field
  amount: bigint('amount', { mode: 'number' }),
  createdAt: date('created_at'),
  updatedAt: date('updated_at'),
});

export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  pool: text('pool').references(() => pools.pool), // pool address linked to the pool table's pool field
  user: text('user'), // user wallet address
  side: text('side'), // buy or sell
  amount: bigint('amount', { mode: 'number' }),
  price: bigint('price', { mode: 'number' }),
  uniqueId: text('unique_id'),
  createdAt: date('created_at'),
  updatedAt: date('updated_at'),
});

// Event tables for storing raw blockchain events

export const poolCreatedEvent = pgTable('pool_created_event', {
  id: serial('id').primaryKey(),
  pool: text('pool'),
  creator: text('creator'),
  tokenMint: text('token_mint'),
  poolSolVault: text('pool_sol_vault'),
  poolSolFeeVault: text('pool_sol_fee_vault'),
  poolTokenAccount: text('pool_token_account'),
  slot: bigint('slot', { mode: 'number' }),
  signature: text('signature'),
  rawEventData: jsonb('raw_event_data'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const distributeFeeEvent = pgTable('distribute_fee_event', {
  id: serial('id').primaryKey(),
  pool: text('pool'),
  feeSharePercentage: integer('fee_share_percentage'),
  recipient: text('recipient'),
  recipientType: text('recipient_type'),
  slot: bigint('slot', { mode: 'number' }),
  signature: text('signature'),
  rawEventData: jsonb('raw_event_data'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const claimFeesEvent = pgTable('claim_fees_event', {
  id: serial('id').primaryKey(),
  pool: text('pool'),
  feeRecipient: text('fee_recipient'),
  claimAmount: bigint('claim_amount', { mode: 'number' }),
  slot: bigint('slot', { mode: 'number' }),
  signature: text('signature'),
  rawEventData: jsonb('raw_event_data'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const sellTokensEvent = pgTable('sell_tokens_event', {
  id: serial('id').primaryKey(),
  pool: text('pool'),
  user: text('user'),
  amountTokens: bigint('amount_tokens', { mode: 'number' }),
  price: bigint('price', { mode: 'number' }),
  slot: bigint('slot', { mode: 'number' }),
  signature: text('signature'),
  uniqueId: text('unique_id'),
  rawEventData: jsonb('raw_event_data'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const buyTokensEvent = pgTable('buy_tokens_event', {
  id: serial('id').primaryKey(),
  pool: text('pool'),
  user: text('user'),
  amountTokens: bigint('amount_tokens', { mode: 'number' }),
  price: bigint('price', { mode: 'number' }),
  slot: bigint('slot', { mode: 'number' }),
  signature: text('signature'),
  uniqueId: text('unique_id'),
  rawEventData: jsonb('raw_event_data'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// Slot tracking table for monitoring blockchain progress
export const slotTracking = pgTable('slot_tracking', {
  id: serial('id').primaryKey(),
  programId: text('program_id').notNull(),
  lastProcessedSlot: bigint('last_processed_slot', { mode: 'number' })
    .notNull()
    .default(0),
  lastProcessedSignature: text('last_processed_signature'),
  lastProcessedTimestamp: timestamp('last_processed_timestamp', {
    withTimezone: true,
  }),
  isActive: boolean('is_active').default(true),
  isBackfilling: boolean('is_backfilling').default(false),
  backfillStartedAt: timestamp('backfill_started_at', { withTimezone: true }),
  backfillCompletedAt: timestamp('backfill_completed_at', {
    withTimezone: true,
  }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});
