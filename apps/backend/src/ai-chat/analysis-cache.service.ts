import { Injectable } from '@nestjs/common';
import { RepositoryAnalysisDto, ChatResponseDto } from './dto/ai-chat.dto';

interface CachedAnalysis {
  analysis: RepositoryAnalysisDto;
  timestamp: number;
}

interface CachedTemplateAnalysis {
  analysis: ChatResponseDto;
  timestamp: number;
}

@Injectable()
export class AnalysisCacheService {
  private cache = new Map<number, CachedAnalysis>();
  private templateCache = new Map<string, CachedTemplateAnalysis>();
  private readonly CACHE_TTL = 10 * 60 * 1000; // 10 minutes

  /**
   * Get cached analysis if available and not expired
   */
  getCachedAnalysis(repositoryId: number): RepositoryAnalysisDto | null {
    const cached = this.cache.get(repositoryId);

    if (!cached) {
      console.log(`No cached analysis found for repository ${repositoryId}`);
      return null;
    }

    const now = Date.now();
    const age = now - cached.timestamp;

    // Check if cache is expired
    if (age > this.CACHE_TTL) {
      console.log(
        `Cache for repository ${repositoryId} has expired (age: ${Math.round(
          age / 1000 / 60,
        )} minutes)`,
      );
      this.cache.delete(repositoryId);
      return null;
    }

    console.log(
      `Using cached analysis for repository ${repositoryId} (age: ${Math.round(
        age / 1000 / 60,
      )} minutes)`,
    );

    return cached.analysis;
  }

  /**
   * Cache analysis result
   */
  cacheAnalysis(repositoryId: number, analysis: RepositoryAnalysisDto): void {
    this.cache.set(repositoryId, {
      analysis,
      timestamp: Date.now(),
    });
    console.log(`Cached analysis for repository ${repositoryId}`);
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    totalCached: number;
    oldestEntry: number;
    newestEntry: number;
    averageAge: number;
  } {
    this.cleanupExpiredCache(); // Clean up before returning stats
    const entries = Array.from(this.cache.values());

    if (entries.length === 0) {
      return {
        totalCached: 0,
        oldestEntry: 0,
        newestEntry: 0,
        averageAge: 0,
      };
    }

    const timestamps = entries.map((entry) => entry.timestamp);
    const now = Date.now();

    return {
      totalCached: entries.length,
      oldestEntry: Math.max(...timestamps.map((ts) => now - ts)),
      newestEntry: Math.min(...timestamps.map((ts) => now - ts)),
      averageAge:
        timestamps.reduce((sum, ts) => sum + (now - ts), 0) / timestamps.length,
    };
  }

  /**
   * Clear cache for a specific repository
   */
  clearRepositoryCache(repositoryId: number): void {
    this.cache.delete(repositoryId);
    console.log(`Cleared cache for repository ${repositoryId}`);
  }

  /**
   * Clear all cache
   */
  clearAllCache(): void {
    this.cache.clear();
    console.log('Cleared all analysis cache');
  }

  /**
   * Clean up expired cache entries
   */
  cleanupExpiredCache(): number {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [repositoryId, cached] of this.cache.entries()) {
      if (now - cached.timestamp > this.CACHE_TTL) {
        this.cache.delete(repositoryId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`Cleaned up ${cleanedCount} expired cache entries`);
    }

    return cleanedCount;
  }

  /**
   * Get cached template analysis if available and not expired
   */
  getCachedTemplateAnalysis(
    repositoryId: number,
    analysisType: string,
  ): ChatResponseDto | null {
    const cacheKey = `${repositoryId}-${analysisType}`;
    const cached = this.templateCache.get(cacheKey);

    if (!cached) {
      console.log(
        `No cached template analysis found for repository ${repositoryId}, type ${analysisType}`,
      );
      return null;
    }

    const now = Date.now();
    const age = now - cached.timestamp;

    // Check if cache is expired
    if (age > this.CACHE_TTL) {
      console.log(
        `Template cache for repository ${repositoryId}, type ${analysisType} has expired (age: ${Math.round(
          age / 1000 / 60,
        )} minutes)`,
      );
      this.templateCache.delete(cacheKey);
      return null;
    }

    console.log(
      `Using cached template analysis for repository ${repositoryId}, type ${analysisType} (age: ${Math.round(
        age / 1000 / 60,
      )} minutes)`,
    );

    return cached.analysis;
  }

  /**
   * Cache template analysis result
   */
  cacheTemplateAnalysis(
    repositoryId: number,
    analysisType: string,
    analysis: ChatResponseDto,
  ): void {
    const cacheKey = `${repositoryId}-${analysisType}`;
    this.templateCache.set(cacheKey, {
      analysis,
      timestamp: Date.now(),
    });
    console.log(
      `Cached template analysis for repository ${repositoryId}, type ${analysisType}`,
    );
  }

  /**
   * Get template cache statistics
   */
  getTemplateCacheStats(): {
    totalCached: number;
    oldestEntry: number;
    newestEntry: number;
    averageAge: number;
  } {
    this.cleanupExpiredTemplateCache(); // Clean up before returning stats
    const entries = Array.from(this.templateCache.values());

    if (entries.length === 0) {
      return {
        totalCached: 0,
        oldestEntry: 0,
        newestEntry: 0,
        averageAge: 0,
      };
    }

    const timestamps = entries.map((entry) => entry.timestamp);
    const now = Date.now();

    return {
      totalCached: entries.length,
      oldestEntry: Math.max(...timestamps.map((ts) => now - ts)),
      newestEntry: Math.min(...timestamps.map((ts) => now - ts)),
      averageAge:
        timestamps.reduce((sum, ts) => sum + (now - ts), 0) / timestamps.length,
    };
  }

  /**
   * Clear template cache for a specific repository
   */
  clearRepositoryTemplateCache(repositoryId: number): void {
    const keysToDelete: string[] = [];
    for (const key of this.templateCache.keys()) {
      if (key.startsWith(`${repositoryId}-`)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => this.templateCache.delete(key));
    console.log(
      `Cleared template cache for repository ${repositoryId} (${keysToDelete.length} entries)`,
    );
  }

  /**
   * Clear all template cache
   */
  clearAllTemplateCache(): void {
    this.templateCache.clear();
    console.log('Cleared all template analysis cache');
  }

  /**
   * Clean up expired template cache entries
   */
  cleanupExpiredTemplateCache(): number {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [cacheKey, cached] of this.templateCache.entries()) {
      if (now - cached.timestamp > this.CACHE_TTL) {
        this.templateCache.delete(cacheKey);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`Cleaned up ${cleanedCount} expired template cache entries`);
    }

    return cleanedCount;
  }
}
