import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  repositories,
  pools,
  orders,
  tokens,
  feeRecipients,
  feeClaims,
  users,
  poolCreatedEvent,
  distributeFeeEvent,
  claimFeesEvent,
  sellTokensEvent,
  buyTokensEvent,
  slotTracking,
} from '../db/schema';
import { db } from '../db/db';
import { eq, asc, desc, sql, and, or, like, inArray, gt } from 'drizzle-orm';
import { v2 as cloudinary } from 'cloudinary';
import {
  Connection,
  PublicKey,
  LAMPORTS_PER_SOL,
  Keypair,
} from '@solana/web3.js';
import {
  Program,
  AnchorProvider,
  Wallet,
  EventParser,
  BorshCoder,
} from '@coral-xyz/anchor';
import {
  getMint,
  TOKEN_2022_PROGRAM_ID,
  getTokenMetadata,
  getAssociatedTokenAddressSync,
} from '@solana/spl-token';
import type { Cathedral } from '../contracts/target/types/cathedral';
import CathedralIDL from '../contracts/target/idl/cathedral.json';
import { Express } from 'express';
import { BN } from 'bn.js';
import { CacheService } from '../shared/cache.service';
import { AuthService } from 'src/auth/auth.service';
import axios from 'axios';

CathedralIDL.address = process.env.SOLANA_PROGRAM_ID;
console.log('CathedralIDL.address:', CathedralIDL.address);

@Injectable()
export class RepositoriesService implements OnModuleInit {
  private connection: Connection;
  private program: Program<Cathedral>;
  constructor(
    private readonly cacheService: CacheService, // Inject CacheService
    private readonly authService: AuthService, // Inject AuthService
  ) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    this.connection = new Connection(process.env.SOLANA_RPC_URL, 'confirmed');

    // const wallet = NodeWallet.local();
    // const provider = new AnchorProvider(
    //   this.connection,
    //   wallet,
    //   AnchorProvider.defaultOptions(),
    // );
    // const provider = AnchorProvider.env();
    const listenConnection = new Connection(
      process.env.ANCHOR_PROVIDER_URL,
      'confirmed',
    );
    const wallet = new Wallet(Keypair.generate());
    const provider = new AnchorProvider(
      listenConnection,
      wallet,
      AnchorProvider.defaultOptions(),
    );
    this.program = new Program(CathedralIDL as Cathedral, provider);
  }

  async onModuleInit() {
    // Check for gaps and backfill before starting real-time listening
    await this.checkAndBackfill();
    this.startListening();
  }

  /**
   * Get the last processed slot from database
   */
  private async getLastProcessedSlot(): Promise<number> {
    try {
      const tracking = await db.query.slotTracking.findFirst({
        where: eq(slotTracking.programId, 'cathedral'),
      });
      return tracking?.lastProcessedSlot || 0;
    } catch (error) {
      console.error('Error getting last processed slot:', error);
      return 0;
    }
  }

  /**
   * Update the last processed slot in database (with anti-rollback protection)
   */
  private async updateLastProcessedSlot(
    slot: number,
    signature?: string,
  ): Promise<void> {
    try {
      const result = await db
        .update(slotTracking)
        .set({
          lastProcessedSlot: slot,
          lastProcessedSignature: signature,
          lastProcessedTimestamp: new Date(),
          updatedAt: new Date(),
        } as any)
        .where(
          and(
            eq(slotTracking.programId, 'cathedral'),
            // Only update if new slot is greater than current slot (prevent rollback)
            sql`last_processed_slot < ${slot}`,
          ),
        )
        .returning();

      if (result.length > 0) {
        console.log(`Updated last processed slot to ${slot}`);
      } else {
        console.log(
          `Skipped updating slot ${slot} (not greater than current slot)`,
        );
      }
    } catch (error) {
      console.error('Error updating last processed slot:', error);
    }
  }

  /**
   * Check for gaps and backfill missing events (with distributed lock)
   */
  private async checkAndBackfill(): Promise<void> {
    try {
      // Try to acquire backfill lock
      const lockAcquired = await this.acquireBackfillLock();
      if (!lockAcquired) {
        console.log(
          'Another instance is performing backfill, skipping (distributed lock)',
        );
        return;
      }

      try {
        const lastProcessedSlot = await this.getLastProcessedSlot();

        // If lastProcessedSlot is 0, it means this is the first run, no need to backfill
        if (lastProcessedSlot === 0) {
          console.log(
            'First run detected (lastProcessedSlot = 0), skipping backfill',
          );
          return;
        }

        const currentSlot = await this.connection.getSlot();

        if (currentSlot > lastProcessedSlot + 100) {
          console.warn(
            `Gap detected: last processed ${lastProcessedSlot}, current ${currentSlot}`,
          );
          await this.backfillEvents(lastProcessedSlot + 1, currentSlot);
        } else {
          console.log('No gap detected, continuing with real-time listening');
        }
      } finally {
        // Always release the lock
        await this.releaseBackfillLock();
      }
    } catch (error) {
      console.error('Error checking for gaps:', error);
      // Try to release lock on error
      await this.releaseBackfillLock().catch(() => {});
    }
  }

  /**
   * Acquire distributed backfill lock using database
   */
  private async acquireBackfillLock(): Promise<boolean> {
    try {
      const result = await db
        .update(slotTracking)
        .set({
          isBackfilling: true,
          backfillStartedAt: new Date(),
        } as any)
        .where(
          and(
            eq(slotTracking.programId, 'cathedral'),
            eq(slotTracking.isBackfilling, false),
          ),
        )
        .returning();

      const acquired = result.length > 0;
      if (acquired) {
        console.log('Backfill lock acquired successfully');
      }
      return acquired;
    } catch (error) {
      console.error('Error acquiring backfill lock:', error);
      return false;
    }
  }

  /**
   * Release distributed backfill lock
   */
  private async releaseBackfillLock(): Promise<void> {
    try {
      await db
        .update(slotTracking)
        .set({
          isBackfilling: false,
          backfillCompletedAt: new Date(),
        } as any)
        .where(eq(slotTracking.programId, 'cathedral'));

      console.log('Backfill lock released');
    } catch (error) {
      console.error('Error releasing backfill lock:', error);
    }
  }

  /**
   * Public method for AdminController to trigger manual backfill
   */
  async triggerManualBackfill(fromSlot: number, toSlot: number): Promise<void> {
    await this.backfillEvents(fromSlot, toSlot);
  }

  /**
   * Public method for AdminController to trigger check and backfill
   */
  async triggerCheckAndBackfill(): Promise<void> {
    await this.checkAndBackfill();
  }

  /**
   * Public method to get current slot
   */
  async getCurrentSlot(): Promise<number> {
    return await this.connection.getSlot();
  }

  /**
   * Backfill missing events from a specific slot range
   */
  private async backfillEvents(
    fromSlot: number,
    toSlot: number,
  ): Promise<void> {
    console.log(`Starting backfill from slot ${fromSlot} to ${toSlot}`);

    try {
      // Get all signatures for the program in the slot range
      const signatures = await this.connection.getSignaturesForAddress(
        this.program.programId,
        {
          limit: 1000,
          before: undefined,
        },
      );

      // Filter signatures by slot range
      const filteredSignatures = signatures.filter(
        (sig) => sig.slot >= fromSlot && sig.slot <= toSlot,
      );

      console.log(
        `Found ${filteredSignatures.length} signatures in slot range`,
      );

      // Process each signature
      for (const sig of filteredSignatures) {
        await this.processSignatureForBackfill(sig.signature, sig.slot);
      }

      // Update the last processed slot
      await this.updateLastProcessedSlot(toSlot);
    } catch (error) {
      console.error('Error during backfill:', error);
      throw error;
    }
  }

  /**
   * Process a single signature for backfill using Anchor's event parser
   */
  private async processSignatureForBackfill(
    signature: string,
    slot: number,
  ): Promise<void> {
    try {
      // Get transaction details
      const tx = await this.connection.getTransaction(signature, {
        commitment: 'confirmed',
        maxSupportedTransactionVersion: 0,
      });

      if (!tx || !tx.meta) {
        console.warn(`Transaction not found or has no metadata: ${signature}`);
        return;
      }

      // Use Anchor's event parser to parse events from transaction
      try {
        // Anchor's EventParser can parse events from transaction
        const eventParser = new EventParser(
          this.program.programId,
          new BorshCoder(this.program.idl),
        );

        // Parse events from transaction logs
        const parsedEvents = eventParser.parseLogs(tx.meta.logMessages || []);

        for (const event of parsedEvents) {
          console.log('Parsed event from backfill:', event.name, event.data);

          // Add signature and slot to event data
          await this.processBackfillEvent(
            event.name,
            event.data,
            signature,
            slot,
          );
        }
      } catch (parseError) {
        console.error(
          `Failed to parse events from transaction ${signature}:`,
          parseError,
        );
      }
    } catch (error) {
      console.error(`Error processing signature ${signature}:`, error);
    }
  }

  /**
   * Process a parsed event from backfill
   */
  private async processBackfillEvent(
    eventName: string,
    eventData: any,
    signature: string,
    slot: number,
  ): Promise<void> {
    try {
      // Map event name to our event types
      const eventTypeMap: Record<string, string> = {
        PoolCreated: 'poolCreated',
        DistributeFeeEvent: 'distributeFeeEvent',
        ClaimFeesEvent: 'claimFeesEvent',
        SellTokensEvent: 'sellTokensEvent',
        BuyTokensEvent: 'buyTokensEvent',
      };

      const eventType = eventTypeMap[eventName];
      if (!eventType) {
        console.warn(`Unknown event type: ${eventName}`);
        return;
      }

      // Create event object with signature and slot
      const event = {
        ...eventData,
        signature,
        slot,
        eventType,
      };

      // Save to database using existing logic
      await this.saveEventForBackfill(event);
    } catch (error) {
      console.error(`Error processing backfill event ${eventName}:`, error);
    }
  }

  /**
   * Save event to appropriate table for backfill and process business logic
   */
  private async saveEventForBackfill(event: any): Promise<void> {
    try {
      const eventType = event.eventType || event.type;

      switch (eventType) {
        case 'poolCreated':
          // Save raw event data
          await db.insert(poolCreatedEvent).values({
            pool: event.pool,
            creator: event.creator,
            tokenMint: event.tokenMint,
            poolSolVault: event.poolSolVault,
            poolSolFeeVault: event.poolSolFeeVault,
            poolTokenAccount: event.poolTokenAccount,
            slot: event.slot,
            signature: event.signature,
            rawEventData: event,
          });

          // Process business logic (same as real-time listener)
          const isPoolExists = await this.getPool(event.pool);
          if (!isPoolExists) {
            const poolData = {
              pool: event.pool,
              creator: event.creator,
              tokenMint: event.tokenMint,
              poolSolVault: event.poolSolVault,
              poolSolFeeVault: event.poolSolFeeVault,
              poolTokenAccount: event.poolTokenAccount,
              supply: BigInt(100000000),
              solReserve: BigInt(0),
            };
            await this.createToken(event.tokenMint, event.creator);
            await this.createPool(poolData);
          }
          break;

        case 'distributeFeeEvent':
          // Save raw event data
          await db.insert(distributeFeeEvent).values({
            pool: event.pool,
            feeSharePercentage: event.feeSharePercentage,
            recipient: event.recipient,
            recipientType: event.recipientType,
            slot: event.slot,
            signature: event.signature,
            rawEventData: event,
          });

          // Process business logic
          const isFeeRecipientExists = await this.getFeeRecipient(
            event.pool,
            event.recipient,
          );
          if (!isFeeRecipientExists) {
            const feeRecipient = {
              poolId: event.pool,
              recipientType: event.recipientType,
              recipient: event.recipient,
              sharePercentage: event.feeSharePercentage,
              totalFee: BigInt(0),
              unclaimedFee: BigInt(0),
            };
            await this.createFeeRecipient(feeRecipient);
            await this.updatePoolTotalFeeSharePercentage(
              event.pool,
              event.feeSharePercentage,
            );
          }
          break;

        case 'claimFeesEvent':
          // Save raw event data
          await db.insert(claimFeesEvent).values({
            pool: event.pool,
            feeRecipient: event.feeRecipient,
            claimAmount: event.claimAmount,
            slot: event.slot,
            signature: event.signature,
            rawEventData: event,
          });

          // Process business logic
          const feeRecipientTable = await this.getFeeRecipient(
            event.pool,
            event.feeRecipient,
          );
          if (feeRecipientTable) {
            const feeClaim = {
              feeRecipientId: feeRecipientTable.id,
              amount: BigInt(event.claimAmount),
            };
            await this.createFeeClaim(feeClaim);
            await this.updateFeeRecipientUnclaimedFee(feeRecipientTable.id, 0);
          }
          break;

        case 'sellTokensEvent':
          // Save raw event data
          const sellUniqueId = `${event.signature}-${event.slot}`;
          await db.insert(sellTokensEvent).values({
            pool: event.pool,
            user: event.user,
            amountTokens: event.amountTokens,
            price: event.price,
            slot: event.slot,
            signature: event.signature,
            uniqueId: sellUniqueId,
            rawEventData: event,
          });

          // Process business logic
          const isSellOrderExists = await db.query.orders.findFirst({
            where: eq(orders.uniqueId, sellUniqueId),
          });

          if (!isSellOrderExists) {
            const order = {
              pool: event.pool,
              user: event.user,
              side: 'sell',
              amount: BigInt(event.amountTokens),
              price: BigInt(event.price),
              uniqueId: sellUniqueId,
            };
            await this.createOrder(order);
            await this.updatePoolSupply(event.pool);
          }
          break;

        case 'buyTokensEvent':
          // Save raw event data
          const buyUniqueId = `${event.signature}-${event.slot}`;
          await db.insert(buyTokensEvent).values({
            pool: event.pool,
            user: event.user,
            amountTokens: event.amountTokens,
            price: event.price,
            slot: event.slot,
            signature: event.signature,
            uniqueId: buyUniqueId,
            rawEventData: event,
          });

          // Process business logic
          const isBuyOrderExists = await db.query.orders.findFirst({
            where: eq(orders.uniqueId, buyUniqueId),
          });

          if (!isBuyOrderExists) {
            const order = {
              pool: event.pool,
              user: event.user,
              side: 'buy',
              amount: BigInt(event.amountTokens),
              price: BigInt(event.price),
              uniqueId: buyUniqueId,
            };
            await this.createOrder(order);
            await this.updatePoolSupply(event.pool);
          }
          break;

        default:
          console.warn(`Unknown event type: ${eventType}`);
      }
    } catch (error) {
      console.error('Error saving event:', error);
    }
  }

  private async startListening() {
    console.log('start listening event');
    // pool created event
    this.program.addEventListener(
      'poolCreated',
      async (event, slot, signature) => {
        console.log('received poolCreated event:', event);
        const pool = event.pool.toString();
        const creator = event.creator.toString();
        const tokenMint = event.tokenMint.toString();
        const poolSolVault = event.poolSolVault.toString();
        const poolSolFeeVault = event.poolSolFeeVault.toString();
        const poolTokenAccount = event.poolTokenAccount.toString();

        // Check if event already exists to prevent duplicates
        const existingEvent = await db.query.poolCreatedEvent.findFirst({
          where: and(
            eq(poolCreatedEvent.signature, signature || ''),
            eq(poolCreatedEvent.slot, slot || 0),
          ),
        });

        if (existingEvent) {
          console.log(
            'Pool created event already exists, skipping. signature:',
            signature,
            'slot:',
            slot,
          );
          return;
        }

        // Save raw event data to database
        try {
          await db.insert(poolCreatedEvent).values({
            pool,
            creator,
            tokenMint,
            poolSolVault,
            poolSolFeeVault,
            poolTokenAccount,
            slot: slot || 0,
            signature: signature || '',
            rawEventData: event as any,
          });
          console.log('Pool created event saved to database');

          // Update last processed slot
          if (slot) {
            await this.updateLastProcessedSlot(slot, signature);
          }
        } catch (error) {
          console.error('Error saving pool created event:', error);
        }

        // query pool if exists
        const isPoolExists = await this.getPool(pool);
        if (isPoolExists) {
          console.log('pool already exists');
          return;
        }

        const poolData = {
          pool,
          creator,
          tokenMint,
          poolSolVault,
          poolSolFeeVault,
          poolTokenAccount,
          supply: BigInt(100000000),
          solReserve: BigInt(0),
        };

        // Create token and pool with wallet verification
        try {
          await this.createToken(tokenMint, creator);
          await this.createPool(poolData);
          console.log(
            `✅ Pool ${pool} created successfully for creator ${creator}`,
          );
        } catch (error) {
          console.error(
            `❌ Failed to create pool ${pool} for creator ${creator}:`,
            error.message,
          );
          // Log the error but don't throw - event has already been saved
          // This prevents the listener from crashing
        }
      },
    );

    // distribute fee event
    this.program.addEventListener(
      'distributeFeeEvent',
      async (event, slot, signature) => {
        console.log('received distributeFeeEvent event:', event);
        const pool = event.pool.toString();
        const feeSharePercentage = event.feeSharePercentage;
        const recipient = event.recipient.toString();
        const recipientType = event.recipientType;

        // Check if event already exists to prevent duplicates
        const existingEvent = await db.query.distributeFeeEvent.findFirst({
          where: and(
            eq(distributeFeeEvent.signature, signature || ''),
            eq(distributeFeeEvent.slot, slot || 0),
            eq(distributeFeeEvent.recipient, recipient),
          ),
        });

        if (existingEvent) {
          console.log(
            'Distribute fee event already exists, skipping. signature:',
            signature,
            'slot:',
            slot,
            'recipient:',
            recipient,
          );
          return;
        }

        // Save raw event data to database
        try {
          await db.insert(distributeFeeEvent).values({
            pool,
            feeSharePercentage,
            recipient,
            recipientType,
            slot: slot || 0,
            signature: signature || '',
            rawEventData: event as any,
          });
          console.log('Distribute fee event saved to database');

          // Update last processed slot
          if (slot) {
            await this.updateLastProcessedSlot(slot, signature);
          }
        } catch (error) {
          console.error('Error saving distribute fee event:', error);
        }

        const isFeeRecipientExists = await this.getFeeRecipient(
          pool,
          recipient,
        );
        if (isFeeRecipientExists) {
          console.log('fee recipient already exists');
          return;
        }

        const feeRecipient = {
          poolId: pool,
          recipientType,
          recipient,
          sharePercentage: feeSharePercentage,
          totalFee: BigInt(0),
          unclaimedFee: BigInt(0),
        };
        await this.createFeeRecipient(feeRecipient);

        // update pool totalFeeSharePercentage
        await this.updatePoolTotalFeeSharePercentage(pool, feeSharePercentage);
      },
    );

    // claim fee event
    this.program.addEventListener(
      'claimFeesEvent',
      async (event, slot, signature) => {
        console.log('received claimFeesEvent event:', event);
        const pool = event.pool.toString();
        const feeRecipient = event.feeRecipient.toString();
        const amount = BigInt(event.claimAmount.toString());

        // Check if event already exists to prevent duplicates
        const existingEvent = await db.query.claimFeesEvent.findFirst({
          where: and(
            eq(claimFeesEvent.signature, signature || ''),
            eq(claimFeesEvent.slot, slot || 0),
            eq(claimFeesEvent.feeRecipient, feeRecipient),
          ),
        });

        if (existingEvent) {
          console.log(
            'Claim fees event already exists, skipping. signature:',
            signature,
            'slot:',
            slot,
            'feeRecipient:',
            feeRecipient,
          );
          return;
        }

        // Save raw event data to database
        try {
          await db.insert(claimFeesEvent).values({
            pool,
            feeRecipient,
            claimAmount: amount,
            slot: slot || 0,
            signature: signature || '',
            rawEventData: event as any,
          });
          console.log('Claim fees event saved to database');

          // Update last processed slot
          if (slot) {
            await this.updateLastProcessedSlot(slot, signature);
          }
        } catch (error) {
          console.error('Error saving claim fees event:', error);
        }

        const feeRecipientTable = await this.getFeeRecipient(
          pool,
          feeRecipient,
        );
        if (!feeRecipientTable) {
          console.log('fee recipient not found');
          return;
        }

        const feeClaim = {
          feeRecipientId: feeRecipientTable.id,
          amount,
        };
        await this.createFeeClaim(feeClaim);

        // update fee recipient unclaimedFee
        await this.updateFeeRecipientUnclaimedFee(feeRecipientTable.id, 0);
      },
    );

    // sell tokens event
    this.program.addEventListener(
      'sellTokensEvent',
      async (event, slot, signature) => {
        console.log('received sellTokensEvent event:', event);
        console.log('slot:', slot);
        console.log('signature:', signature);
        const pool = event.pool.toString();
        const user = event.user.toString();
        const amount = BigInt(event.amountTokens.toString());
        const price = BigInt(event.price.toString());
        const uniqueId = `${signature}-${slot}`;

        // Check if event already exists to prevent duplicates
        const existingEvent = await db.query.sellTokensEvent.findFirst({
          where: eq(sellTokensEvent.uniqueId, uniqueId),
        });

        if (existingEvent) {
          console.log(
            'Sell tokens event already exists, skipping. uniqueId:',
            uniqueId,
          );
          return;
        }

        // Save raw event data to database
        try {
          await db.insert(sellTokensEvent).values({
            pool,
            user,
            amountTokens: amount,
            price,
            slot: slot || 0,
            signature: signature || '',
            uniqueId,
            rawEventData: event as any,
          });
          console.log('Sell tokens event saved to database');

          // Update last processed slot
          if (slot) {
            await this.updateLastProcessedSlot(slot, signature);
          }
        } catch (error) {
          console.error('Error saving sell tokens event:', error);
        }

        const isOrderExists = await db.query.orders.findFirst({
          where: eq(orders.uniqueId, uniqueId),
        });

        if (isOrderExists) {
          console.log('order already exists, uniqueId:', uniqueId);
          return;
        }

        const order = {
          pool,
          user,
          side: 'sell',
          amount,
          price,
          uniqueId,
        };

        await this.createOrder(order);
        await this.updatePoolSupply(pool);
      },
    );

    // buy tokens event
    this.program.addEventListener(
      'buyTokensEvent',
      async (event, slot, signature) => {
        console.log('received buyTokensEvent event:', event);
        const pool = event.pool.toString();
        const user = event.user.toString();
        const amount = BigInt(event.amountTokens.toString());
        const price = BigInt(event.price.toString());
        const uniqueId = `${signature}-${slot}`;

        // Check if event already exists to prevent duplicates
        const existingEvent = await db.query.buyTokensEvent.findFirst({
          where: eq(buyTokensEvent.uniqueId, uniqueId),
        });

        if (existingEvent) {
          console.log(
            'Buy tokens event already exists, skipping. uniqueId:',
            uniqueId,
          );
          return;
        }

        // Save raw event data to database
        try {
          await db.insert(buyTokensEvent).values({
            pool,
            user,
            amountTokens: amount,
            price,
            slot: slot || 0,
            signature: signature || '',
            uniqueId,
            rawEventData: event as any,
          });
          console.log('Buy tokens event saved to database');

          // Update last processed slot
          if (slot) {
            await this.updateLastProcessedSlot(slot, signature);
          }
        } catch (error) {
          console.error('Error saving buy tokens event:', error);
        }

        const isOrderExists = await db.query.orders.findFirst({
          where: eq(orders.uniqueId, uniqueId),
        });

        if (isOrderExists) {
          console.log('order already exists, uniqueId:', uniqueId);
          return;
        }

        const order = {
          pool,
          user,
          side: 'buy',
          amount,
          price,
          uniqueId,
        };
        await this.createOrder(order);

        await this.updatePoolSupply(pool);
      },
    );
  }

  async getRepositoryById(id: number) {
    const result = await db
      .select({
        id: repositories.id,
        name: repositories.name,
        owner: repositories.owner,
        stars: repositories.stars,
        forks: repositories.forks,
        link: repositories.link,
        description: repositories.description,
        isFork: repositories.isFork,
        forksUrl: repositories.forksUrl,
        contributors: repositories.contributors,
        ownerAvatarUrl: users.avatarUrl,
        ownerFollowers: users.githubFollowers,
      })
      .from(repositories)
      .leftJoin(users, eq(repositories.owner, users.githubLogin))
      .where(eq(repositories.id, id))
      .limit(1);

    return result[0];
  }

  async searchRepositories(item: string) {
    const result = await db
      .select({
        id: repositories.id,
        name: repositories.name,
        owner: repositories.owner,
        stars: repositories.stars,
        forks: repositories.forks,
        tokenMint: tokens.mint,
        description: repositories.description,
        imgUrl: tokens.imgUrl,
      })
      .from(repositories)
      .leftJoin(tokens, eq(repositories.id, tokens.repositoryId))
      .where(
        and(
          eq(repositories.isDeployed, true),
          or(
            like(repositories.name, `%${item}%`),
            like(repositories.owner, `%${item}%`),
            eq(sql`${repositories.id}::text`, item),
          ),
        ),
      )
      .limit(15);

    const totalResult = await db
      .select({ count: sql`count(*)` })
      .from(repositories)
      .leftJoin(tokens, eq(repositories.id, tokens.repositoryId))
      .where(
        and(
          eq(repositories.isDeployed, true),
          or(
            like(repositories.name, `%${item}%`),
            like(repositories.owner, `%${item}%`),
            eq(sql`${repositories.id}::text`, item),
          ),
        ),
      );
    const total = Number(totalResult[0].count);

    const ps = await db.query.pools.findMany({
      where: inArray(
        pools.tokenMint,
        result.map((repo) => repo.tokenMint),
      ),
      columns: {
        pool: true,
        supply: true,
        tokenMint: true,
      },
    });

    const poolMap = new Map(ps.map((p) => [p.tokenMint, p.supply]));

    const returns = result.map((repo) => ({
      ...repo,
      marketCap:
        getPrice(poolMap.get(repo.tokenMint)) * poolMap.get(repo.tokenMint),
    }));

    return {
      data: returns,
      pagination: {
        total,
        page: 1,
        pageSize: 15,
        hasMore: total > 15,
        totalPages: Math.ceil(total / 15),
      },
    };
  }

  async getRecommendRepository() {
    const results = await db
      .select({
        id: repositories.id,
        name: repositories.name,
        owner: repositories.owner,
        stars: repositories.stars,
        forks: repositories.forks,
        isFork: repositories.isFork,
        tokenMint: tokens.mint,
        description: repositories.description,
        imgUrl: tokens.imgUrl,
        ticker: tokens.ticker,
      })
      .from(repositories)
      .leftJoin(tokens, eq(repositories.id, tokens.repositoryId))
      .where(eq(repositories.isDeployed, true))
      .orderBy(desc(repositories.stars))
      .limit(1);

    const pool = await db.query.pools.findFirst({
      where: eq(pools.tokenMint, results[0].tokenMint),
      columns: {
        pool: true,
        supply: true,
      },
    });

    // const allOrders = await db.query.orders.findMany({
    //   where: eq(orders.pool, pool[0].pool),
    //   columns: {
    //     pool: true,
    //     price: true,
    //   },
    // });

    // const volume = allOrders.reduce((acc, order) => {
    //   return acc + order.price;
    // }, 0);

    return {
      ...results[0],
      marketCap: getPrice(pool.supply) * pool.supply,
      // totalVolume: volume,
    };
  }

  async getRepositories(query: any) {
    const {
      sort = 'createdAt',
      order = 'desc',
      page = 1,
      limit = 15,
      time,
      minStars,
      maxStars,
      minForks,
      maxForks,
      minMarketCap,
      maxMarketCap,
      minVolume,
      maxVolume,
    } = query;

    const pageNum = Number(page);
    const limitNum = Number(limit);
    const offset = (pageNum - 1) * limitNum;
    const hours = time ? Number(time) : undefined;

    let sortField = sort.toString();
    if (sort === 'createdAt') {
      sortField = 'created_at';
    }

    // Build WHERE conditions for repositories filtering
    const whereConditions: any[] = [eq(repositories.isDeployed, true)];

    // Add stars filter
    if (minStars !== undefined && minStars !== null) {
      whereConditions.push(sql`${repositories.stars}::integer >= ${minStars}`);
    }
    if (maxStars !== undefined && maxStars !== null) {
      whereConditions.push(sql`${repositories.stars}::integer <= ${maxStars}`);
    }

    // Add forks filter
    if (minForks !== undefined && minForks !== null) {
      whereConditions.push(sql`${repositories.forks}::integer >= ${minForks}`);
    }
    if (maxForks !== undefined && maxForks !== null) {
      whereConditions.push(sql`${repositories.forks}::integer <= ${maxForks}`);
    }

    // Add time filter
    if (hours) {
      const hoursAgo = new Date();
      hoursAgo.setHours(hoursAgo.getHours() - hours);
      whereConditions.push(sql`${repositories.createdAt} >= ${hoursAgo}`);
    }

    const whereClause =
      whereConditions.length > 1 ? and(...whereConditions) : whereConditions[0];

    const totalResult = await db
      .select({ count: sql`count(*)` })
      .from(repositories)
      .where(whereClause);
    const total = Number(totalResult[0].count);
    const totalPages = Math.ceil(total / limitNum);

    if (sort === 'market_cap') {
      // Get all pools with supply data
      const allPools = await db.query.pools.findMany({
        columns: {
          pool: true,
          supply: true,
          tokenMint: true,
        },
      });

      const ts = await db.query.tokens.findMany({
        where: inArray(
          tokens.mint,
          allPools.map((p) => p.tokenMint),
        ),
        columns: {
          mint: true,
          imgUrl: true,
          ticker: true,
          repositoryName: true,
          repositoryId: true,
        },
      });

      const repos = await db.query.repositories.findMany({
        columns: {
          id: true,
          name: true,
          owner: true,
          stars: true,
          forks: true,
          description: true,
          isFork: true,
        },
        where: whereClause,
      });

      // Get volume data if filtering by volume
      const volumeMap = new Map<string, number>();
      if (minVolume !== undefined || maxVolume !== undefined) {
        const allOrders = await db.query.orders.findMany({
          where: inArray(
            orders.pool,
            allPools.map((p) => p.pool),
          ),
          columns: {
            pool: true,
            price: true,
          },
        });

        allOrders.forEach((order) => {
          volumeMap.set(
            order.pool,
            (volumeMap.get(order.pool) || 0) + Number(order.price),
          );
        });
      }

      // Map and filter results
      let returns = allPools
        .map((p) => {
          const token = ts.find((t) => t.mint === p.tokenMint);
          if (!token) return null;
          const repo = repos.find((r) => r.id === token.repositoryId);
          if (!repo) return null;

          const marketCap = getPrice(p.supply) * p.supply;
          const totalVolume = volumeMap.get(p.pool) || 0;

          return {
            ...repo,
            imgUrl: token.imgUrl,
            ticker: token.ticker,
            pool: p.pool,
            marketCap,
            totalVolume,
          };
        })
        .filter((item) => item !== null);

      // Apply market cap filter
      if (minMarketCap !== undefined && minMarketCap !== null) {
        returns = returns.filter((r) => r.marketCap >= minMarketCap);
      }
      if (maxMarketCap !== undefined && maxMarketCap !== null) {
        returns = returns.filter((r) => r.marketCap <= maxMarketCap);
      }

      // Apply volume filter
      if (minVolume !== undefined && minVolume !== null) {
        returns = returns.filter((r) => r.totalVolume >= minVolume);
      }
      if (maxVolume !== undefined && maxVolume !== null) {
        returns = returns.filter((r) => r.totalVolume <= maxVolume);
      }

      // Sort by market cap
      returns.sort((a, b) => {
        if (order === 'asc') {
          return a.marketCap - b.marketCap;
        } else {
          return b.marketCap - a.marketCap;
        }
      });

      // Apply pagination after filtering
      const filteredTotal = returns.length;
      const paginatedReturns = returns.slice(offset, offset + limitNum);

      return {
        data: paginatedReturns,
        pagination: {
          total: filteredTotal,
          page: pageNum,
          pageSize: limitNum,
          hasMore: offset + limitNum < filteredTotal,
          totalPages: Math.ceil(filteredTotal / limitNum),
        },
      };
    } else {
      const result = await db
        .select({
          id: repositories.id,
          name: repositories.name,
          owner: repositories.owner,
          stars: repositories.stars,
          forks: repositories.forks,
          description: repositories.description,
          isFork: repositories.isFork,
          imgUrl: tokens.imgUrl,
          ticker: tokens.ticker,
          tokenMint: tokens.mint,
        })
        .from(repositories)
        .leftJoin(tokens, eq(repositories.id, tokens.repositoryId))
        .where(whereClause)
        .orderBy(
          sql`${repositories}.${sql.identifier(sortField)} ${sql.raw(order)}`,
        )
        .limit(limitNum * 5) // Get more to account for filtering
        .offset(offset);

      const ps = await db.query.pools.findMany({
        where: inArray(
          pools.tokenMint,
          result.map((repo) => repo.tokenMint).filter((m) => m),
        ),
        columns: {
          pool: true,
          supply: true,
          tokenMint: true,
        },
      });

      const poolMap = new Map(ps.map((p) => [p.tokenMint, p.supply]));
      const poolTokenMap = new Map(ps.map((p) => [p.tokenMint, p.pool]));

      const allOrders = await db.query.orders.findMany({
        where: inArray(
          orders.pool,
          ps.map((p) => p.pool),
        ),
        columns: {
          pool: true,
          price: true,
        },
      });

      const volumeMap = allOrders.reduce((acc, order) => {
        acc.set(order.pool, (acc.get(order.pool) || 0) + Number(order.price));
        return acc;
      }, new Map<string, number>());

      let returns = result.map((repo) => {
        const supply = poolMap.get(repo.tokenMint) || 0;
        const marketCap = getPrice(supply) * supply;
        const totalVolume =
          volumeMap.get(String(poolTokenMap.get(repo.tokenMint))) || 0;

        return {
          ...repo,
          marketCap,
          totalVolume,
        };
      });

      // Apply market cap filter
      if (minMarketCap !== undefined && minMarketCap !== null) {
        returns = returns.filter((r) => r.marketCap >= minMarketCap);
      }
      if (maxMarketCap !== undefined && maxMarketCap !== null) {
        returns = returns.filter((r) => r.marketCap <= maxMarketCap);
      }

      // Apply volume filter
      if (minVolume !== undefined && minVolume !== null) {
        returns = returns.filter((r) => r.totalVolume >= minVolume);
      }
      if (maxVolume !== undefined && maxVolume !== null) {
        returns = returns.filter((r) => r.totalVolume <= maxVolume);
      }

      // Paginate filtered results
      const paginatedReturns = returns.slice(0, limitNum);

      return {
        data: paginatedReturns,
        pagination: {
          total,
          page: pageNum,
          pageSize: limitNum,
          hasMore: pageNum < totalPages,
          totalPages,
        },
      };
    }
  }

  async getTotalRepositories() {
    const result = await db
      .select({ count: sql`count(*)` })
      .from(repositories)
      .where(eq(repositories.isDeployed, true));
    return result[0].count;
  }

  async getRepositoriesByUser(userName: string) {
    const repos = await db.query.repositories.findMany({
      where: and(
        eq(repositories.owner, userName),
        eq(repositories.isDeployed, false),
      ),
    });

    return repos;
  }

  async getUserDeployedRepositories(userName: string) {
    const repos = await db.query.repositories.findMany({
      where: and(
        eq(repositories.owner, userName),
        eq(repositories.isDeployed, true),
      ),
    });

    const totalResult = await db
      .select({ count: sql`count(*)` })
      .from(repositories)
      .where(
        and(
          eq(repositories.owner, userName),
          eq(repositories.isDeployed, true),
        ),
      );
    const total = Number(totalResult[0].count);

    return {
      data: repos,
      pagination: {
        total,
        page: 1,
        pageSize: repos.length,
        hasMore: false,
        totalPages: 1,
      },
    };
  }

  async getUserHoldingRepositories(walletAddr: string) {
    /*
    const userOrders = await db.query.orders.findMany({
      where: eq(orders.user, walletAddr),
    });

    const tokenHoldings: Record<
      string,
      { balance: bigint; name: string; id: number }
    > = {};

    for (const order of userOrders) {
      const { pool, amount, side } = order;
      const poolData = await this.getPool(pool);
      const tokenData = await db.query.tokens.findFirst({
        where: eq(tokens.mint, poolData.tokenMint),
      });
      const tokenMint = poolData.tokenMint;

      if (!tokenHoldings[tokenMint]) {
        tokenHoldings[tokenMint] = {
          balance: BigInt(0),
          name: tokenData.repositoryName,
          id: Number(tokenData.repositoryId),
        };
        if (poolData.creator === walletAddr) {
          tokenHoldings[tokenMint].balance += BigInt(LAMPORTS_PER_SOL);
        }
      }

      if (side === 'buy') {
        tokenHoldings[tokenMint].balance += BigInt(amount);
      } else {
        tokenHoldings[tokenMint].balance -= BigInt(amount);
      }
    }

    // 过滤出差值大于0的代币
    const positiveHoldings = Object.entries(tokenHoldings)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .filter(([_, { balance }]) => balance > BigInt(0))
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .map(([_, { balance, name, id }]) => ({
        balance: Number(balance) / LAMPORTS_PER_SOL,
        name,
        id,
      }));

    return positiveHoldings;
    */

    const userOrders = await db
      .selectDistinct({
        pool: orders.pool,
        tokenMint: tokens.mint,
        repositoryId: tokens.repositoryId,
        repositoryName: tokens.repositoryName,
      })
      .from(orders)
      .innerJoin(pools, eq(orders.pool, pools.pool))
      .innerJoin(tokens, eq(pools.tokenMint, tokens.mint))
      .where(eq(orders.user, walletAddr));

    // const userPools = await db.query.pools.findMany({
    //   columns: {
    //     pool: true,
    //     tokenMint: true,
    //   },
    //   where: eq(pools.creator, walletAddr),
    // });
    const userPools = await db
      .select({
        pool: pools.pool,
        tokenMint: pools.tokenMint,
        repositoryId: tokens.repositoryId,
        repositoryName: tokens.repositoryName,
      })
      .from(pools)
      .innerJoin(tokens, eq(pools.tokenMint, tokens.mint))
      .where(eq(pools.creator, walletAddr));

    const userTokens = new Map<
      string,
      {
        pool: string;
        tokenMint: string;
        repositoryId: number;
        repositoryName: string;
      }
    >();
    for (const pool of userPools) {
      userTokens.set(pool.tokenMint, pool);
    }

    for (const order of userOrders) {
      userTokens.set(order.tokenMint, order);
    }

    const holdingsPromises = Array.from(userTokens.values()).map(
      async (token) => {
        const userToken = await getAssociatedTokenAddressSync(
          new PublicKey(token.tokenMint),
          new PublicKey(walletAddr),
          false,
          TOKEN_2022_PROGRAM_ID,
        );
        const balance = await this.connection.getTokenAccountBalance(
          userToken,
          'confirmed',
        );
        if (balance.value.uiAmount) {
          return {
            balance: Number(balance.value.uiAmount),
            name: token.repositoryName,
            id: token.repositoryId,
          };
        }
        return null;
      },
    );

    const holdings = (await Promise.all(holdingsPromises)).filter(Boolean);

    return {
      data: holdings,
      pagination: {
        total: holdings.length,
        page: 1,
        pageSize: holdings.length,
        hasMore: false,
        totalPages: 1,
      },
    };
    /*
    const publicKeyWallet = new PublicKey(walletAddr);
    const userTokenAccounts = await this.connection.getTokenAccountsByOwner(
      publicKeyWallet,
      { programId: TOKEN_2022_PROGRAM_ID },
    );

    const holdings = await Promise.all(
      userTokenAccounts.value.map(async ({ account, pubkey }) => {
        const accountInfo = account.data;
        const dataView = new DataView(
          accountInfo.buffer,
          accountInfo.byteOffset,
          accountInfo.byteLength,
        );
        const amount = dataView.getBigUint64(64, true);
        const mint = new PublicKey(accountInfo.slice(0, 32));

        if (amount > 0) {
          const token = await db.query.tokens.findFirst({
            where: eq(tokens.mint, mint.toString()),
            columns: {
              repositoryName: true,
              repositoryId: true,
            },
          });

          return {
            balance: amount,
            name: token?.repositoryName || mint.toString(),
            id: Number(token?.repositoryId) || 0,
          };
        }
      }),
    );
    */
    // return holdings;
  }

  async getPool(pool: string) {
    const poolData = await db.query.pools.findFirst({
      where: eq(pools.pool, pool),
    });
    return poolData;
  }

  async getFeeRecipient(poolAddr: string, recipient: string) {
    const pool = await db.query.pools.findFirst({
      where: eq(pools.pool, poolAddr),
    });
    if (!pool) {
      throw new Error('Pool not found');
    }
    const feeRecipient = await db.query.feeRecipients.findFirst({
      where: and(
        eq(feeRecipients.poolId, pool.id),
        eq(feeRecipients.recipient, recipient),
      ),
    });
    return feeRecipient;
  }

  async getPoolByRepositoryId(id: number) {
    const token = await db.query.tokens.findFirst({
      where: eq(tokens.repositoryId, id),
    });

    if (!token) {
      throw new Error('Token not found');
    }

    const pool = await db.query.pools.findFirst({
      where: eq(pools.tokenMint, token.mint),
    });

    if (!pool) {
      throw new Error('Pool not found');
    }

    return {
      tokenMint: pool.tokenMint,
      creator: pool.creator,
      pool: pool.pool,
      poolTokenAccount: pool.poolTokenAccount,
      poolSolVault: pool.poolSolVault,
      poolSolFeeVault: pool.poolSolFeeVault,
      description: token.description,
    };
  }

  async getPoolOverview(pool: string) {
    const poolData = await db.query.pools.findFirst({
      where: eq(pools.pool, pool),
    });

    if (!poolData) {
      throw new Error('Pool not found');
    }

    const dealOrders = await db.query.orders.findMany({
      where: eq(orders.pool, pool),
    });

    const totalVolume = dealOrders.reduce((acc, order) => {
      return acc + order.price;
    }, 0);
    return {
      totalVolume: totalVolume / LAMPORTS_PER_SOL,
      totalSupply: poolData.supply / LAMPORTS_PER_SOL,
      solReserve: poolData.solReserve / LAMPORTS_PER_SOL,
    };
  }

  async getOrdersByPool(pool: string) {
    const result = await db.query.orders.findMany({
      where: eq(orders.pool, pool),
      orderBy: desc(orders.createdAt),
    });
    return result;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async createToken(tokenMint: string, creator: string) {
    const tokenInfo = await getMint(
      this.connection,
      new PublicKey(tokenMint),
      'confirmed',
      TOKEN_2022_PROGRAM_ID,
    );

    const metadata = await getTokenMetadata(
      this.connection,
      new PublicKey(tokenMint),
    );

    const description = metadata.additionalMetadata[0][1].toString();
    const repositoryName = metadata.additionalMetadata[1][1].toString();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const repoUrl = metadata.additionalMetadata[2][1].toString();
    const githubUser = metadata.additionalMetadata[3][1].toString();

    // Verify wallet binding: check if creator wallet is bound to the GitHub user
    console.log(
      `Verifying wallet binding for GitHub user: ${githubUser}, Creator wallet: ${creator}`,
    );
    const user = await db.query.users.findFirst({
      where: eq(users.githubLogin, githubUser),
    });

    if (!user) {
      console.error(
        `GitHub user ${githubUser} not found in database. Pool creation rejected.`,
      );
      throw new Error(
        `GitHub user ${githubUser} is not registered. Please login first.`,
      );
    }

    if (!user.wallet) {
      console.error(
        `GitHub user ${githubUser} has not bound a wallet. Pool creation rejected.`,
      );
      throw new Error(
        `GitHub user ${githubUser} has not bound a wallet. Please bind wallet first.`,
      );
    }

    if (user.wallet !== creator) {
      console.error(
        `Wallet mismatch: GitHub user ${githubUser} bound wallet is ${user.wallet}, but creator is ${creator}. Pool creation rejected.`,
      );
      throw new Error(
        `Wallet verification failed: The creator wallet does not match the wallet bound to GitHub user ${githubUser}.`,
      );
    }

    console.log(
      `✅ Wallet verification passed for GitHub user ${githubUser} with wallet ${creator}`,
    );

    const key = `user:${githubUser}:repositories`;
    // Get repository from cache
    let cachedRepos = await this.cacheService.getRepositories(key);
    if (!cachedRepos) {
      // If repository not found in cache, get from GitHub API
      cachedRepos = await this.authService.getUserGithubRepositories(repoUrl);
    }
    // Check if cached data is an array
    const repo = Array.isArray(cachedRepos?.data)
      ? cachedRepos.data.find((r) => r.name === repositoryName)
      : undefined;

    // Fetch contributors from repo contributors url
    let contributorsCount = 1; // Default to 1 (at least the owner)
    if (repo?.contributors_url) {
      try {
        const contributorsResponse = await axios.get(repo.contributors_url);
        if (Array.isArray(contributorsResponse.data)) {
          contributorsCount = contributorsResponse.data.length;
        }
      } catch (error) {
        console.warn('Failed to fetch contributors:', error.message);
        // Keep default value of 1
      }
    }

    // Save repository to database
    const [insertedRepo] = await db
      .insert(repositories)
      .values({
        name: repo.name,
        owner: repo.owner,
        stars: repo.stars,
        forks: repo.forks,
        link: repo.link,
        description: repo.description,
        isDeployed: true,
        isFork: repo.isFork,
        forksUrl: repo.forks_url,
        contributors: contributorsCount,
      })
      .returning();

    const tokenData = {
      name: metadata.name,
      ticker: metadata.symbol,
      imgUrl: metadata.uri,
      creator: tokenInfo.mintAuthority.toString(),
      mint: tokenMint,
      decimals: tokenInfo.decimals,
      meta: tokenMint, // TODO: maybe change to metadata
      description,
      repositoryName,
      repositoryId: insertedRepo.id,
      githubUser,
    };

    const result = await db.insert(tokens).values(tokenData);

    // Remove repository from cache
    const removed = await this.cacheService.removeRepositoryFromCache(
      githubUser,
      repositoryName,
    );
    if (!removed) {
      console.warn('Failed to remove repository from cache:', repositoryName);
    }
    return result;
  }

  async updatePoolSupply(poolAddr: string) {
    const poolData = await this.program.account.pool.fetch(
      new PublicKey(poolAddr),
    );

    const newSupply = BigInt(poolData.totalSupply.toString());
    const newSolReserve = BigInt(poolData.reserveSol.toString());

    await db
      .update(pools)
      .set({ supply: newSupply, solReserve: newSolReserve })
      .where(eq(pools.pool, poolAddr));
  }

  async createOrder(order: Omit<typeof orders.$inferInsert, 'id'>) {
    console.log('creating order to db:', order);
    const result = await db.insert(orders).values(order);
    return result;
  }

  async createPool(pool: Omit<typeof pools.$inferInsert, 'id'>) {
    const poolCreated = await db.query.pools.findFirst({
      where: eq(pools.pool, (pool as any).pool),
    });
    if (poolCreated) {
      return poolCreated;
    }
    console.log('creating pool to db:', pool);
    const result = await db.insert(pools).values(pool);
    return result;
  }

  async updatePoolTotalFeeSharePercentage(
    pool: string,
    feeSharePercentage: number,
  ) {
    const poolData = await db.query.pools.findFirst({
      where: eq(pools.pool, pool),
    });
    if (!poolData) {
      throw new Error('Pool not found');
    }
    const totalFeeSharePercentage =
      poolData.totalFeeSharePercentage + feeSharePercentage;
    if (totalFeeSharePercentage > 100) {
      throw new Error('Total fee share percentage exceeds 100');
    }
    await db
      .update(pools)
      .set({ totalFeeSharePercentage })
      .where(eq(pools.pool, pool));
  }

  async updateFeeRecipientUnclaimedFee(
    feeRecipientId: number,
    unclaimedFee: number,
  ) {
    await db
      .update(feeRecipients)
      .set({ unclaimedFee })
      .where(eq(feeRecipients.id, feeRecipientId));
  }

  async createFeeRecipient(
    feeRecipient: Omit<typeof feeRecipients.$inferInsert, 'id'>,
  ) {
    console.log('creating fee recipient to db:', feeRecipient);
    const result = await db.insert(feeRecipients).values(feeRecipient);
    return result;
  }

  async createFeeClaim(feeClaim: Omit<typeof feeClaims.$inferInsert, 'id'>) {
    console.log('creating fee claim to db:', feeClaim);
    const result = await db.insert(feeClaims).values(feeClaim);
    return result;
  }

  async uploadImage(file: Express.Multer.File) {
    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream((error, result) => {
          if (error) return reject(error);
          resolve(result);
        })
        .end(file.buffer);
    });
  }

  async getReposByStars(page = 1, limit = 10) {
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const offset = (pageNum - 1) * limitNum;

    const result = await db
      .select({
        id: repositories.id,
        name: repositories.name,
        owner: repositories.owner,
        stars: repositories.stars,
        forks: repositories.forks,
        description: repositories.description,
        imgUrl: tokens.imgUrl,
        tokenMint: tokens.mint,
      })
      .from(repositories)
      .leftJoin(tokens, eq(repositories.id, tokens.repositoryId))
      .where(eq(repositories.isDeployed, true))
      .orderBy(
        sql`${repositories}.${sql.identifier('stars')} ${sql.raw('desc')}`,
      )
      .limit(limitNum)
      .offset(offset);

    const ps = await db.query.pools.findMany({
      where: inArray(
        pools.tokenMint,
        result.map((repo) => repo.tokenMint),
      ),
      columns: {
        pool: true,
        supply: true,
        tokenMint: true,
      },
    });

    const poolMap = new Map(ps.map((p) => [p.tokenMint, p.supply]));

    // const allOrders = await db.query.orders.findMany({
    //   where: inArray(
    //     orders.pool,
    //     ps.map((p) => p.pool),
    //   ),
    //   columns: {
    //     pool: true,
    //     price: true,
    //   },
    // });

    // const volumeMap = allOrders.reduce((acc, order) => {
    //   acc.set(order.pool, (acc.get(order.pool) || 0) + Number(order.price));
    //   return acc;
    // }, new Map<string, number>());

    const returns = result.map((repo) => ({
      ...repo,
      marketCap:
        getPrice(poolMap.get(repo.tokenMint)) * poolMap.get(repo.tokenMint),
      // totalVolume: volumeMap.get(poolMap.get(repo.tokenMint)) || 0,
    }));

    const totalResult = await db
      .select({ count: sql`count(*)` })
      .from(repositories)
      .where(eq(repositories.isDeployed, true));
    const total = Number(totalResult[0].count);
    const totalPages = Math.ceil(total / limitNum);

    return {
      data: returns,
      pagination: {
        total,
        page: pageNum,
        pageSize: limitNum,
        hasMore: pageNum < totalPages,
        totalPages,
      },
    };
  }

  async getJustlisted(page = 1, limit = 10) {
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const offset = (pageNum - 1) * limitNum;

    const result = await db
      .select({
        id: repositories.id,
        name: repositories.name,
        owner: repositories.owner,
        stars: repositories.stars,
        forks: repositories.forks,
        description: repositories.description,
        imgUrl: tokens.imgUrl,
        tokenMint: tokens.mint,
      })
      .from(repositories)
      .leftJoin(tokens, eq(repositories.id, tokens.repositoryId))
      .where(eq(repositories.isDeployed, true))
      .orderBy(
        sql`${repositories}.${sql.identifier('created_at')} ${sql.raw('desc')}`,
      )
      .limit(limitNum)
      .offset(offset);

    const ps = await db.query.pools.findMany({
      where: inArray(
        pools.tokenMint,
        result.map((repo) => repo.tokenMint),
      ),
      columns: {
        pool: true,
        supply: true,
        tokenMint: true,
      },
    });

    const poolMap = new Map(ps.map((p) => [p.tokenMint, p.supply]));
    const poolTokenMap = new Map(ps.map((p) => [p.tokenMint, p.pool]));

    const allOrders = await db.query.orders.findMany({
      where: inArray(
        orders.pool,
        ps.map((p) => p.pool),
      ),
      columns: {
        pool: true,
        price: true,
      },
    });

    const volumeMap = allOrders.reduce((acc, order) => {
      acc.set(order.pool, (acc.get(order.pool) || 0) + Number(order.price));
      return acc;
    }, new Map<string, number>());

    const returns = result.map((repo) => ({
      ...repo,
      marketCap:
        getPrice(poolMap.get(repo.tokenMint)) * poolMap.get(repo.tokenMint),
      totalVolume: volumeMap.get(String(poolTokenMap.get(repo.tokenMint))) || 0,
    }));

    const totalResult = await db
      .select({ count: sql`count(*)` })
      .from(repositories)
      .where(eq(repositories.isDeployed, true));
    const total = Number(totalResult[0].count);
    const totalPages = Math.ceil(total / limitNum);

    return {
      data: returns,
      pagination: {
        total,
        page: pageNum,
        pageSize: limitNum,
        hasMore: pageNum < totalPages,
        totalPages,
      },
    };
  }

  /**
   * Get OHLCV data for a pool
   * @param pool - Pool address
   * @param interval - Time interval (1m, 5m, 15m, 1h, 4h, 1d)
   * @param limit - Maximum number of candles to return
   */
  async getPoolOHLCV(
    pool: string,
    interval: string = '5m',
    limit: number = 1000,
  ): Promise<any> {
    try {
      // Map interval to minutes
      const intervalMap: { [key: string]: number } = {
        '1m': 1,
        '5m': 5,
        '15m': 15,
        '30m': 30,
        '1h': 60,
        '4h': 240,
        '1d': 1440,
      };

      const minutes = intervalMap[interval] || 5;
      const intervalSeconds = minutes * 60;

      // Get orders from database, ordered by created_at
      const poolOrders = await db.query.orders.findMany({
        where: eq(orders.pool, pool),
        orderBy: asc(orders.createdAt),
      });

      if (!poolOrders || poolOrders.length === 0) {
        return [];
      }

      // Group orders into time buckets and calculate OHLCV
      const ohlcvMap = new Map<
        number,
        {
          time: number;
          open: number;
          high: number;
          low: number;
          close: number;
          volume: number;
        }
      >();

      poolOrders.forEach((order) => {
        const timestamp = new Date(order.createdAt).getTime() / 1000;
        const bucketTime =
          Math.floor(timestamp / intervalSeconds) * intervalSeconds;

        // Calculate token price: price is total SOL, amount is token quantity
        // Token unit price = total SOL / token quantity
        const priceInSol = Number(order.price) / LAMPORTS_PER_SOL;
        const amountInTokens = Number(order.amount) / LAMPORTS_PER_SOL;
        const tokenPrice = priceInSol / amountInTokens; // SOL per token
        const volume = amountInTokens; // Volume is token quantity

        if (!ohlcvMap.has(bucketTime)) {
          ohlcvMap.set(bucketTime, {
            time: bucketTime,
            open: tokenPrice,
            high: tokenPrice,
            low: tokenPrice,
            close: tokenPrice,
            volume: 0,
          });
        }

        const candle = ohlcvMap.get(bucketTime)!;
        candle.high = Math.max(candle.high, tokenPrice);
        candle.low = Math.min(candle.low, tokenPrice);
        candle.close = tokenPrice;
        candle.volume += volume;
      });

      // Convert map to array and sort by time
      let ohlcvData = Array.from(ohlcvMap.values()).sort(
        (a, b) => a.time - b.time,
      );

      // Limit the number of candles
      if (ohlcvData.length > limit) {
        ohlcvData = ohlcvData.slice(-limit);
      }

      return ohlcvData;
    } catch (error) {
      console.error('Error getting pool OHLCV:', error);
      return [];
    }
  }

  /**
   * Get pool holders
   * @param pool - Pool address
   * @param limit - Maximum number of holders to return
   */
  async getPoolHolders(pool: string, limit: number = 100): Promise<any> {
    try {
      // Calculate total supply using SQL aggregation
      const totalSupplyResult = await db
        .select({
          totalSupply: sql<number>`
            (SUM(CASE WHEN ${orders.side} = 'buy' THEN ${orders.amount} ELSE 0 END) - 
             SUM(CASE WHEN ${orders.side} = 'sell' THEN ${orders.amount} ELSE 0 END)) / ${LAMPORTS_PER_SOL}
          `,
        })
        .from(orders)
        .where(eq(orders.pool, pool));

      const totalSupply = Number(totalSupplyResult[0]?.totalSupply || 0);

      if (totalSupply <= 0) {
        return {
          totalSupply: 0,
          holders: [],
        };
      }

      // Calculate holdings for each user using SQL aggregation
      const holdersResult = await db
        .select({
          address: orders.user,
          holding: sql<number>`
            (SUM(CASE WHEN ${orders.side} = 'buy' THEN ${orders.amount} ELSE 0 END) - 
             SUM(CASE WHEN ${orders.side} = 'sell' THEN ${orders.amount} ELSE 0 END)) / ${LAMPORTS_PER_SOL}
          `,
        })
        .from(orders)
        .where(eq(orders.pool, pool))
        .groupBy(orders.user)
        .having(
          sql`(SUM(CASE WHEN ${orders.side} = 'buy' THEN ${orders.amount} ELSE 0 END) - 
               SUM(CASE WHEN ${orders.side} = 'sell' THEN ${orders.amount} ELSE 0 END)) > 0`,
        )
        .orderBy(
          sql`(SUM(CASE WHEN ${orders.side} = 'buy' THEN ${orders.amount} ELSE 0 END) - 
               SUM(CASE WHEN ${orders.side} = 'sell' THEN ${orders.amount} ELSE 0 END)) DESC`,
        )
        .limit(limit);

      // Calculate percentage for each holder
      const holders = holdersResult.map((holder) => ({
        address: holder.address,
        holding: Number(holder.holding),
        percentage:
          totalSupply > 0 ? (Number(holder.holding) / totalSupply) * 100 : 0,
      }));

      return {
        totalSupply,
        holders,
      };
    } catch (error) {
      console.error('Error getting pool holders:', error);
      return {
        totalSupply: 0,
        holders: [],
      };
    }
  }

  async getHotDevs(page = 1, limit = 10) {
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const offset = (pageNum - 1) * limitNum;

    const result = await db
      .select({
        id: users.id,
        githubLogin: users.githubLogin,
        githubRepositoriesCount: users.githubRepositoriesCount,
        githubStars: users.githubStars,
        githubFollowers: users.githubFollowers,
        githubName: users.githubName,
      })
      .from(users)
      .where(gt(users.githubRepositoriesCount, 0))
      .orderBy(
        sql`${users}.${sql.identifier('github_stars')} ${sql.raw('desc')}`,
      )
      .limit(limitNum)
      .offset(offset);

    const total = await db.select({ count: sql<number>`count(*)` }).from(users);

    return {
      data: result,
      pagination: {
        current: pageNum,
        pageSize: limitNum,
        total: total[0].count,
      },
    };
  }
}

function getPrice(supply: number) {
  if (supply <= LAMPORTS_PER_SOL) {
    return 0;
  }
  const supplyBN = new BN(supply);
  const creatorPremint = new BN(LAMPORTS_PER_SOL);
  const amountBN = new BN(LAMPORTS_PER_SOL);

  const supplyMinusCreatorPremint = supplyBN.sub(creatorPremint);
  const supplyMinusCreatorPremintPlusAmount =
    supplyMinusCreatorPremint.add(amountBN);

  const price = supplyMinusCreatorPremintPlusAmount
    .mul(supplyMinusCreatorPremintPlusAmount)
    .sub(supplyMinusCreatorPremint.mul(supplyMinusCreatorPremint))
    .div(new BN(LAMPORTS_PER_SOL))
    .div(new BN(5000));

  const priceNumber = price.toNumber() / LAMPORTS_PER_SOL;
  return priceNumber;
}
