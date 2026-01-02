import { Injectable } from '@nestjs/common';
import axios, { AxiosResponse } from 'axios';
import { db } from '../db/db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class GitHubToolsService {
  private readonly githubApiBase = 'https://api.github.com';
  private readonly apiVersion = '2022-11-28';
  private readonly githubToken = process.env.GITHUB_TOKEN;
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000; // 1 second

  /**
   * Get user's GitHub access token from database
   */
  private async getUserGitHubToken(
    githubLogin: string,
  ): Promise<string | null> {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.githubLogin, githubLogin),
        columns: { githubAccessToken: true },
      });
      return user?.githubAccessToken || null;
    } catch (error) {
      console.error('Error getting user GitHub token:', error);
      return null;
    }
  }

  /**
   * Make a GitHub API request with retry logic and rate limit handling
   */
  private async makeGitHubRequest<T>(
    url: string,
    params: any = {},
    retryCount: number = 0,
    userToken?: string,
  ): Promise<T> {
    try {
      const headers: Record<string, string> = {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': this.apiVersion,
        'User-Agent': 'Cathedral-AI-Tools/1.0',
      };

      // Add GitHub token if available (user token takes priority)
      const token = userToken || this.githubToken;
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response: AxiosResponse<T> = await axios.get(url, {
        headers,
        params,
        timeout: 10000, // 10 second timeout
      });

      return response.data;
    } catch (error: any) {
      // Handle rate limit errors
      if (
        error.response?.status === 403 &&
        error.response?.data?.message?.includes('rate limit')
      ) {
        const resetTime = error.response.headers['x-ratelimit-reset'];
        const resetDate = resetTime
          ? new Date(parseInt(resetTime) * 1000)
          : new Date(Date.now() + 3600000);
        const waitTime = resetDate.getTime() - Date.now();

        console.warn(
          `GitHub API rate limit exceeded. Reset at: ${resetDate.toISOString()}`,
        );

        if (retryCount < this.maxRetries && waitTime < 300000) {
          // Only retry if wait time < 5 minutes
          console.log(
            `Retrying GitHub API request in ${Math.min(
              waitTime,
              60000,
            )}ms (attempt ${retryCount + 1})`,
          );
          await new Promise((resolve) =>
            setTimeout(resolve, Math.min(waitTime, 60000)),
          );
          return this.makeGitHubRequest<T>(
            url,
            params,
            retryCount + 1,
            userToken,
          );
        } else {
          console.warn(
            'GitHub API rate limit exceeded and retry limit reached or wait time too long',
          );
          return null; // Return null instead of throwing error
        }
      }

      // Handle other errors
      if (retryCount < this.maxRetries && error.response?.status >= 500) {
        console.warn(
          `GitHub API server error, retrying in ${this.retryDelay}ms (attempt ${
            retryCount + 1
          })`,
        );
        await new Promise((resolve) =>
          setTimeout(resolve, this.retryDelay * (retryCount + 1)),
        );
        return this.makeGitHubRequest<T>(
          url,
          params,
          retryCount + 1,
          userToken,
        );
      }

      console.error(`GitHub API request failed: ${error.message}`);
      return null; // Return null instead of throwing error
    }
  }

  /**
   * Get detailed repository information
   */
  async getRepositoryDetails(owner: string, repo: string, userToken?: string) {
    return this.makeGitHubRequest(
      `${this.githubApiBase}/repos/${owner}/${repo}`,
      {},
      0,
      userToken,
    );
  }

  /**
   * Get repository commits
   */
  async getRepositoryCommits(
    owner: string,
    repo: string,
    limit: number = 10,
    userToken?: string,
  ) {
    return this.makeGitHubRequest(
      `${this.githubApiBase}/repos/${owner}/${repo}/commits`,
      { per_page: limit },
      0,
      userToken,
    );
  }

  /**
   * Get repository issues
   */
  async getRepositoryIssues(
    owner: string,
    repo: string,
    state: 'open' | 'closed' | 'all' = 'all',
    limit: number = 10,
    userToken?: string,
  ) {
    return this.makeGitHubRequest(
      `${this.githubApiBase}/repos/${owner}/${repo}/issues`,
      {
        state,
        per_page: limit,
        sort: 'updated',
        direction: 'desc',
      },
      0,
      userToken,
    );
  }

  /**
   * Get repository pull requests
   */
  async getRepositoryPullRequests(
    owner: string,
    repo: string,
    state: 'open' | 'closed' | 'all' = 'all',
    limit: number = 10,
    userToken?: string,
  ) {
    return this.makeGitHubRequest(
      `${this.githubApiBase}/repos/${owner}/${repo}/pulls`,
      {
        state,
        per_page: limit,
        sort: 'updated',
        direction: 'desc',
      },
      0,
      userToken,
    );
  }

  /**
   * Get repository contributors
   */
  async getRepositoryContributors(
    owner: string,
    repo: string,
    limit: number = 10,
    userToken?: string,
  ) {
    return this.makeGitHubRequest(
      `${this.githubApiBase}/repos/${owner}/${repo}/contributors`,
      { per_page: limit },
      0,
      userToken,
    );
  }

  /**
   * Get repository languages
   */
  async getRepositoryLanguages(
    owner: string,
    repo: string,
    userToken?: string,
  ) {
    return this.makeGitHubRequest(
      `${this.githubApiBase}/repos/${owner}/${repo}/languages`,
      {},
      0,
      userToken,
    );
  }

  /**
   * Get repository traffic (views, clones, etc.)
   */
  async getRepositoryTraffic(owner: string, repo: string, userToken?: string) {
    try {
      const [views, clones] = await Promise.allSettled([
        this.makeGitHubRequest(
          `${this.githubApiBase}/repos/${owner}/${repo}/traffic/views`,
          {},
          0,
          userToken,
        ),
        this.makeGitHubRequest(
          `${this.githubApiBase}/repos/${owner}/${repo}/traffic/clones`,
          {},
          0,
          userToken,
        ),
      ]);

      return {
        views: views.status === 'fulfilled' ? views.value : null,
        clones: clones.status === 'fulfilled' ? clones.value : null,
      };
    } catch (error) {
      console.error('Error fetching repository traffic:', error);
      return { views: null, clones: null };
    }
  }

  /**
   * Get repository releases
   */
  async getRepositoryReleases(
    owner: string,
    repo: string,
    limit: number = 5,
    userToken?: string,
  ) {
    return this.makeGitHubRequest(
      `${this.githubApiBase}/repos/${owner}/${repo}/releases`,
      { per_page: limit },
      0,
      userToken,
    );
  }

  /**
   * Get repository stargazers (who starred the repo)
   */
  async getRepositoryStargazers(
    owner: string,
    repo: string,
    limit: number = 10,
    userToken?: string,
  ) {
    return this.makeGitHubRequest(
      `${this.githubApiBase}/repos/${owner}/${repo}/stargazers`,
      { per_page: limit },
      0,
      userToken,
    );
  }

  /**
   * Get repository forks
   */
  async getRepositoryForks(
    owner: string,
    repo: string,
    limit: number = 10,
    userToken?: string,
  ) {
    return this.makeGitHubRequest(
      `${this.githubApiBase}/repos/${owner}/${repo}/forks`,
      { per_page: limit },
      0,
      userToken,
    );
  }

  /**
   * Get user information
   */
  async getUserInfo(username: string) {
    return this.makeGitHubRequest(`${this.githubApiBase}/users/${username}`);
  }

  /**
   * Get comprehensive repository analysis
   */
  async getComprehensiveRepositoryAnalysis(
    owner: string,
    repo: string,
    githubLogin?: string,
  ) {
    try {
      // Get user's GitHub token if available
      const userToken = githubLogin
        ? await this.getUserGitHubToken(githubLogin)
        : null;

      const [
        details,
        commits,
        issues,
        pullRequests,
        contributors,
        languages,
        traffic,
        releases,
        stargazers,
        forks,
      ] = await Promise.allSettled([
        this.getRepositoryDetails(owner, repo, userToken),
        this.getRepositoryCommits(owner, repo, 20, userToken),
        this.getRepositoryIssues(owner, repo, 'all', 20, userToken),
        this.getRepositoryPullRequests(owner, repo, 'all', 20, userToken),
        this.getRepositoryContributors(owner, repo, 20, userToken),
        this.getRepositoryLanguages(owner, repo, userToken),
        this.getRepositoryTraffic(owner, repo, userToken),
        this.getRepositoryReleases(owner, repo, 5, userToken),
        this.getRepositoryStargazers(owner, repo, 20, userToken),
        this.getRepositoryForks(owner, repo, 20, userToken),
      ]);

      return {
        details: details.status === 'fulfilled' ? details.value : null,
        commits: commits.status === 'fulfilled' ? commits.value : null,
        issues: issues.status === 'fulfilled' ? issues.value : null,
        pullRequests:
          pullRequests.status === 'fulfilled' ? pullRequests.value : null,
        contributors:
          contributors.status === 'fulfilled' ? contributors.value : null,
        languages: languages.status === 'fulfilled' ? languages.value : null,
        traffic: traffic.status === 'fulfilled' ? traffic.value : null,
        releases: releases.status === 'fulfilled' ? releases.value : null,
        stargazers: stargazers.status === 'fulfilled' ? stargazers.value : null,
        forks: forks.status === 'fulfilled' ? forks.value : null,
      };
    } catch (error) {
      console.error('Error in comprehensive repository analysis:', error);
      throw new Error(
        `Failed to perform comprehensive repository analysis: ${error.message}`,
      );
    }
  }
}
