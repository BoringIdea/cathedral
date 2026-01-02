import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import axios from 'axios';
import { db } from '../db/db';
import { repositories } from '../db/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class CornService {
  @Cron(CronExpression.EVERY_10_MINUTES)
  async updateRepositoriesStats() {
    console.log('Starting repository stats update...');

    const pageSize = 50;
    let currentPage = 0;
    let hasMore = true;

    while (hasMore) {
      const repos = await db.query.repositories.findMany({
        limit: pageSize,
        offset: currentPage * pageSize,
      });

      if (repos.length === 0) {
        break;
      }

      if (repos.length < pageSize) {
        hasMore = false;
      }

      for (const repo of repos) {
        try {
          const response = await axios.get(
            `https://api.github.com/repos/${repo.owner}/${repo.name}`,
          );

          if (
            Number(response.data.stargazers_count) === Number(repo.stars) &&
            Number(response.data.forks_count) === Number(repo.forks) &&
            response.data.private == false
          ) {
            continue;
          }
          const isDeleted = response.data.private;
          await db
            .update(repositories)
            .set({
              stars: response.data.stargazers_count,
              forks: response.data.forks_count,
              isDeleted: isDeleted,
              updatedAt: new Date(),
            })
            .where(eq(repositories.id, repo.id as number));

          console.log(`Updated stats for ${repo.owner}/${repo.name}`);
        } catch (error) {
          if (error.response?.status === 404) {
            await db
              .update(repositories)
              .set({ isDeleted: true, updatedAt: new Date() })
              .where(eq(repositories.id, repo.id as number));
          }
          console.error(
            `Failed to update stats for ${repo.owner}/${repo.name}:`,
            error,
          );
        }
      }
      console.log(`Completed page ${currentPage}`);
      currentPage++;
    }

    console.log('Finished repository stats update');
  }
}
