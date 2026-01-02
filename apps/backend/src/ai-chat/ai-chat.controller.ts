import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { AIChatService } from './ai-chat.service';
import { AnalysisCacheService } from './analysis-cache.service';
import {
  ChatMessageDto,
  ChatResponseDto,
  RepositoryAnalysisDto,
} from './dto/ai-chat.dto';
import { ApiResponseDto } from '../dto/api-response.dto';

@ApiTags('ai-chat')
@Controller('ai-chat')
export class AIChatController {
  constructor(
    private readonly aiChatService: AIChatService,
    private readonly analysisCacheService: AnalysisCacheService,
  ) {}

  @Post('chat')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Send message to AI chat',
    description:
      'Send a message to the AI chat and get a response about the repository',
  })
  @ApiBody({ type: ChatMessageDto })
  @ApiResponse({
    status: 200,
    description: 'AI response generated successfully',
    type: ApiResponseDto<ChatResponseDto>,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request data',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async chat(
    @Body() chatMessage: ChatMessageDto,
  ): Promise<ApiResponseDto<ChatResponseDto>> {
    try {
      const response = await this.aiChatService.chatWithAI(chatMessage);
      return {
        success: true,
        data: response,
        message: 'AI response generated successfully',
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error.message || 'Failed to generate AI response',
      };
    }
  }

  @Get('analyze/:repositoryId')
  @ApiOperation({
    summary: 'Get repository analysis',
    description:
      'Get comprehensive AI analysis of a repository for investment decision making',
  })
  @ApiParam({
    name: 'repositoryId',
    description: 'Repository ID to analyze',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Repository analysis retrieved successfully',
    type: ApiResponseDto<RepositoryAnalysisDto>,
  })
  @ApiResponse({
    status: 404,
    description: 'Repository not found',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async analyzeRepository(
    @Param('repositoryId') repositoryId: number,
  ): Promise<ApiResponseDto<RepositoryAnalysisDto>> {
    try {
      const analysis = await this.aiChatService.analyzeRepository(repositoryId);
      return {
        success: true,
        data: analysis,
        message: 'Repository analysis completed successfully',
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error.message || 'Failed to analyze repository',
      };
    }
  }

  @Post('analyze-technical/:repositoryId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get technical analysis of repository',
    description:
      'Get detailed technical analysis focusing on technology stack and development quality',
  })
  @ApiParam({
    name: 'repositoryId',
    description: 'Repository ID to analyze',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Technical analysis completed successfully',
    type: ApiResponseDto<ChatResponseDto>,
  })
  @ApiResponse({
    status: 404,
    description: 'Repository not found',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async analyzeTechnical(
    @Param('repositoryId')
    repositoryId: number,
  ): Promise<ApiResponseDto<ChatResponseDto>> {
    try {
      const analysis = await this.aiChatService.analyzeRepositoryTechnical(
        repositoryId,
      );
      return {
        success: true,
        data: analysis,
        message: 'Technical analysis completed successfully',
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error.message || 'Failed to perform technical analysis',
      };
    }
  }

  @Post('analyze-investment/:repositoryId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get investment analysis of repository',
    description:
      'Get detailed investment analysis focusing on market potential and investment value',
  })
  @ApiParam({
    name: 'repositoryId',
    description: 'Repository ID to analyze',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Investment analysis completed successfully',
    type: ApiResponseDto<ChatResponseDto>,
  })
  @ApiResponse({
    status: 404,
    description: 'Repository not found',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async analyzeInvestment(
    @Param('repositoryId')
    repositoryId: number,
  ): Promise<ApiResponseDto<ChatResponseDto>> {
    try {
      const analysis = await this.aiChatService.analyzeRepositoryInvestment(
        repositoryId,
      );
      return {
        success: true,
        data: analysis,
        message: 'Investment analysis completed successfully',
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error.message || 'Failed to perform investment analysis',
      };
    }
  }

  @Post('analyze-community/:repositoryId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get community analysis of repository',
    description:
      'Get detailed community analysis focusing on community health and developer activity',
  })
  @ApiParam({
    name: 'repositoryId',
    description: 'Repository ID to analyze',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Community analysis completed successfully',
    type: ApiResponseDto<ChatResponseDto>,
  })
  @ApiResponse({
    status: 404,
    description: 'Repository not found',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async analyzeCommunity(
    @Param('repositoryId')
    repositoryId: number,
  ): Promise<ApiResponseDto<ChatResponseDto>> {
    try {
      const analysis = await this.aiChatService.analyzeRepositoryCommunity(
        repositoryId,
      );
      return {
        success: true,
        data: analysis,
        message: 'Community analysis completed successfully',
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error.message || 'Failed to perform community analysis',
      };
    }
  }

  @Post('analyze-risk/:repositoryId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get risk analysis of repository',
    description:
      'Get detailed risk analysis focusing on potential risks and concerns',
  })
  @ApiParam({
    name: 'repositoryId',
    description: 'Repository ID to analyze',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Risk analysis completed successfully',
    type: ApiResponseDto<ChatResponseDto>,
  })
  @ApiResponse({
    status: 404,
    description: 'Repository not found',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async analyzeRisk(
    @Param('repositoryId')
    repositoryId: number,
  ): Promise<ApiResponseDto<ChatResponseDto>> {
    try {
      const analysis = await this.aiChatService.analyzeRepositoryRisk(
        repositoryId,
      );
      return {
        success: true,
        data: analysis,
        message: 'Risk analysis completed successfully',
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error.message || 'Failed to perform risk analysis',
      };
    }
  }

  @Get('cache/stats')
  @ApiOperation({
    summary: 'Get cache statistics',
    description: 'Get statistics about the analysis cache',
  })
  @ApiResponse({
    status: 200,
    description: 'Cache statistics retrieved successfully',
  })
  getCacheStats() {
    return {
      analysis: this.analysisCacheService.getCacheStats(),
      templates: this.analysisCacheService.getTemplateCacheStats(),
    };
  }

  @Get('cache/template-stats')
  @ApiOperation({
    summary: 'Get template cache statistics',
    description: 'Get statistics about the template analysis cache',
  })
  @ApiResponse({
    status: 200,
    description: 'Template cache statistics retrieved successfully',
  })
  getTemplateCacheStats() {
    return this.analysisCacheService.getTemplateCacheStats();
  }

  @Delete('cache/:repositoryId')
  @ApiOperation({
    summary: 'Clear cache for specific repository',
    description: 'Clear cached analysis for a specific repository',
  })
  @ApiParam({
    name: 'repositoryId',
    type: 'number',
    description: 'Repository ID to clear cache for',
  })
  @ApiResponse({
    status: 200,
    description: 'Cache cleared successfully',
  })
  clearRepositoryCache(@Param('repositoryId') repositoryId: number) {
    this.analysisCacheService.clearRepositoryCache(repositoryId);
    this.analysisCacheService.clearRepositoryTemplateCache(repositoryId);
    return {
      success: true,
      message: `Cache cleared for repository ${repositoryId}`,
    };
  }

  @Delete('cache/templates/:repositoryId')
  @ApiOperation({
    summary: 'Clear template cache for specific repository',
    description: 'Clear cached template analysis for a specific repository',
  })
  @ApiParam({
    name: 'repositoryId',
    type: 'number',
    description: 'Repository ID to clear template cache for',
  })
  @ApiResponse({
    status: 200,
    description: 'Template cache cleared successfully',
  })
  clearRepositoryTemplateCache(@Param('repositoryId') repositoryId: number) {
    this.analysisCacheService.clearRepositoryTemplateCache(repositoryId);
    return {
      success: true,
      message: `Template cache cleared for repository ${repositoryId}`,
    };
  }

  @Delete('cache')
  @ApiOperation({
    summary: 'Clear all cache',
    description: 'Clear all cached analysis data',
  })
  @ApiResponse({
    status: 200,
    description: 'All cache cleared successfully',
  })
  clearAllCache() {
    this.analysisCacheService.clearAllCache();
    this.analysisCacheService.clearAllTemplateCache();
    return {
      success: true,
      message: 'All cache cleared successfully',
    };
  }

  @Delete('cache/templates')
  @ApiOperation({
    summary: 'Clear all template cache',
    description: 'Clear all cached template analysis data',
  })
  @ApiResponse({
    status: 200,
    description: 'All template cache cleared successfully',
  })
  clearAllTemplateCache() {
    this.analysisCacheService.clearAllTemplateCache();
    return {
      success: true,
      message: 'All template cache cleared successfully',
    };
  }

  @Post('cache/cleanup')
  @ApiOperation({
    summary: 'Clean up expired cache entries',
    description: 'Remove expired cache entries to free up memory',
  })
  @ApiResponse({
    status: 200,
    description: 'Cache cleanup completed',
  })
  cleanupExpiredCache() {
    const cleanedCount = this.analysisCacheService.cleanupExpiredCache();
    const templateCleanedCount =
      this.analysisCacheService.cleanupExpiredTemplateCache();
    return {
      success: true,
      message: `Cleaned up ${cleanedCount} expired cache entries and ${templateCleanedCount} expired template cache entries`,
      cleanedCount,
      templateCleanedCount,
    };
  }

  @Post('cache/templates/cleanup')
  @ApiOperation({
    summary: 'Clean up expired template cache entries',
    description: 'Remove expired template cache entries to free up memory',
  })
  @ApiResponse({
    status: 200,
    description: 'Template cache cleanup completed',
  })
  cleanupExpiredTemplateCache() {
    const cleanedCount =
      this.analysisCacheService.cleanupExpiredTemplateCache();
    return {
      success: true,
      message: `Cleaned up ${cleanedCount} expired template cache entries`,
      cleanedCount,
    };
  }
}
