import { Controller, Get, Post, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthCheckService } from '../services/health-check.service';
import { RepositoriesService } from '../repositories/repositories.service';

@ApiTags('Admin')
@Controller('admin')
export class AdminController {
  constructor(
    private readonly healthCheckService: HealthCheckService,
    private readonly repositoriesService: RepositoriesService,
  ) {}

  @Get('sync-status')
  @ApiOperation({ summary: 'Get blockchain sync status' })
  @ApiResponse({
    status: 200,
    description: 'Sync status retrieved successfully',
  })
  async getSyncStatus() {
    return await this.healthCheckService.getSyncStatus();
  }

  @Post('backfill/:fromSlot/:toSlot')
  @ApiOperation({ summary: 'Trigger manual backfill for specific slot range' })
  @ApiResponse({ status: 200, description: 'Backfill started successfully' })
  async triggerBackfill(
    @Param('fromSlot') fromSlot: string,
    @Param('toSlot') toSlot: string,
  ) {
    const from = parseInt(fromSlot);
    const to = parseInt(toSlot);

    if (isNaN(from) || isNaN(to) || from >= to) {
      return { error: 'Invalid slot range' };
    }

    try {
      await this.repositoriesService.triggerManualBackfill(from, to);
      return {
        success: true,
        message: `Backfill completed from slot ${from} to ${to}`,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Post('backfill/check')
  @ApiOperation({ summary: 'Check for gaps and trigger backfill if needed' })
  @ApiResponse({ status: 200, description: 'Gap check completed' })
  async checkAndBackfill() {
    try {
      await this.repositoriesService.triggerCheckAndBackfill();
      return {
        success: true,
        message: 'Gap check completed',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Post('backfill/full/:fromSlot')
  @ApiOperation({ summary: 'Full backfill from specific slot to current' })
  @ApiResponse({ status: 200, description: 'Full backfill started' })
  async fullBackfill(@Param('fromSlot') fromSlot: string) {
    const from = parseInt(fromSlot);

    if (isNaN(from)) {
      return { error: 'Invalid from slot' };
    }

    try {
      const currentSlot = await this.repositoriesService.getCurrentSlot();
      await this.repositoriesService.triggerManualBackfill(from, currentSlot);
      return {
        success: true,
        message: `Full backfill completed from slot ${from} to ${currentSlot}`,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
