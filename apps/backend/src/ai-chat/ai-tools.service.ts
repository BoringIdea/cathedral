import { Injectable } from '@nestjs/common';
import { tool } from 'ai';
import { z } from 'zod';
import { GitHubToolsService } from './github-tools.service';

@Injectable()
export class AIToolsService {
  constructor(private readonly githubToolsService: GitHubToolsService) {}

  /**
   * Get repository details tool
   */
  getRepositoryDetailsTool() {
    return tool({
      description:
        'Get detailed information about a GitHub repository including stars, forks, description, and basic stats',
      inputSchema: z.object({
        owner: z
          .string()
          .describe('Repository owner (username or organization)'),
        repo: z.string().describe('Repository name'),
        githubLogin: z
          .string()
          .optional()
          .describe('GitHub login for authenticated requests'),
      }),
      execute: async ({ owner, repo }) => {
        try {
          console.log(`Tool: getRepositoryDetails called for ${owner}/${repo}`);
          // Always use null for githubLogin to force use of global GITHUB_TOKEN
          const result = await this.githubToolsService.getRepositoryDetails(
            owner,
            repo,
            null, // Force use of global GITHUB_TOKEN
          );
          console.log(
            `Tool: getRepositoryDetails completed for ${owner}/${repo}`,
          );
          return result;
        } catch (error) {
          console.error(
            `Tool: getRepositoryDetails failed for ${owner}/${repo}:`,
            error.message,
          );
          return { error: error.message };
        }
      },
    });
  }

  /**
   * Get repository commits tool
   */
  getRepositoryCommitsTool() {
    return tool({
      description:
        'Get recent commits from a GitHub repository to analyze development activity',
      inputSchema: z.object({
        owner: z.string().describe('Repository owner'),
        repo: z.string().describe('Repository name'),
        limit: z
          .number()
          .optional()
          .default(10)
          .describe('Number of commits to retrieve (max 100)'),
        githubLogin: z
          .string()
          .optional()
          .describe('GitHub login for authenticated requests'),
      }),
      execute: async ({ owner, repo, limit = 10 }) => {
        try {
          console.log(`Tool: getRepositoryCommits called for ${owner}/${repo}`);
          // Always use null for githubLogin to force use of global GITHUB_TOKEN
          const result = await this.githubToolsService.getRepositoryCommits(
            owner,
            repo,
            Math.min(limit, 100),
            null, // Force use of global GITHUB_TOKEN
          );
          console.log(
            `Tool: getRepositoryCommits completed for ${owner}/${repo}`,
          );
          return result;
        } catch (error) {
          console.error(
            `Tool: getRepositoryCommits failed for ${owner}/${repo}:`,
            error.message,
          );
          return { error: error.message };
        }
      },
    });
  }

  /**
   * Get repository issues tool
   */
  getRepositoryIssuesTool() {
    return tool({
      description:
        'Get recent issues from a GitHub repository to analyze community engagement and problem resolution',
      inputSchema: z.object({
        owner: z.string().describe('Repository owner'),
        repo: z.string().describe('Repository name'),
        state: z
          .enum(['open', 'closed', 'all'])
          .optional()
          .default('all')
          .describe('Issue state filter'),
        limit: z
          .number()
          .optional()
          .default(10)
          .describe('Number of issues to retrieve (max 100)'),
        githubLogin: z
          .string()
          .optional()
          .describe('GitHub login for authenticated requests'),
      }),
      execute: async ({ owner, repo, state = 'all', limit = 10 }) => {
        try {
          // Always use null for githubLogin to force use of global GITHUB_TOKEN
          const result = await this.githubToolsService.getRepositoryIssues(
            owner,
            repo,
            state,
            Math.min(limit, 100),
            null, // Force use of global GITHUB_TOKEN
          );
          return result;
        } catch (error) {
          return { error: error.message };
        }
      },
    });
  }

  /**
   * Get repository pull requests tool
   */
  getRepositoryPullRequestsTool() {
    return tool({
      description:
        'Get recent pull requests from a GitHub repository to analyze code review activity and collaboration',
      inputSchema: z.object({
        owner: z.string().describe('Repository owner'),
        repo: z.string().describe('Repository name'),
        state: z
          .enum(['open', 'closed', 'all'])
          .optional()
          .default('all')
          .describe('PR state filter'),
        limit: z
          .number()
          .optional()
          .default(10)
          .describe('Number of PRs to retrieve (max 100)'),
        githubLogin: z
          .string()
          .optional()
          .describe('GitHub login for authenticated requests'),
      }),
      execute: async ({ owner, repo, state = 'all', limit = 10 }) => {
        try {
          // Always use null for githubLogin to force use of global GITHUB_TOKEN
          const result =
            await this.githubToolsService.getRepositoryPullRequests(
              owner,
              repo,
              state,
              Math.min(limit, 100),
              null, // Force use of global GITHUB_TOKEN
            );
          return result;
        } catch (error) {
          return { error: error.message };
        }
      },
    });
  }

  /**
   * Get repository contributors tool
   */
  getRepositoryContributorsTool() {
    return tool({
      description:
        'Get contributors from a GitHub repository to analyze team size and developer activity',
      inputSchema: z.object({
        owner: z.string().describe('Repository owner'),
        repo: z.string().describe('Repository name'),
        limit: z
          .number()
          .optional()
          .default(10)
          .describe('Number of contributors to retrieve (max 100)'),
        githubLogin: z
          .string()
          .optional()
          .describe('GitHub login for authenticated requests'),
      }),
      execute: async ({ owner, repo, limit = 10 }) => {
        try {
          const result =
            await this.githubToolsService.getRepositoryContributors(
              owner,
              repo,
              Math.min(limit, 100),
              null, // Force use of global GITHUB_TOKEN
            );
          return result;
        } catch (error) {
          return { error: error.message };
        }
      },
    });
  }

  /**
   * Get repository languages tool
   */
  getRepositoryLanguagesTool() {
    return tool({
      description:
        'Get programming languages used in a GitHub repository to analyze tech stack',
      inputSchema: z.object({
        owner: z.string().describe('Repository owner'),
        repo: z.string().describe('Repository name'),
        githubLogin: z
          .string()
          .optional()
          .describe('GitHub login for authenticated requests'),
      }),
      execute: async ({ owner, repo }) => {
        try {
          const result = await this.githubToolsService.getRepositoryLanguages(
            owner,
            repo,
            null, // Force use of global GITHUB_TOKEN
          );
          return result;
        } catch (error) {
          return { error: error.message };
        }
      },
    });
  }

  /**
   * Get repository releases tool
   */
  getRepositoryReleasesTool() {
    return tool({
      description:
        'Get recent releases from a GitHub repository to analyze project maturity and release frequency',
      inputSchema: z.object({
        owner: z.string().describe('Repository owner'),
        repo: z.string().describe('Repository name'),
        limit: z
          .number()
          .optional()
          .default(5)
          .describe('Number of releases to retrieve (max 20)'),
        githubLogin: z
          .string()
          .optional()
          .describe('GitHub login for authenticated requests'),
      }),
      execute: async ({ owner, repo, limit = 5 }) => {
        try {
          const result = await this.githubToolsService.getRepositoryReleases(
            owner,
            repo,
            Math.min(limit, 20),
            null, // Force use of global GITHUB_TOKEN
          );
          return result;
        } catch (error) {
          return { error: error.message };
        }
      },
    });
  }

  /**
   * Get repository traffic tool
   */
  getRepositoryTrafficTool() {
    return tool({
      description:
        'Get traffic data (views, clones) from a GitHub repository to analyze popularity and usage',
      inputSchema: z.object({
        owner: z.string().describe('Repository owner'),
        repo: z.string().describe('Repository name'),
        githubLogin: z
          .string()
          .optional()
          .describe('GitHub login for authenticated requests'),
      }),
      execute: async ({ owner, repo }) => {
        try {
          const result = await this.githubToolsService.getRepositoryTraffic(
            owner,
            repo,
            null, // Force use of global GITHUB_TOKEN
          );
          return result;
        } catch (error) {
          return { error: error.message };
        }
      },
    });
  }

  /**
   * Test tool to verify tool calling works
   */
  getTestTool() {
    return tool({
      description: 'A simple test tool to verify tool calling functionality',
      inputSchema: z.object({
        message: z.string().describe('Test message'),
      }),
      execute: async ({ message }) => {
        console.log('Test tool called with message:', message);
        return { success: true, message: `Test tool received: ${message}` };
      },
    });
  }

  /**
   * Get all available tools for AI
   */
  getAllTools() {
    try {
      const tools = {
        test: this.getTestTool(),
        getRepositoryDetails: this.getRepositoryDetailsTool(),
        getRepositoryCommits: this.getRepositoryCommitsTool(),
        getRepositoryIssues: this.getRepositoryIssuesTool(),
        getRepositoryPullRequests: this.getRepositoryPullRequestsTool(),
        getRepositoryContributors: this.getRepositoryContributorsTool(),
        getRepositoryLanguages: this.getRepositoryLanguagesTool(),
        getRepositoryReleases: this.getRepositoryReleasesTool(),
        getRepositoryTraffic: this.getRepositoryTrafficTool(),
      };
      console.log('All tools created successfully');
      return tools;
    } catch (error) {
      console.error('Error creating tools:', error);
      // Return only the test tool as fallback
      return {
        test: this.getTestTool(),
      };
    }
  }
}
