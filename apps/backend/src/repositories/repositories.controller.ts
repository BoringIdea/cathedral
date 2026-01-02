import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
  Request,
  Post,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
  ApiConsumes,
} from '@nestjs/swagger';
import { RepositoriesService } from './repositories.service';
import { AuthGuard } from '../auth/auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import {
  GetRepositoriesQueryDto,
  RepositoryDto,
  PoolInfoDto,
  OrderDto,
  PoolOverviewDto,
  UserHoldingDto,
} from '../dto/repositories.dto';
import { ApiResponseDto } from '../dto/api-response.dto';

@ApiTags('repositories')
@Controller('repositories')
export class RepositoriesController {
  constructor(private readonly repositoriesService: RepositoriesService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all repositories',
    description:
      'Get paginated list of repositories with sorting and filtering options',
  })
  @ApiResponse({
    status: 200,
    description: 'Repositories retrieved successfully',
    type: ApiResponseDto<RepositoryDto[]>,
  })
  async getAllRepositories(
    @Query() query: GetRepositoriesQueryDto,
  ): Promise<any> {
    return this.repositoriesService.getRepositories(query);
  }

  @Get('count')
  @ApiOperation({
    summary: 'Get total repositories count',
    description: 'Get the total number of repositories in the system',
  })
  @ApiResponse({
    status: 200,
    description: 'Total count retrieved successfully',
    type: ApiResponseDto<number>,
  })
  async getTotalRepositories(): Promise<any> {
    return this.repositoriesService.getTotalRepositories();
  }

  @Get('search')
  @ApiOperation({
    summary: 'Search repositories',
    description: 'Search repositories by name or description',
  })
  @ApiQuery({ name: 'item', description: 'Search term', example: 'react' })
  @ApiResponse({
    status: 200,
    description: 'Search results retrieved successfully',
    type: ApiResponseDto<RepositoryDto[]>,
  })
  async searchRepositories(@Query('item') item: string): Promise<any> {
    if (!item || item.trim() === '') {
      return [];
    }
    return this.repositoriesService.searchRepositories(item);
  }

  @Get('recommend')
  @ApiOperation({
    summary: 'Get recommended repository',
    description: 'Get a recommended repository for the homepage',
  })
  @ApiResponse({
    status: 200,
    description: 'Recommended repository retrieved successfully',
    type: ApiResponseDto<RepositoryDto>,
  })
  async getRecommendRepository(): Promise<any> {
    return this.repositoriesService.getRecommendRepository();
  }

  @Get('trending')
  @ApiOperation({
    summary: 'Get trending repositories',
    description: 'Get repositories sorted by stars (trending)',
  })
  @ApiResponse({
    status: 200,
    description: 'Trending repositories retrieved successfully',
    type: ApiResponseDto<RepositoryDto[]>,
  })
  async getHotRepositories(): Promise<any> {
    return this.repositoriesService.getReposByStars();
  }

  @Get('developers')
  @ApiOperation({
    summary: 'Get trending developers',
    description: 'Get list of trending developers',
  })
  @ApiResponse({
    status: 200,
    description: 'Trending developers retrieved successfully',
    type: ApiResponseDto<any>,
  })
  async getHotDevs(): Promise<any> {
    return this.repositoriesService.getHotDevs();
  }

  @Get('recent')
  @ApiOperation({
    summary: 'Get recently listed repositories',
    description: 'Get repositories that were recently added to the platform',
  })
  @ApiResponse({
    status: 200,
    description: 'Recently listed repositories retrieved successfully',
    type: ApiResponseDto<RepositoryDto[]>,
  })
  async getJustListedRepositories(): Promise<any> {
    return this.repositoriesService.getJustlisted();
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({
    summary: 'Upload repository image',
    description: 'Upload an image for a repository',
  })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: 200,
    description: 'Image uploaded successfully',
    type: ApiResponseDto<{ success: boolean; data?: string; error?: string }>,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid file or upload failed',
  })
  async uploadImage(@UploadedFile() file: Express.Multer.File): Promise<any> {
    try {
      const result = await this.repositoriesService.uploadImage(file);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get repository by ID',
    description: 'Get detailed information about a specific repository',
  })
  @ApiParam({ name: 'id', description: 'Repository ID', example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Repository details retrieved successfully',
    type: ApiResponseDto<RepositoryDto>,
  })
  @ApiResponse({
    status: 404,
    description: 'Repository not found',
  })
  async getRepositoryById(@Param('id') id: number): Promise<any> {
    return this.repositoriesService.getRepositoryById(id);
  }

  @Get(':id/pool')
  @ApiOperation({
    summary: 'Get pool by repository ID',
    description: 'Get pool information for a specific repository',
  })
  @ApiParam({ name: 'id', description: 'Repository ID', example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Pool information retrieved successfully',
    type: ApiResponseDto<PoolInfoDto>,
  })
  @ApiResponse({
    status: 404,
    description: 'Repository or pool not found',
  })
  async getPoolByRepositoryId(@Param('id') id: number): Promise<any> {
    return this.repositoriesService.getPoolByRepositoryId(id);
  }

  @Get('pools/:pool/orders')
  @ApiOperation({
    summary: 'Get orders by pool',
    description: 'Get all orders for a specific pool',
  })
  @ApiParam({
    name: 'pool',
    description: 'Pool address',
    example: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
  })
  @ApiResponse({
    status: 200,
    description: 'Orders retrieved successfully',
    type: ApiResponseDto<OrderDto[]>,
  })
  async getOrdersByPool(@Param('pool') pool: string): Promise<any> {
    return this.repositoriesService.getOrdersByPool(pool);
  }

  @Get('pools/:pool/overview')
  @ApiOperation({
    summary: 'Get pool overview',
    description: 'Get overview statistics for a specific pool',
  })
  @ApiParam({
    name: 'pool',
    description: 'Pool address',
    example: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
  })
  @ApiResponse({
    status: 200,
    description: 'Pool overview retrieved successfully',
    type: ApiResponseDto<PoolOverviewDto>,
  })
  async getPoolOverview(@Param('pool') pool: string): Promise<any> {
    return this.repositoriesService.getPoolOverview(pool);
  }

  @Get('pools/:pool/ohlcv')
  @ApiOperation({
    summary: 'Get pool OHLCV data',
    description:
      'Get OHLCV (Open, High, Low, Close, Volume) candlestick data for a specific pool',
  })
  @ApiParam({
    name: 'pool',
    description: 'Pool address',
    example: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
  })
  @ApiQuery({
    name: 'interval',
    description: 'Time interval for candles',
    example: '5m',
    required: false,
    enum: ['1m', '5m', '15m', '30m', '1h', '4h', '1d'],
  })
  @ApiQuery({
    name: 'limit',
    description: 'Maximum number of candles to return',
    example: 1000,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'OHLCV data retrieved successfully',
  })
  async getPoolOHLCV(
    @Param('pool') pool: string,
    @Query('interval') interval?: string,
    @Query('limit') limit?: number,
  ): Promise<any> {
    return this.repositoriesService.getPoolOHLCV(
      pool,
      interval || '5m',
      limit || 1000,
    );
  }

  @Get('pools/:pool/holders')
  @ApiOperation({
    summary: 'Get pool holders',
    description:
      'Get top holders for a specific pool with their holdings and percentages',
  })
  @ApiParam({
    name: 'pool',
    description: 'Pool address',
    example: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
  })
  @ApiQuery({
    name: 'limit',
    description: 'Maximum number of holders to return',
    example: 100,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Pool holders retrieved successfully',
  })
  async getPoolHolders(
    @Param('pool') pool: string,
    @Query('limit') limit?: number,
  ): Promise<any> {
    return this.repositoriesService.getPoolHolders(pool, limit || 100);
  }

  @Get('users/me/deployed')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get deployed repositories by current user',
    description: 'Get repositories deployed by the authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'Deployed repositories retrieved successfully',
    type: ApiResponseDto<RepositoryDto[]>,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async getDeployedRepositories(@Request() req): Promise<any> {
    return this.repositoriesService.getUserDeployedRepositories(
      req.user.user_name,
    );
  }

  @Get('users/:address/holdings')
  @ApiOperation({
    summary: 'Get user holdings',
    description: 'Get repositories held by a specific wallet address',
  })
  @ApiParam({
    name: 'address',
    description: 'Wallet address',
    example: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
  })
  @ApiResponse({
    status: 200,
    description: 'User holdings retrieved successfully',
    type: ApiResponseDto<UserHoldingDto[]>,
  })
  async getUserHoldings(@Param('address') address: string): Promise<any> {
    return this.repositoriesService.getUserHoldingRepositories(address);
  }
}
