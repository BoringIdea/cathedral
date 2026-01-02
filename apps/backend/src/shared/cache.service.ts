import { Injectable, Scope } from '@nestjs/common';
import { db } from '../db/db';
import { repositories } from '../db/schema';
import { eq } from 'drizzle-orm';

@Injectable({ scope: Scope.DEFAULT }) // Ensure it is a singleton
export class CacheService {
  private static instance: CacheService;
  private static repositoriesCache: Map<
    string,
    { data: any[]; timestamp: number }
  > = new Map();
  private static removeLocks: Map<string, boolean> = new Map();

  constructor() {
    if (!CacheService.instance) {
      CacheService.instance = this;
    }
    return CacheService.instance;
  }

  private readonly cacheTTL = 86400 * 1000;
  private readonly emptyResultsTTL = 3600 * 1000;

  async storeRepositories(userLogin: string, repos: any[]) {
    // Get repositories that already exist in the database
    const existingRepos = await db.query.repositories.findMany({
      where: eq(repositories.owner, userLogin),
    });

    // Get list of existing repository links
    const existingRepoLinks = new Set(existingRepos.map((repo) => repo.link));

    // Filter out repositories that already exist in the database
    const filteredRepos = repos.filter(
      (repo) => !existingRepoLinks.has(repo.html_url),
    );

    // Only cache repositories that are not stored in the database
    const repositoriesData = filteredRepos.map((repo) => ({
      id: repo.id,
      link: repo.html_url,
      name: repo.name,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      owner: repo.owner.login,
      description: repo.description,
    }));

    const key = `user:${userLogin}:repositories`;
    CacheService.repositoriesCache.set(key, {
      data: repositoriesData,
      timestamp: Date.now(),
    });
    return CacheService.repositoriesCache.get(key);
  }

  getRepositories(key: string) {
    return CacheService.repositoriesCache.get(key);
  }

  setRepositories(key: string, data: any[], timestamp: number = Date.now()) {
    CacheService.repositoriesCache.set(key, { data, timestamp }); // Use instance property
  }

  getCacheTTL(): number {
    return this.cacheTTL;
  }

  getEmptyResultsTTL(): number {
    return this.emptyResultsTTL;
  }

  async removeRepositoryFromCache(
    userLogin: string,
    repoName: string,
  ): Promise<boolean> {
    const lockKey = `${userLogin}:${repoName}`;

    if (CacheService.removeLocks.get(lockKey)) {
      // Use instance property
      return false;
    }

    try {
      CacheService.removeLocks.set(lockKey, true); // Use instance property

      const key = `user:${userLogin}:repositories`;
      const cachedEntry = CacheService.repositoriesCache.get(key); // Use instance property

      if (!cachedEntry) {
        return false;
      }

      const initialLength = cachedEntry.data.length;
      const updatedData = cachedEntry.data.filter(
        (repo) => repo.name !== repoName,
      );

      if (updatedData.length === initialLength) {
        return false;
      }

      CacheService.repositoriesCache.set(key, {
        // Use instance property
        data: updatedData,
        timestamp: cachedEntry.timestamp,
      });

      return true;
    } finally {
      CacheService.removeLocks.delete(lockKey); // Use instance property
    }
  }
}
