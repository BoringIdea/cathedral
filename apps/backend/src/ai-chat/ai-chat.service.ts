import { Injectable } from '@nestjs/common';
import { RepositoriesService } from '../repositories/repositories.service';
import { GitHubToolsService } from './github-tools.service';
import { ProjectKnowledgeService } from './project-knowledge.service';
import { AnalysisCacheService } from './analysis-cache.service';
import { AIToolsService } from './ai-tools.service';
import { generateText } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import {
  ChatMessageDto,
  ChatResponseDto,
  RepositoryAnalysisDto,
} from './dto/ai-chat.dto';

@Injectable()
export class AIChatService {
  private openrouterProvider: any;

  constructor(
    private readonly repositoriesService: RepositoriesService,
    private readonly githubToolsService: GitHubToolsService,
    private readonly projectKnowledgeService: ProjectKnowledgeService,
    private readonly analysisCacheService: AnalysisCacheService,
    private readonly aiToolsService: AIToolsService,
  ) {
    // Validate and display OpenRouter configuration
    if (!process.env.OPENROUTER_API_KEY) {
      console.warn(
        '⚠️  OPENROUTER_API_KEY is not set. AI chat functionality will not work.',
      );
    } else {
      const model = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';
      console.log(`🤖 AI Chat configured with OpenRouter (model: ${model})`);

      // Create OpenRouter provider
      this.openrouterProvider = createOpenRouter({
        apiKey: process.env.OPENROUTER_API_KEY,
      });
    }

    // Check GitHub token configuration
    if (!process.env.GITHUB_TOKEN) {
      console.warn(
        '⚠️  GITHUB_TOKEN is not set. GitHub API calls will be rate limited (60 requests/hour).',
      );
    } else {
      console.log('✅ GitHub API configured with token');
    }
  }

  /**
   * Get repository context data concurrently
   */
  private async getRepositoryContext(repositoryId: number) {
    const [repository, poolInfo] = await Promise.all([
      this.repositoriesService.getRepositoryById(repositoryId),
      this.repositoriesService.getPoolByRepositoryId(repositoryId),
    ]);

    const poolOverview = poolInfo
      ? await this.repositoriesService.getPoolOverview(poolInfo.pool)
      : null;

    return { repository, poolInfo, poolOverview };
  }

  async analyzeRepository(
    repositoryId: number,
  ): Promise<RepositoryAnalysisDto> {
    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error(
        'OpenRouter API key is not configured. Please set OPENROUTER_API_KEY environment variable.',
      );
    }

    try {
      // Get repository data for context
      const { repository, poolInfo, poolOverview } =
        await this.getRepositoryContext(repositoryId);

      // Check cache first
      const cachedAnalysis =
        this.analysisCacheService.getCachedAnalysis(repositoryId);

      if (cachedAnalysis) {
        console.log(`Returning cached analysis for repository ${repositoryId}`);
        return cachedAnalysis;
      }

      console.log(
        `No valid cache found for repository ${repositoryId}, performing fresh analysis`,
      );

      // Get additional GitHub data using tools (only when cache is not available)
      let githubAnalysis = null;
      try {
        console.log('Fetching detailed GitHub data...');
        githubAnalysis =
          await this.githubToolsService.getComprehensiveRepositoryAnalysis(
            repository.owner,
            repository.name,
            null, // No specific user token for now, will use global GITHUB_TOKEN
          );
        console.log('GitHub analysis completed');
      } catch (error) {
        console.warn('Failed to fetch GitHub analysis:', error.message);
        // Continue without GitHub data
      }

      // Prepare context for AI analysis
      const context = this.prepareAnalysisContext(
        repository,
        poolInfo,
        poolOverview,
        githubAnalysis,
      );

      console.log('Starting AI analysis');
      // Generate AI analysis using generateText (official pattern)
      const result = await generateText({
        model: this.openrouterProvider(
          'mistralai/mistral-small-3.2-24b-instruct',
        ),
        prompt: this.createAnalysisPrompt(context, 'en'), // Default to English for now
        temperature: 0.7,
      });

      const text = result.text;

      // Parse AI response into structured data
      const analysis = this.parseAnalysisResponse(text, repositoryId);

      // Cache the analysis result
      this.analysisCacheService.cacheAnalysis(repositoryId, analysis);

      return analysis;
    } catch (error) {
      console.error('Error analyzing repository:', error);
      throw new Error('Failed to analyze repository');
    }
  }

  /**
   * Technical Analysis Template - Focus on technology stack and development quality
   */
  async analyzeRepositoryTechnical(
    repositoryId: number,
    userLanguage: string = 'en',
  ): Promise<ChatResponseDto> {
    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error(
        'OpenRouter API key is not configured. Please set OPENROUTER_API_KEY environment variable.',
      );
    }

    try {
      // Check cache first
      const cachedAnalysis =
        this.analysisCacheService.getCachedTemplateAnalysis(
          repositoryId,
          'technical',
        );

      if (cachedAnalysis) {
        console.log(
          `Returning cached technical analysis for repository ${repositoryId}`,
        );
        return cachedAnalysis;
      }

      console.log(
        `No valid cache found for technical analysis of repository ${repositoryId}, performing fresh analysis`,
      );

      const { repository, poolInfo, poolOverview } =
        await this.getRepositoryContext(repositoryId);

      const context = this.prepareAnalysisContext(
        repository,
        poolInfo,
        poolOverview,
      );

      const prompt = this.createTechnicalAnalysisPrompt(context, userLanguage);

      const result = await generateText({
        model: this.openrouterProvider(
          process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini',
        ),
        prompt,
        temperature: 0.7,
      });

      const analysis = {
        message: result.text,
        sessionId: this.generateSessionId(),
        confidence: 0.8,
        timestamp: new Date().toISOString(),
      };

      // Cache the analysis result
      this.analysisCacheService.cacheTemplateAnalysis(
        repositoryId,
        'technical',
        analysis,
      );

      return analysis;
    } catch (error) {
      console.error('Error in technical analysis:', error);
      throw new Error('Failed to perform technical analysis');
    }
  }

  /**
   * Investment Analysis Template - Focus on investment potential and market value
   */
  async analyzeRepositoryInvestment(
    repositoryId: number,
    userLanguage: string = 'en',
  ): Promise<ChatResponseDto> {
    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error(
        'OpenRouter API key is not configured. Please set OPENROUTER_API_KEY environment variable.',
      );
    }

    try {
      // Check cache first
      const cachedAnalysis =
        this.analysisCacheService.getCachedTemplateAnalysis(
          repositoryId,
          'investment',
        );

      if (cachedAnalysis) {
        console.log(
          `Returning cached investment analysis for repository ${repositoryId}`,
        );
        return cachedAnalysis;
      }

      console.log(
        `No valid cache found for investment analysis of repository ${repositoryId}, performing fresh analysis`,
      );

      const { repository, poolInfo, poolOverview } =
        await this.getRepositoryContext(repositoryId);

      const context = this.prepareAnalysisContext(
        repository,
        poolInfo,
        poolOverview,
      );

      const prompt = this.createInvestmentAnalysisPrompt(context, userLanguage);

      const result = await generateText({
        model: this.openrouterProvider(
          process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini',
        ),
        prompt,
        temperature: 0.7,
      });

      const analysis = {
        message: result.text,
        sessionId: this.generateSessionId(),
        confidence: 0.8,
        timestamp: new Date().toISOString(),
      };

      // Cache the analysis result
      this.analysisCacheService.cacheTemplateAnalysis(
        repositoryId,
        'investment',
        analysis,
      );

      return analysis;
    } catch (error) {
      console.error('Error in investment analysis:', error);
      throw new Error('Failed to perform investment analysis');
    }
  }

  /**
   * Community Analysis Template - Focus on community health and developer activity
   */
  async analyzeRepositoryCommunity(
    repositoryId: number,
    userLanguage: string = 'en',
  ): Promise<ChatResponseDto> {
    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error(
        'OpenRouter API key is not configured. Please set OPENROUTER_API_KEY environment variable.',
      );
    }

    try {
      // Check cache first
      const cachedAnalysis =
        this.analysisCacheService.getCachedTemplateAnalysis(
          repositoryId,
          'community',
        );

      if (cachedAnalysis) {
        console.log(
          `Returning cached community analysis for repository ${repositoryId}`,
        );
        return cachedAnalysis;
      }

      console.log(
        `No valid cache found for community analysis of repository ${repositoryId}, performing fresh analysis`,
      );

      const { repository, poolInfo, poolOverview } =
        await this.getRepositoryContext(repositoryId);

      const context = this.prepareAnalysisContext(
        repository,
        poolInfo,
        poolOverview,
      );

      const prompt = this.createCommunityAnalysisPrompt(context, userLanguage);

      const result = await generateText({
        model: this.openrouterProvider(
          process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini',
        ),
        prompt,
        temperature: 0.7,
      });

      const analysis = {
        message: result.text,
        sessionId: this.generateSessionId(),
        confidence: 0.8,
        timestamp: new Date().toISOString(),
      };

      // Cache the analysis result
      this.analysisCacheService.cacheTemplateAnalysis(
        repositoryId,
        'community',
        analysis,
      );

      return analysis;
    } catch (error) {
      console.error('Error in community analysis:', error);
      throw new Error('Failed to perform community analysis');
    }
  }

  /**
   * Risk Analysis Template - Focus on potential risks and concerns
   */
  async analyzeRepositoryRisk(
    repositoryId: number,
    userLanguage: string = 'en',
  ): Promise<ChatResponseDto> {
    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error(
        'OpenRouter API key is not configured. Please set OPENROUTER_API_KEY environment variable.',
      );
    }

    try {
      // Check cache first
      const cachedAnalysis =
        this.analysisCacheService.getCachedTemplateAnalysis(
          repositoryId,
          'risk',
        );

      if (cachedAnalysis) {
        console.log(
          `Returning cached risk analysis for repository ${repositoryId}`,
        );
        return cachedAnalysis;
      }

      console.log(
        `No valid cache found for risk analysis of repository ${repositoryId}, performing fresh analysis`,
      );

      const { repository, poolInfo, poolOverview } =
        await this.getRepositoryContext(repositoryId);

      const context = this.prepareAnalysisContext(
        repository,
        poolInfo,
        poolOverview,
      );

      const prompt = this.createRiskAnalysisPrompt(context, userLanguage);

      const result = await generateText({
        model: this.openrouterProvider(
          process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini',
        ),
        prompt,
        temperature: 0.7,
      });

      const analysis = {
        message: result.text,
        sessionId: this.generateSessionId(),
        confidence: 0.8,
        timestamp: new Date().toISOString(),
      };

      // Cache the analysis result
      this.analysisCacheService.cacheTemplateAnalysis(
        repositoryId,
        'risk',
        analysis,
      );

      return analysis;
    } catch (error) {
      console.error('Error in risk analysis:', error);
      throw new Error('Failed to perform risk analysis');
    }
  }

  async chatWithAI(chatMessage: ChatMessageDto): Promise<ChatResponseDto> {
    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error(
        'OpenRouter API key is not configured. Please set OPENROUTER_API_KEY environment variable.',
      );
    }

    try {
      // Get repository data for context
      const { repository, poolInfo, poolOverview } =
        await this.getRepositoryContext(chatMessage.repositoryId);

      // Prepare context
      const context = this.prepareAnalysisContext(
        repository,
        poolInfo,
        poolOverview,
      );

      // Detect user language from the message
      const userLanguage = this.detectLanguage(chatMessage.message);
      console.log(
        `Detected user language: ${userLanguage} for message: "${chatMessage.message}"`,
      );

      // Get available tools with validation
      let tools = {};
      try {
        tools = this.aiToolsService.getAllTools();
        console.log('Available tools:', Object.keys(tools));

        // Validate tools are properly defined
        const toolKeys = Object.keys(tools);
        if (toolKeys.length === 0) {
          console.warn('No tools available, proceeding without tools');
          tools = {};
        }
      } catch (toolError) {
        console.error('Error getting tools:', toolError);
        tools = {};
      }

      // Generate AI response using generateText with tools
      console.log('Creating chat prompt...');
      const prompt = this.createChatPrompt(
        context,
        chatMessage.message,
        userLanguage,
      );
      console.log('Prompt created, length:', prompt.length);

      // Try with tools first, but with better error handling
      let result;
      const hasTools = Object.keys(tools).length > 0;

      if (hasTools) {
        try {
          console.log('Attempting AI generation with tools...');
          result = await generateText({
            model: this.openrouterProvider(
              process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini',
            ),
            tools,
            prompt,
            temperature: 0.7,
          });
          console.log('AI generation with tools completed');
        } catch (toolError) {
          console.warn(
            'Error with tools, trying without tools:',
            toolError.message,
          );
          // Fallback: try without tools
          result = await generateText({
            model: this.openrouterProvider(
              process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini',
            ),
            prompt,
            temperature: 0.7,
          });
          console.log('AI generation without tools completed');
        }
      } else {
        console.log('No tools available, generating without tools...');
        result = await generateText({
          model: this.openrouterProvider(
            process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini',
          ),
          prompt,
          temperature: 0.7,
        });
        console.log('AI generation without tools completed');
      }
      console.log('AI generation result:', result);

      console.log('AI response result:', {
        text: result.text,
        textLength: result.text?.length || 0,
        hasText: !!result.text,
        toolCalls: result.toolCalls?.length || 0,
        finishReason: result.finishReason,
      });

      // Check if response is empty or invalid
      if (!result.text || result.text.trim().length === 0) {
        console.warn('AI returned empty response, analyzing situation...');

        // If we have tool calls but no text, this is the main issue we need to fix
        if (result.toolCalls && result.toolCalls.length > 0) {
          console.log(
            `⚠️ CRITICAL: Tool calls were made (${result.toolCalls.length} calls) but no text response generated!`,
          );
          console.log(
            'Tool calls:',
            result.toolCalls.map((tc) => tc.toolName),
          );
          console.log('Finish reason:', result.finishReason);

          // Try to force a text response with a very explicit prompt
          try {
            console.log(
              'Attempting to force text generation after tool calls...',
            );
            const forcedPrompt =
              userLanguage === 'zh'
                ? `你刚刚调用了工具来获取关于 ${context.repository.name} 仓库的信息。现在你必须基于这些工具调用的结果，用中文生成一个完整的文本回答来回答用户的问题："${chatMessage.message}"。

  请立即生成回答，不要再调用工具。直接综合你获得的信息，给出清晰、有用的回答。`
                : `You just called tools to get information about the ${context.repository.name} repository. Now you MUST generate a complete text response based on these tool call results to answer the user's question: "${chatMessage.message}".

Please generate your response immediately without calling more tools. Synthesize the information you obtained and provide a clear, helpful answer.`;

            const toolBasedResult = await generateText({
              model: this.openrouterProvider(
                process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini',
              ),
              prompt: forcedPrompt,
              temperature: 0.7,
            });

            if (
              toolBasedResult.text &&
              toolBasedResult.text.trim().length > 0
            ) {
              console.log(
                '✅ Successfully forced text generation after tool calls',
              );
              return {
                message: toolBasedResult.text,
                sessionId: chatMessage.sessionId || this.generateSessionId(),
                confidence: 0.75,
                timestamp: new Date().toISOString(),
              };
            } else {
              console.error('❌ Forced text generation also returned empty');
            }
          } catch (toolBasedError) {
            console.error(
              'Tool-based response generation failed:',
              toolBasedError,
            );
          }
        }

        // Try a very simple prompt as last resort
        try {
          const simpleResult = await generateText({
            model: this.openrouterProvider(
              process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini',
            ),
            prompt: this.createSimpleFallbackPrompt(
              context,
              chatMessage.message,
              userLanguage,
            ),
            temperature: 0.7,
          });

          if (simpleResult.text && simpleResult.text.trim().length > 0) {
            return {
              message: simpleResult.text,
              sessionId: chatMessage.sessionId || this.generateSessionId(),
              confidence: 0.5,
              timestamp: new Date().toISOString(),
            };
          }
        } catch (fallbackError) {
          console.error('Fallback also failed:', fallbackError);
        }

        return {
          message:
            'I apologize, but I was unable to generate a response. Please try rephrasing your question or ask about a different aspect of this repository.',
          sessionId: chatMessage.sessionId || this.generateSessionId(),
          confidence: 0.1,
          timestamp: new Date().toISOString(),
        };
      }

      return {
        message: result.text,
        sessionId: chatMessage.sessionId || this.generateSessionId(),
        confidence: 0.8,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error in AI chat:', error);
      throw new Error('Failed to process chat message');
    }
  }

  private prepareAnalysisContext(
    repository: any,
    poolInfo: any,
    poolOverview: any,
    githubAnalysis: any = null,
  ) {
    return {
      repository: {
        name: repository?.name,
        owner: repository?.owner,
        description: repository?.description,
        stars: repository?.stars,
        forks: repository?.forks,
        contributors: repository?.contributors,
        isFork: repository?.isFork,
        createdAt: repository?.createdAt,
        link: repository?.link,
      },
      pool: {
        address: poolInfo?.pool,
        tokenMint: poolInfo?.tokenMint,
        creator: poolInfo?.creator,
        description: poolInfo?.description,
      },
      overview: {
        totalSupply: poolOverview?.totalSupply,
        solReserve: poolOverview?.solReserve,
        totalVolume: poolOverview?.totalVolume,
      },
      githubAnalysis: githubAnalysis
        ? {
            // Repository details
            details: githubAnalysis.details,
            // Recent activity
            recentCommits: githubAnalysis.commits?.slice(0, 5) || [],
            recentIssues: githubAnalysis.issues?.slice(0, 5) || [],
            recentPullRequests: githubAnalysis.pullRequests?.slice(0, 5) || [],
            // Community metrics
            contributors: githubAnalysis.contributors || [],
            languages: githubAnalysis.languages || {},
            // Traffic data
            traffic: githubAnalysis.traffic,
            // Releases
            releases: githubAnalysis.releases || [],
            // Social metrics
            stargazers: githubAnalysis.stargazers || [],
            forks: githubAnalysis.forks || [],
          }
        : null,
    };
  }

  private createAnalysisPrompt(
    context: any,
    userLanguage: string = 'en',
  ): string {
    const isChinese =
      userLanguage.toLowerCase().includes('zh') ||
      userLanguage.toLowerCase().includes('chinese');

    // Get project knowledge
    const projectKnowledge =
      this.projectKnowledgeService.getProjectKnowledge(userLanguage);
    const analysisGuidelines =
      this.projectKnowledgeService.getAnalysisGuidelines(userLanguage);

    if (isChinese) {
      return `
🤖 你是一位专业的GitHub仓库分析师和投资顾问，专门为Cathedral平台分析开源项目。请基于以下背景知识和仓库数据提供全面的投资分析。

${projectKnowledge}

${analysisGuidelines}

## 📊 当前分析项目数据

### 🏷️ 仓库数据:
- 📝 名称: ${context.repository.name}
- 👤 所有者: ${context.repository.owner}
- 📄 描述: ${context.repository.description}
- ⭐ 星标数: ${context.repository.stars}
- 🍴 分叉数: ${context.repository.forks}
- 👥 贡献者: ${context.repository.contributors}
- 🔀 是否为分叉: ${context.repository.isFork}
- 📅 创建时间: ${context.repository.createdAt}
- 🔗 GitHub链接: ${context.repository.link}

### 💰 池数据:
- 🏦 池地址: ${context.pool.address}
- 🪙 代币铸造: ${context.pool.tokenMint}
- 👤 创建者: ${context.pool.creator}

### 📈 市场数据:
- 📊 总供应量: ${context.overview.totalSupply}
- 💎 SOL储备: ${context.overview.solReserve}
- 📈 总交易量: ${context.overview.totalVolume}

${
  context.githubAnalysis
    ? `
### 🔍 GitHub详细分析:
- 📊 仓库状态: ${context.githubAnalysis.details?.archived ? '已归档' : '活跃'}
- 💻 主要语言: ${Object.keys(context.githubAnalysis.languages || {})
        .slice(0, 3)
        .join(', ')}
- 📝 最近提交: ${context.githubAnalysis.recentCommits?.length || 0} 个
- 🐛 开放问题: ${
        context.githubAnalysis.recentIssues?.filter((i) => i.state === 'open')
          .length || 0
      } 个
- 🔄 开放PR: ${
        context.githubAnalysis.recentPullRequests?.filter(
          (pr) => pr.state === 'open',
        ).length || 0
      } 个
- 👥 贡献者: ${context.githubAnalysis.contributors?.length || 0} 个
- 🚀 最近发布: ${context.githubAnalysis.releases?.length || 0} 个
- 📈 流量数据: ${context.githubAnalysis.traffic ? '可用' : '不可用'}
`
    : ''
}

请基于Cathedral平台的特点和开源项目投资原则，提供以下格式的结构化分析:

**重要格式要求：**
- 每个列表项必须是一个完整的句子或短语
- 不要在列表项中使用括号或特殊符号
- 技术栈只列出核心技术，不要包含 GitHub、Git 等通用工具
- 每个列表项应该独立完整，不要跨行分割

## 📊 OVERVIEW
[2-3句话的项目总结，重点关注在Cathedral生态中的价值]

## 🛠️ TECH_STACK
- [主要技术栈，如 React, Node.js, Python 等]
- [数据库技术，如 PostgreSQL, MongoDB 等]
- [部署和基础设施，如 Docker, AWS 等]

## ⚠️ RISK_ASSESSMENT
[投资风险等级和推理，考虑开源项目特有风险]

## 💡 RECOMMENDATION
[低/中等/高投资建议，基于Cathedral平台机制]

## ✅ STRENGTHS
- [项目优势1，重点关注开源价值]
- [项目优势2]
- [项目优势3]

## ⚠️ CONCERNS
- [潜在担忧1，包括技术和社区风险]
- [潜在担忧2]
- [潜在担忧3]
      `.trim();
    } else {
      return `
🤖 You are an expert GitHub repository analyst and investment advisor specializing in analyzing open source projects for the Cathedral platform. Please provide a comprehensive investment analysis based on the following background knowledge and repository data.

${projectKnowledge}

${analysisGuidelines}

## 📊 Current Analysis Project Data

### 🏷️ Repository Data:
- 📝 Name: ${context.repository.name}
- 👤 Owner: ${context.repository.owner}
- 📄 Description: ${context.repository.description}
- ⭐ Stars: ${context.repository.stars}
- 🍴 Forks: ${context.repository.forks}
- 👥 Contributors: ${context.repository.contributors}
- 🔀 Is Fork: ${context.repository.isFork}
- 📅 Created: ${context.repository.createdAt}
- 🔗 GitHub Link: ${context.repository.link}

### 💰 Pool Data:
- 🏦 Pool Address: ${context.pool.address}
- 🪙 Token Mint: ${context.pool.tokenMint}
- 👤 Creator: ${context.pool.creator}

### 📈 Market Data:
- 📊 Total Supply: ${context.overview.totalSupply}
- 💎 SOL Reserve: ${context.overview.solReserve}
- 📈 Total Volume: ${context.overview.totalVolume}

${
  context.githubAnalysis
    ? `
### 🔍 GitHub Detailed Analysis:
- 📊 Repository Status: ${
        context.githubAnalysis.details?.archived ? 'Archived' : 'Active'
      }
- 💻 Primary Languages: ${Object.keys(context.githubAnalysis.languages || {})
        .slice(0, 3)
        .join(', ')}
- 📝 Recent Commits: ${context.githubAnalysis.recentCommits?.length || 0}
- 🐛 Open Issues: ${
        context.githubAnalysis.recentIssues?.filter((i) => i.state === 'open')
          .length || 0
      }
- 🔄 Open PRs: ${
        context.githubAnalysis.recentPullRequests?.filter(
          (pr) => pr.state === 'open',
        ).length || 0
      }
- 👥 Contributors: ${context.githubAnalysis.contributors?.length || 0}
- 🚀 Recent Releases: ${context.githubAnalysis.releases?.length || 0}
- 📈 Traffic Data: ${
        context.githubAnalysis.traffic ? 'Available' : 'Not Available'
      }
`
    : ''
}

Please provide a structured analysis in the following format, considering Cathedral platform characteristics and open source investment principles:

**Important Format Requirements:**
- Each list item must be a complete sentence or phrase
- Do not use parentheses or special symbols in list items
- Tech stack should only list core technologies, not include GitHub, Git, or other common tools
- Each list item should be independent and complete, do not split across lines

## 📊 OVERVIEW
[2-3 sentence project summary, focusing on value within Cathedral ecosystem]

## 🛠️ TECH_STACK
- [Main technologies, e.g., React, Node.js, Python]
- [Database technologies, e.g., PostgreSQL, MongoDB]
- [Infrastructure and deployment, e.g., Docker, AWS]

## ⚠️ RISK_ASSESSMENT
[Investment risk level and reasoning, considering open source specific risks]

## 💡 RECOMMENDATION
[Low/Moderate/High investment recommendation, based on Cathedral platform mechanisms]

## ✅ STRENGTHS
- [Project strength 1, focusing on open source value]
- [Project strength 2]
- [Project strength 3]

## ⚠️ CONCERNS
- [Potential concern 1, including technical and community risks]
- [Potential concern 2]
- [Potential concern 3]
      `.trim();
    }
  }

  private createChatPrompt(
    context: any,
    userMessage: string,
    userLanguage: string = 'en',
  ): string {
    const isChinese =
      userLanguage.toLowerCase().includes('zh') ||
      userLanguage.toLowerCase().includes('chinese');

    // Note: Project knowledge removed from chat prompt to focus on direct answers

    if (isChinese) {
      return `
🤖 你是一位专业的GitHub仓库分析师和投资顾问，专门为Cathedral平台分析开源项目。

## 📋 当前仓库信息

🏷️ 仓库: ${context.repository.name} by ${context.repository.owner}
📝 描述: ${context.repository.description}
⭐ 星标: ${context.repository.stars}, 🍴 分叉: ${context.repository.forks}
👥 贡献者: ${context.repository.contributors}
💰 市值: ${
        context.overview.totalSupply *
        (context.overview.solReserve / context.overview.totalSupply || 0)
      } SOL
📈 总交易量: ${context.overview.totalVolume} SOL

❓ 用户问题: ${userMessage}

## 🎯 回答策略

**优先原则：直接回答用户的具体问题，而不是套用模板！**

### 智能回答模式：

1. **具体问题直接回答**：
   - 如果用户问的是具体问题（如"这个项目用什么技术？"、"最近有更新吗？"、"有多少贡献者？"等）
   - 直接基于现有信息回答，必要时才调用工具获取补充数据
   - 避免不必要的工具调用和延迟

2. **模糊问题才用模板**：
   - 如果用户问的是模糊问题（如"这个项目怎么样？"、"值得投资吗？"、"分析一下"等）
   - 才使用完整的分析模板和工具调用

3. **工具调用原则**：
   - 只有在现有信息无法回答用户问题时才调用工具
   - 优先使用现有信息，工具调用作为补充
   - 避免为了调用工具而调用工具

## 🛠️ 可用工具（仅在必要时使用）

- 🔍 getRepositoryDetails: 获取仓库详细信息
- 📝 getRepositoryCommits: 获取最近的提交记录
- 🐛 getRepositoryIssues: 获取问题和讨论
- 🔄 getRepositoryPullRequests: 获取拉取请求
- 👥 getRepositoryContributors: 获取贡献者信息
- 💻 getRepositoryLanguages: 获取编程语言
- 🚀 getRepositoryReleases: 获取发布版本
- 📊 getRepositoryTraffic: 获取流量数据

## 📝 回答要求

1. **直接性**：优先直接回答用户问题，不要绕弯子
2. **相关性**：回答必须与用户问题高度相关
3. **简洁性**：简洁明了，避免冗长的模板化回答
4. **准确性**：基于事实回答，不要猜测
5. **实用性**：提供对用户有实际价值的信息

## ⚠️ 关键：文本回答是强制性的

**你必须始终生成文本回答！**

- 如果你调用了工具，你必须基于工具结果生成完整的文本回答
- 绝不能只调用工具而不提供文本回答
- 调用工具后，综合信息并向用户提供清晰的答案
- 文本回答应该直接回答用户的问题，使用工具调用获得的数据

**重要提醒：用户问什么就答什么，不要总是套用分析模板！**
      `.trim();
    } else {
      return `
🤖 You are an expert GitHub repository analyst and investment advisor specializing in analyzing open source projects for the Cathedral platform.

## 📋 Current Repository Information

🏷️ Repository: ${context.repository.name} by ${context.repository.owner}
📝 Description: ${context.repository.description}
⭐ Stars: ${context.repository.stars}, 🍴 Forks: ${context.repository.forks}
👥 Contributors: ${context.repository.contributors}
💰 Market Cap: ${
        context.overview.totalSupply *
        (context.overview.solReserve / context.overview.totalSupply || 0)
      } SOL
📈 Total Volume: ${context.overview.totalVolume} SOL

❓ User Question: ${userMessage}

## 🎯 Response Strategy

**Priority Principle: Answer the user's specific question directly, don't use templates!**

### Smart Response Mode:

1. **Direct answers for specific questions**:
   - If the user asks specific questions (like "What technology does this project use?", "Any recent updates?", "How many contributors?" etc.)
   - Answer directly based on available information, only call tools when necessary for supplementary data
   - Avoid unnecessary tool calls and delays

2. **Use templates only for vague questions**:
   - If the user asks vague questions (like "How is this project?", "Is it worth investing?", "Analyze this" etc.)
   - Then use the complete analysis template and tool calls

3. **Tool calling principles**:
   - Only call tools when existing information cannot answer the user's question
   - Prioritize existing information, use tools as supplements
   - Avoid calling tools just for the sake of calling tools

## 🛠️ Available Tools (use only when necessary)

- 🔍 getRepositoryDetails: Get detailed repository information
- 📝 getRepositoryCommits: Get recent commits
- 🐛 getRepositoryIssues: Get issues and discussions
- 🔄 getRepositoryPullRequests: Get pull requests
- 👥 getRepositoryContributors: Get contributor information
- 💻 getRepositoryLanguages: Get programming languages
- 🚀 getRepositoryReleases: Get releases
- 📊 getRepositoryTraffic: Get traffic data

## 📝 Response Requirements

1. **Directness**: Prioritize direct answers to user questions, don't beat around the bush
2. **Relevance**: Responses must be highly relevant to the user's question
3. **Conciseness**: Be concise and clear, avoid lengthy templated responses
4. **Accuracy**: Answer based on facts, don't speculate
5. **Practicality**: Provide information that has actual value to the user

## ⚠️ CRITICAL: Text Response is MANDATORY

**YOU MUST ALWAYS GENERATE A TEXT RESPONSE!**

- If you call tools, you MUST generate a comprehensive text response based on the tool results
- NEVER finish with just tool calls without providing a text response
- After calling tools, synthesize the information and provide a clear answer to the user
- The text response should directly address the user's question using the data from tool calls

**Important Reminder: Answer what the user asks, don't always use analysis templates!**
      `.trim();
    }
  }

  private parseAnalysisResponse(
    text: string,
    repositoryId: number,
  ): RepositoryAnalysisDto {
    console.log('Parsing AI response:', text);

    // Parse markdown format response
    const lines = text.split('\n');

    // Extract sections using markdown headers - try multiple variations including emoji
    const overview =
      this.extractMarkdownSection(lines, '📊 OVERVIEW') ||
      this.extractMarkdownSection(lines, 'OVERVIEW') ||
      this.extractMarkdownSection(lines, 'Overview') ||
      this.extractMarkdownSection(lines, 'overview');

    const techStackText =
      this.extractMarkdownSection(lines, '🛠️ TECH_STACK') ||
      this.extractMarkdownSection(lines, 'TECH_STACK') ||
      this.extractMarkdownSection(lines, 'Tech Stack') ||
      this.extractMarkdownSection(lines, 'Tech Stack:') ||
      this.extractMarkdownSection(lines, 'TECH_STACK:');
    const techStack = this.parseListItems(techStackText);

    const riskAssessment =
      this.extractMarkdownSection(lines, '⚠️ RISK_ASSESSMENT') ||
      this.extractMarkdownSection(lines, 'RISK_ASSESSMENT') ||
      this.extractMarkdownSection(lines, 'Risk Assessment') ||
      this.extractMarkdownSection(lines, 'Risk Assessment:') ||
      this.extractMarkdownSection(lines, 'RISK_ASSESSMENT:');

    const recommendation =
      this.extractMarkdownSection(lines, '💡 RECOMMENDATION') ||
      this.extractMarkdownSection(lines, 'RECOMMENDATION') ||
      this.extractMarkdownSection(lines, 'Recommendation') ||
      this.extractMarkdownSection(lines, 'Recommendation:') ||
      this.extractMarkdownSection(lines, 'RECOMMENDATION:');

    const strengthsText =
      this.extractMarkdownSection(lines, '✅ STRENGTHS') ||
      this.extractMarkdownSection(lines, 'STRENGTHS') ||
      this.extractMarkdownSection(lines, 'Strengths') ||
      this.extractMarkdownSection(lines, 'Strengths:') ||
      this.extractMarkdownSection(lines, 'STRENGTHS:');
    const strengths = this.parseListItems(strengthsText);

    const concernsText =
      this.extractMarkdownSection(lines, '⚠️ CONCERNS') ||
      this.extractMarkdownSection(lines, 'CONCERNS') ||
      this.extractMarkdownSection(lines, 'Concerns') ||
      this.extractMarkdownSection(lines, 'Concerns:') ||
      this.extractMarkdownSection(lines, 'CONCERNS:');
    const concerns = this.parseListItems(concernsText);

    console.log('Parsed sections:', {
      overview,
      techStack,
      riskAssessment,
      recommendation,
      strengths,
      concerns,
    });

    return {
      repositoryId,
      overview: overview || 'Analysis in progress...',
      techStack: techStack,
      metrics: {},
      riskAssessment: riskAssessment || 'Analysis pending',
      recommendation: recommendation || 'Moderate',
      strengths: strengths,
      concerns: concerns,
    };
  }

  private extractValue(lines: string[], key: string): string {
    const line = lines.find((l) => l.startsWith(key));
    return line ? line.replace(key, '').trim() : '';
  }

  private parseListItems(text: string): string[] {
    if (!text || text.trim() === '') {
      return [];
    }

    // Handle different list formats
    const items: string[] = [];

    // First, try to parse as markdown list items (lines starting with - or *)
    const lines = text.split('\n');
    const listItems: string[] = [];

    for (const line of lines) {
      const trimmedLine = line.trim();

      // Check if this is a list item
      if (trimmedLine.match(/^[-*+]\s+/)) {
        // Extract content after the bullet point
        const content = trimmedLine.replace(/^[-*+]\s+/, '').trim();
        if (content) {
          listItems.push(content);
        }
      } else if (
        trimmedLine &&
        !trimmedLine.startsWith('##') &&
        !trimmedLine.startsWith('#')
      ) {
        // If it's not a list item but has content, it might be a continuation
        // Only add if we have existing list items (continuation of previous item)
        if (listItems.length > 0) {
          // Append to the last item
          listItems[listItems.length - 1] += ' ' + trimmedLine;
        }
      }
    }

    // If we found markdown list items, use them
    if (listItems.length > 0) {
      for (const item of listItems) {
        const cleanItem = this.cleanMarkdownItem(item);
        if (cleanItem && cleanItem.length > 2) {
          items.push(cleanItem);
        }
      }
    } else {
      // Fallback: split by common delimiters but be more careful
      const rawItems = text
        .split(/[,;]/) // Only split by comma and semicolon, not by dash or newline
        .map((item) => item.trim())
        .filter((item) => item.length > 0);

      for (const item of rawItems) {
        const cleanItem = this.cleanMarkdownItem(item);
        if (cleanItem && cleanItem.length > 2) {
          items.push(cleanItem);
        }
      }
    }

    return items;
  }

  private cleanMarkdownItem(item: string): string {
    // Remove markdown list markers
    let cleanItem = item
      .replace(/^[-*+]\s*/, '') // Remove bullet points
      .replace(/^\d+\.\s*/, '') // Remove numbered lists
      .replace(/^-\s*/, '') // Remove leading dashes
      .trim();

    // Remove extra markdown formatting but preserve content
    cleanItem = cleanItem
      .replace(/^\*\*(.*)\*\*$/, '$1') // Remove bold markers
      .replace(/^\*(.*)\*$/, '$1') // Remove italic markers
      .replace(/^`(.*)`$/, '$1') // Remove code markers
      .trim();

    return cleanItem;
  }

  private extractMarkdownSection(lines: string[], sectionName: string): string {
    // Look for both markdown headers and bold text patterns
    const headerPatterns = [
      `#### **${sectionName}**`,
      `#### ${sectionName}`,
      `### **${sectionName}**`,
      `### ${sectionName}`,
      `## **${sectionName}**`,
      `## ${sectionName}`,
      `# **${sectionName}**`,
      `# ${sectionName}`,
      `**${sectionName}:**`,
      `**${sectionName}**`,
      `${sectionName}:`,
    ];

    let startIndex = -1;
    let matchedPattern = '';
    for (const pattern of headerPatterns) {
      startIndex = lines.findIndex((line) => line.includes(pattern));
      if (startIndex !== -1) {
        matchedPattern = pattern;
        break;
      }
    }

    if (startIndex === -1) {
      console.log(`Section ${sectionName} not found`);
      return '';
    }

    console.log(
      `Found section ${sectionName} with pattern ${matchedPattern} at line ${startIndex}`,
    );

    // Find the content until the next section or end
    const content = [];
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();

      // If this is the header line, extract content after the colon (if any)
      if (line.includes(matchedPattern)) {
        const afterColon = line.split(':').slice(1).join(':').trim();
        if (afterColon) {
          content.push(afterColon);
        }
        continue;
      }

      // Stop if we hit another markdown header (but not the current section)
      if (
        (line.startsWith('####') ||
          line.startsWith('###') ||
          line.startsWith('##') ||
          line.startsWith('#')) &&
        !line.includes(matchedPattern)
      ) {
        break;
      }

      // Skip empty lines at the beginning
      if (content.length === 0 && !line) continue;

      // For list items, preserve the line structure
      if (line.startsWith('-') || line.startsWith('*') || /^\d+\./.test(line)) {
        content.push(line);
      } else if (line && content.length > 0) {
        // If we have content and this line doesn't start with a header, it might be a continuation
        // Check if the previous line was a list item
        const prevLine = content[content.length - 1];
        if (
          prevLine &&
          (prevLine.startsWith('-') ||
            prevLine.startsWith('*') ||
            /^\d+\./.test(prevLine))
        ) {
          // This is a continuation of the previous list item
          content[content.length - 1] += ' ' + line;
        } else {
          content.push(line);
        }
      } else if (line) {
        content.push(line);
      }
    }

    const result = content.join('\n').trim();
    console.log(`Extracted ${sectionName}:`, result);
    return result;
  }

  private detectLanguage(text: string): string {
    // Simple language detection based on common Chinese characters
    const chineseRegex = /[\u4e00-\u9fff]/;
    if (chineseRegex.test(text)) {
      return 'zh';
    }
    return 'en';
  }

  private createToolBasedFallbackPrompt(
    context: any,
    userMessage: string,
    userLanguage: string,
  ): string {
    const isChinese =
      userLanguage.toLowerCase().includes('zh') ||
      userLanguage.toLowerCase().includes('chinese');

    if (isChinese) {
      return `你是一位GitHub仓库分析师。你刚刚成功使用GitHub API工具获取了仓库"${context.repository.name}"（所有者：${context.repository.owner}）的数据。

**重要：直接回答用户的具体问题，不要套用分析模板！**

用户问题：${userMessage}

仓库基本信息：
- 名称：${context.repository.name}
- 所有者：${context.repository.owner}
- 描述：${context.repository.description}
- 星标：${context.repository.stars}
- 分叉：${context.repository.forks}
- 贡献者：${context.repository.contributors}

**回答要求：**
1. 直接回答用户的具体问题
2. 基于获取的数据提供准确信息
3. 简洁明了，避免冗长的模板化回答
4. 如果用户问的是具体问题，就具体回答
5. 如果用户问的是模糊问题，才提供全面分析

**记住：用户问什么就答什么！**`;
    } else {
      return `You are a GitHub repository analyst. You just successfully retrieved data for the repository "${context.repository.name}" by ${context.repository.owner} using GitHub API tools. 

**Important: Answer the user's specific question directly, don't use analysis templates!**

User question: ${userMessage}

Repository basic info:
- Name: ${context.repository.name}
- Owner: ${context.repository.owner}
- Description: ${context.repository.description}
- Stars: ${context.repository.stars}
- Forks: ${context.repository.forks}
- Contributors: ${context.repository.contributors}

**Response Requirements:**
1. Answer the user's specific question directly
2. Provide accurate information based on retrieved data
3. Be concise and clear, avoid lengthy templated responses
4. If user asks specific questions, give specific answers
5. If user asks vague questions, then provide comprehensive analysis

**Remember: Answer what the user asks!**`;
    }
  }

  private createSimpleFallbackPrompt(
    context: any,
    userMessage: string,
    userLanguage: string,
  ): string {
    const isChinese =
      userLanguage.toLowerCase().includes('zh') ||
      userLanguage.toLowerCase().includes('chinese');

    if (isChinese) {
      return `请直接回答用户的问题。用户问题：${userMessage}

仓库信息：
- 名称：${context.repository.name}
- 所有者：${context.repository.owner}
- 描述：${context.repository.description}
- 星标：${context.repository.stars}
- 分叉：${context.repository.forks}
- 贡献者：${context.repository.contributors}

请用中文回复，直接回答用户的具体问题，简洁明了。`;
    } else {
      return `Please answer the user's question directly. User question: ${userMessage}

Repository info:
- Name: ${context.repository.name}
- Owner: ${context.repository.owner}
- Description: ${context.repository.description}
- Stars: ${context.repository.stars}
- Forks: ${context.repository.forks}
- Contributors: ${context.repository.contributors}

Please answer the user's specific question directly and concisely.`;
    }
  }

  private generateSessionId(): string {
    return `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create technical analysis prompt
   */
  private createTechnicalAnalysisPrompt(
    context: any,
    userLanguage: string = 'en',
  ): string {
    const isChinese =
      userLanguage.toLowerCase().includes('zh') ||
      userLanguage.toLowerCase().includes('chinese');

    if (isChinese) {
      return `
🔧 技术分析专家 - 专注于技术栈和开发质量分析

## 📋 仓库信息

🏷️ 仓库: ${context.repository.name} by ${context.repository.owner}
📝 描述: ${context.repository.description}
⭐ 星标: ${context.repository.stars}, 🍴 分叉: ${context.repository.forks}
👥 贡献者: ${context.repository.contributors}
📅 创建时间: ${context.repository.createdAt}

## 🎯 技术分析重点

请从以下技术角度深入分析这个仓库：

### 🔧 技术栈分析
- 主要编程语言和技术框架
- 技术选型的合理性和先进性
- 技术栈的完整性和成熟度
- 与其他类似项目的技术对比

### 📊 代码质量评估
- 代码结构和组织方式
- 文档完整性和质量
- 测试覆盖率和质量
- 代码规范和最佳实践

### 🚀 开发活跃度
- 提交频率和规律性
- 版本发布节奏
- 问题修复速度
- 新功能开发进度

### 🔄 技术维护性
- 依赖管理情况
- 安全更新及时性
- 技术债务情况
- 长期维护可行性

请提供详细的技术分析报告，重点关注技术优势和潜在的技术风险。
      `.trim();
    } else {
      return `
🔧 Technical Analysis Expert - Focus on technology stack and development quality

## 📋 Repository Information

🏷️ Repository: ${context.repository.name} by ${context.repository.owner}
📝 Description: ${context.repository.description}
⭐ Stars: ${context.repository.stars}, 🍴 Forks: ${context.repository.forks}
👥 Contributors: ${context.repository.contributors}
📅 Created: ${context.repository.createdAt}

## 🎯 Technical Analysis Focus

Please provide an in-depth technical analysis of this repository from the following perspectives:

### 🔧 Technology Stack Analysis
- Primary programming languages and frameworks
- Rationality and advancement of technology choices
- Completeness and maturity of tech stack
- Technical comparison with similar projects

### 📊 Code Quality Assessment
- Code structure and organization
- Documentation completeness and quality
- Test coverage and quality
- Code standards and best practices

### 🚀 Development Activity
- Commit frequency and regularity
- Release rhythm
- Bug fix speed
- New feature development progress

### 🔄 Technical Maintainability
- Dependency management
- Security update timeliness
- Technical debt situation
- Long-term maintenance feasibility

Please provide a detailed technical analysis report, focusing on technical advantages and potential technical risks.
      `.trim();
    }
  }

  /**
   * Create investment analysis prompt
   */
  private createInvestmentAnalysisPrompt(
    context: any,
    userLanguage: string = 'en',
  ): string {
    const isChinese =
      userLanguage.toLowerCase().includes('zh') ||
      userLanguage.toLowerCase().includes('chinese');

    if (isChinese) {
      return `
💰 投资分析专家 - 专注于投资潜力和市场价值分析

## 📋 仓库信息

🏷️ 仓库: ${context.repository.name} by ${context.repository.owner}
📝 描述: ${context.repository.description}
⭐ 星标: ${context.repository.stars}, 🍴 分叉: ${context.repository.forks}
👥 贡献者: ${context.repository.contributors}
💰 市值: ${
        context.overview.totalSupply *
        (context.overview.solReserve / context.overview.totalSupply || 0)
      } SOL
📈 总交易量: ${context.overview.totalVolume} SOL

## 🎯 投资分析重点

请从以下投资角度深入分析这个项目：

### 📈 市场潜力评估
- 项目在Cathedral生态中的定位和价值
- 目标用户群体和市场规模
- 竞争优势和差异化特点
- 未来增长潜力分析

### 💎 投资价值分析
- 当前估值合理性
- 与同类项目的价值对比
- 投资回报预期
- 流动性分析

### 🏆 项目质量评估
- 团队背景和开发能力
- 项目完成度和产品成熟度
- 社区支持和用户反馈
- 长期发展可持续性

### ⚡ 投资时机判断
- 当前市场环境下的投资机会
- 最佳投资时机建议
- 投资策略建议
- 风险收益比分析

请提供专业的投资分析报告，包括具体的投资建议和风险提示。
      `.trim();
    } else {
      return `
💰 Investment Analysis Expert - Focus on investment potential and market value

## 📋 Repository Information

🏷️ Repository: ${context.repository.name} by ${context.repository.owner}
📝 Description: ${context.repository.description}
⭐ Stars: ${context.repository.stars}, 🍴 Forks: ${context.repository.forks}
👥 Contributors: ${context.repository.contributors}
💰 Market Cap: ${
        context.overview.totalSupply *
        (context.overview.solReserve / context.overview.totalSupply || 0)
      } SOL
📈 Total Volume: ${context.overview.totalVolume} SOL

## 🎯 Investment Analysis Focus

Please provide an in-depth investment analysis of this project from the following perspectives:

### 📈 Market Potential Assessment
- Project positioning and value in Cathedral ecosystem
- Target user base and market size
- Competitive advantages and differentiation
- Future growth potential analysis

### 💎 Investment Value Analysis
- Current valuation rationality
- Value comparison with similar projects
- Investment return expectations
- Liquidity analysis

### 🏆 Project Quality Assessment
- Team background and development capabilities
- Project completion and product maturity
- Community support and user feedback
- Long-term development sustainability

### ⚡ Investment Timing Analysis
- Investment opportunities in current market environment
- Best investment timing recommendations
- Investment strategy suggestions
- Risk-return ratio analysis

Please provide a professional investment analysis report, including specific investment recommendations and risk warnings.
      `.trim();
    }
  }

  /**
   * Create community analysis prompt
   */
  private createCommunityAnalysisPrompt(
    context: any,
    userLanguage: string = 'en',
  ): string {
    const isChinese =
      userLanguage.toLowerCase().includes('zh') ||
      userLanguage.toLowerCase().includes('chinese');

    if (isChinese) {
      return `
👥 社区分析专家 - 专注于社区健康和开发者活跃度分析

## 📋 仓库信息

🏷️ 仓库: ${context.repository.name} by ${context.repository.owner}
📝 描述: ${context.repository.description}
⭐ 星标: ${context.repository.stars}, 🍴 分叉: ${context.repository.forks}
👥 贡献者: ${context.repository.contributors}
📅 创建时间: ${context.repository.createdAt}

## 🎯 社区分析重点

请从以下社区角度深入分析这个项目：

### 👥 社区规模与活跃度
- 社区成员数量和增长趋势
- 用户参与度和互动频率
- 社区讨论质量和深度
- 社区文化和发展氛围

### 🔧 开发者生态
- 核心开发团队构成
- 贡献者多样性和分布
- 开发者活跃度和参与度
- 代码贡献质量和数量

### 📢 社区治理
- 项目治理结构和决策机制
- 社区反馈处理效率
- 透明度和管理水平
- 社区规则和规范执行

### 🌟 社区影响力
- 在开源社区中的声誉
- 社交媒体关注度
- 媒体报道和行业认可
- 对相关领域的影响

### 🔄 社区可持续发展
- 社区增长动力和机制
- 新成员吸引和培养
- 社区长期发展策略
- 潜在挑战和风险

请提供详细的社区分析报告，重点关注社区健康度和发展潜力。
      `.trim();
    } else {
      return `
👥 Community Analysis Expert - Focus on community health and developer activity

## 📋 Repository Information

🏷️ Repository: ${context.repository.name} by ${context.repository.owner}
📝 Description: ${context.repository.description}
⭐ Stars: ${context.repository.stars}, 🍴 Forks: ${context.repository.forks}
👥 Contributors: ${context.repository.contributors}
📅 Created: ${context.repository.createdAt}

## 🎯 Community Analysis Focus

Please provide an in-depth community analysis of this project from the following perspectives:

### 👥 Community Size and Activity
- Community member count and growth trends
- User engagement and interaction frequency
- Quality and depth of community discussions
- Community culture and development atmosphere

### 🔧 Developer Ecosystem
- Core development team composition
- Contributor diversity and distribution
- Developer activity and participation
- Code contribution quality and quantity

### 📢 Community Governance
- Project governance structure and decision-making mechanisms
- Community feedback processing efficiency
- Transparency and management level
- Community rules and standards enforcement

### 🌟 Community Influence
- Reputation in the open source community
- Social media attention
- Media coverage and industry recognition
- Impact on related fields

### 🔄 Community Sustainability
- Community growth drivers and mechanisms
- New member attraction and cultivation
- Long-term community development strategy
- Potential challenges and risks

Please provide a detailed community analysis report, focusing on community health and development potential.
      `.trim();
    }
  }

  /**
   * Create risk analysis prompt
   */
  private createRiskAnalysisPrompt(
    context: any,
    userLanguage: string = 'en',
  ): string {
    const isChinese =
      userLanguage.toLowerCase().includes('zh') ||
      userLanguage.toLowerCase().includes('chinese');

    if (isChinese) {
      return `
⚠️ 风险评估专家 - 专注于潜在风险和关注点分析

## 📋 仓库信息

🏷️ 仓库: ${context.repository.name} by ${context.repository.owner}
📝 描述: ${context.repository.description}
⭐ 星标: ${context.repository.stars}, 🍴 分叉: ${context.repository.forks}
👥 贡献者: ${context.repository.contributors}
💰 市值: ${
        context.overview.totalSupply *
        (context.overview.solReserve / context.overview.totalSupply || 0)
      } SOL
📈 总交易量: ${context.overview.totalVolume} SOL

## 🎯 风险分析重点

请从以下风险角度深入分析这个项目：

### 🔒 技术风险
- 代码质量和安全性问题
- 技术债务和架构风险
- 依赖项安全性和维护风险
- 技术过时和升级风险

### 👥 团队风险
- 核心开发者依赖风险
- 团队稳定性风险
- 技能传承和知识管理风险
- 团队冲突和治理风险

### 📊 市场风险
- 市场竞争和替代品风险
- 市场需求变化风险
- 监管政策风险
- 经济环境影响风险

### 💰 投资风险
- 流动性风险
- 估值波动风险
- 投资集中度风险
- 退出机制风险

### 🔄 运营风险
- 项目维护和更新风险
- 社区管理风险
- 知识产权风险
- 合规和法律风险

### 🌐 系统性风险
- 平台依赖风险
- 网络攻击风险
- 数据安全风险
- 基础设施风险

请提供详细的风险分析报告，包括风险等级评估和缓解建议。
      `.trim();
    } else {
      return `
⚠️ Risk Analysis Expert - Focus on potential risks and concerns

## 📋 Repository Information

🏷️ Repository: ${context.repository.name} by ${context.repository.owner}
📝 Description: ${context.repository.description}
⭐ Stars: ${context.repository.stars}, 🍴 Forks: ${context.repository.forks}
👥 Contributors: ${context.repository.contributors}
💰 Market Cap: ${
        context.overview.totalSupply *
        (context.overview.solReserve / context.overview.totalSupply || 0)
      } SOL
📈 Total Volume: ${context.overview.totalVolume} SOL

## 🎯 Risk Analysis Focus

Please provide an in-depth risk analysis of this project from the following perspectives:

### 🔒 Technical Risks
- Code quality and security issues
- Technical debt and architecture risks
- Dependency security and maintenance risks
- Technology obsolescence and upgrade risks

### 👥 Team Risks
- Core developer dependency risks
- Team stability risks
- Knowledge transfer and management risks
- Team conflicts and governance risks

### 📊 Market Risks
- Market competition and substitution risks
- Market demand change risks
- Regulatory policy risks
- Economic environment impact risks

### 💰 Investment Risks
- Liquidity risks
- Valuation volatility risks
- Investment concentration risks
- Exit mechanism risks

### 🔄 Operational Risks
- Project maintenance and update risks
- Community management risks
- Intellectual property risks
- Compliance and legal risks

### 🌐 Systemic Risks
- Platform dependency risks
- Cyber attack risks
- Data security risks
- Infrastructure risks

Please provide a detailed risk analysis report, including risk level assessment and mitigation recommendations.
      `.trim();
    }
  }
}
