import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Connection } from '@solana/web3.js';
import { db } from '../db/db';
import { slotTracking } from '../db/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class HealthCheckService {
  private readonly logger = new Logger(HealthCheckService.name);
  private connection: Connection;

  constructor() {
    this.connection = new Connection(
      process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
    );
  }

  /**
   * Check blockchain sync status every 5 minutes
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async checkBlockchainSync() {
    try {
      const lastProcessedSlot = await this.getLastProcessedSlot();
      const currentSlot = await this.connection.getSlot();
      const gap = currentSlot - lastProcessedSlot;

      this.logger.log(
        `Sync status: Last processed ${lastProcessedSlot}, Current ${currentSlot}, Gap: ${gap}`,
      );

      if (gap > 1000) {
        this.logger.warn(`Large gap detected: ${gap} slots behind`);
        // Trigger backfill if gap is too large
        await this.triggerBackfill();
      }
    } catch (error) {
      this.logger.error('Error checking blockchain sync:', error);
    }
  }

  /**
   * Check for stuck processing every 10 minutes
   */
  @Cron(CronExpression.EVERY_10_MINUTES)
  async checkForStuckProcessing() {
    try {
      const tracking = await db.query.slotTracking.findFirst({
        where: eq(slotTracking.programId, 'cathedral'),
      });

      if (tracking && tracking.lastProcessedTimestamp) {
        const timeSinceLastUpdate =
          Date.now() - tracking.lastProcessedTimestamp.getTime();
        const tenMinutes = 10 * 60 * 1000;

        if (timeSinceLastUpdate > tenMinutes) {
          this.logger.warn(
            `No events processed for ${Math.round(
              timeSinceLastUpdate / 1000 / 60,
            )} minutes`,
          );
          // Could trigger alert or restart listening here
        }
      }
    } catch (error) {
      this.logger.error('Error checking for stuck processing:', error);
    }
  }

  /**
   * Get sync status for API endpoint
   */
  async getSyncStatus() {
    try {
      const lastProcessedSlot = await this.getLastProcessedSlot();
      const currentSlot = await this.connection.getSlot();
      const gap = currentSlot - lastProcessedSlot;

      return {
        lastProcessedSlot,
        currentSlot,
        gap,
        isHealthy: gap < 1000,
        lastUpdate: new Date(),
      };
    } catch (error) {
      this.logger.error('Error getting sync status:', error);
      return {
        error: 'Failed to get sync status',
        lastUpdate: new Date(),
      };
    }
  }

  private async getLastProcessedSlot(): Promise<number> {
    try {
      const tracking = await db.query.slotTracking.findFirst({
        where: eq(slotTracking.programId, 'cathedral'),
      });
      return tracking?.lastProcessedSlot || 0;
    } catch (error) {
      this.logger.error('Error getting last processed slot:', error);
      return 0;
    }
  }

  private async triggerBackfill() {
    // This would trigger the backfill service
    // Implementation depends on how you want to integrate with the repositories service
    this.logger.log('Triggering backfill due to large gap');
  }
}
