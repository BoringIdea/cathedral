import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

import { users } from '../db/schema';
import { db } from '../db/db';
import { eq } from 'drizzle-orm';
import { PublicKey } from '@solana/web3.js';
import bs58 from 'bs58';
import nacl from 'tweetnacl';
import { CacheService } from '../shared/cache.service';

// Github Docs: https://docs.github.com/zh/rest/authentication/permissions-required-for-github-apps?apiVersion=2022-11-28
@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly cacheService: CacheService,
  ) {}

  async getGithubToken(
    code: string,
  ): Promise<{ jwt_token: string; user_name: string; success: boolean }> {
    try {
      const response = await axios.post(
        `https://github.com/login/oauth/access_token`,
        {
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code,
        },
        {
          headers: {
            Accept: 'application/json',
          },
        },
      );
      console.log('getGithubToken response', response.data);

      if (response.status !== 200) {
        throw new HttpException(
          'Failed to get access token',
          HttpStatus.BAD_REQUEST,
        );
      }
      const accessToken = response.data.access_token;
      console.log('accessToken', accessToken);

      const githubUser = await this.getGithubUser(accessToken);
      console.log('githubUser', githubUser);

      // use token access token to generate jwt token
      const jwtToken = await this.jwtService.signAsync({
        access_token: response.data.access_token,
        user_name: githubUser.login,
      });
      console.log('jwtToken', jwtToken);

      // update user's jwt token
      await db
        .update(users)
        .set({ jwtToken: jwtToken })
        .where(eq(users.githubLogin, githubUser.login));

      let user = await this.getUserByGithubLogin(githubUser.login);
      console.log('Get user', user);

      if (!user) {
        const repositories = await this.getUserGithubRepositories(
          githubUser.login,
        );
        // calculate stars and repositories count
        // const stars = repositories.reduce((acc, repo) => acc + repo.stargazers_count, 0);

        console.log('user not found, create user');
        user = await this.createUser(githubUser, response.data, jwtToken, 0);
        console.log('user created', user);

        console.log('store repositories in local cache');
        this.storeRepositoriesInCache(githubUser.login, repositories);
        console.log('repositories stored in local cache');
      }

      return {
        jwt_token: jwtToken,
        user_name: githubUser.login,
        success: true,
      };
    } catch (error) {
      console.error('Error getting access token', error);

      if (error.response?.status === 400) {
        throw new Error('Invalid GitHub OAuth code');
      } else if (error.response?.status === 401) {
        throw new Error('GitHub OAuth credentials invalid');
      } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        throw new Error('Cannot connect to GitHub API');
      } else {
        throw new Error(`GitHub authentication failed: ${error.message}`);
      }
    }
  }

  private storeRepositoriesInCache(userLogin: string, repos: any[]) {
    return this.cacheService.storeRepositories(userLogin, repos);
  }

  async getRepositoriesFromCache(userLogin: string) {
    const key = `user:${userLogin}:repositories`;
    const cachedEntry = this.cacheService.getRepositories(key);

    // If cache is valid, return it
    if (
      cachedEntry &&
      Date.now() - cachedEntry.timestamp < this.cacheService.getCacheTTL()
    ) {
      console.log(`Repositories found in cache for user ${userLogin}`);
      return cachedEntry.data;
    }

    try {
      // Get GitHub repositories data
      const repositories = await this.getUserGithubRepositories(userLogin);

      // Handle empty repositories
      if (!repositories || repositories.length === 0) {
        console.log(`User ${userLogin} has no repositories on GitHub`);
        this.cacheService.setRepositories(key, [], Date.now());
        return [];
      }

      // Store to cache and return filtered data
      const filteredRepositories = await this.cacheService.storeRepositories(
        userLogin,
        repositories,
      );
      console.log('Repositories updated in cache for user:', userLogin);

      return filteredRepositories;
    } catch (error) {
      console.error(
        `Error fetching repositories for user ${userLogin}:`,
        error,
      );
      // Return empty array if error occurs, but don't cache
      return [];
    }
  }

  public async getUserGithubRepositories(userLogin: string) {
    const response = await axios.get(
      `https://api.github.com/users/${userLogin}/repos`,
    );
    console.log('getUserGithubRepositories response', response.data);
    return response.data;
  }

  private async getUserByGithubLogin(githubLogin: string) {
    const user = await db.query.users.findFirst({
      where: eq(users.githubLogin, githubLogin),
    });
    return user;
  }

  private async getGithubUser(accessToken: string) {
    const response = await axios.get('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    if (response.status !== 200) {
      throw new HttpException(
        'Failed to get GitHub user info',
        HttpStatus.BAD_REQUEST,
      );
    }

    return response.data;
  }

  private async createUser(
    githubUser: any,
    githubResponse: any,
    jwtToken: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    stars: number,
  ) {
    const [insertedUser] = await db.insert(users).values({
      githubId: githubUser.id.toString(),
      githubLogin: githubUser.login,
      jwtToken: jwtToken,
      githubName: githubUser.name,
      githubRepositoriesCount: githubUser.public_repos,
      githubStars: 0,
      githubFollowers: githubUser.followers,
      avatarUrl: githubUser.avatar_url,
      githubAccessToken: githubResponse.access_token,
      githubRefreshToken: githubResponse.refresh_token,
      githubAccessTokenExpiresAt: new Date(
        Date.now() + githubResponse.expires_in * 1000,
      ).toISOString(),
      githubRefreshTokenExpiresAt: new Date(
        Date.now() + githubResponse.refresh_token_expires_in * 1000,
      ).toISOString(),
    });
    return insertedUser;
  }

  async getUser(githubLogin: string) {
    const user = await this.getUserByGithubLogin(githubLogin);
    return user;
  }

  async refreshGithubToken(
    refreshToken: string,
  ): Promise<{ access_token: string; refresh_token: string }> {
    try {
      const response = await axios.post(
        'https://github.com/login/oauth/access_token',
        {
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        },
        {
          headers: {
            Accept: 'application/json',
          },
        },
      );

      if (response.data.error) {
        throw new HttpException(
          response.data.error_description || 'Refresh GitHub token failed',
          HttpStatus.BAD_REQUEST,
        );
      }

      return {
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token,
      };
    } catch (error) {
      console.error('Refresh GitHub token failed:', error);
      throw new HttpException(
        'Refresh GitHub token failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Verify Solana wallet signature using @solana/web3.js
   * Standard Solana signature verification flow:
   * 1. Validate wallet address with PublicKey class
   * 2. Decode base58 signature (Phantom/Solflare standard format)
   * 3. Verify Ed25519 signature with nacl
   */
  private verifyWalletSignature(
    message: string,
    signature: string,
    walletAddress: string,
  ): boolean {
    try {
      // 1. Validate and parse wallet address using Solana Web3.js
      const publicKey = new PublicKey(walletAddress);

      // 2. Decode base58 signature (standard format for Solana wallets)
      const signatureUint8 = bs58.decode(signature);

      // 3. Convert message to Uint8Array
      const messageUint8 = new TextEncoder().encode(message);

      // 4. Verify Ed25519 signature using nacl (Solana's signature algorithm)
      return nacl.sign.detached.verify(
        messageUint8,
        signatureUint8,
        publicKey.toBytes(),
      );
    } catch (error) {
      console.error('Signature verification error:', error);
      return false;
    }
  }

  async verifyAndBindWallet(
    signature: string,
    message: string,
    walletAddress: string,
    jwtToken: string,
  ) {
    try {
      // 1. Validate wallet address format using @solana/web3.js
      let publicKey: PublicKey;
      try {
        publicKey = new PublicKey(walletAddress);
      } catch {
        throw new HttpException(
          'Invalid wallet address format',
          HttpStatus.BAD_REQUEST,
        );
      }

      // 2. Verify the signature
      const isValid = this.verifyWalletSignature(
        message,
        signature,
        walletAddress,
      );

      if (!isValid) {
        throw new HttpException('Invalid signature', HttpStatus.UNAUTHORIZED);
      }

      // 3. Extract GitHub login from JWT token
      const decodedToken = await this.jwtService.verifyAsync(jwtToken);
      const githubLogin = decodedToken.user_name;

      // 4. Update user record with wallet address (normalized to base58)
      const normalizedAddress = publicKey.toBase58();
      await db
        .update(users)
        .set({ wallet: normalizedAddress })
        .where(eq(users.githubLogin, githubLogin));

      return {
        success: true,
        githubLogin,
        walletAddress: normalizedAddress,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Wallet binding error:', error);
      throw new HttpException(
        'Failed to verify and bind wallet',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
