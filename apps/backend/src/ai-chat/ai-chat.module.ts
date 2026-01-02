import { Module } from '@nestjs/common';
import { AIChatController } from './ai-chat.controller';
import { AIChatService } from './ai-chat.service';
import { GitHubToolsService } from './github-tools.service';
import { ProjectKnowledgeService } from './project-knowledge.service';
import { AnalysisCacheService } from './analysis-cache.service';
import { AIToolsService } from './ai-tools.service';
import { RepositoriesModule } from '../repositories/repositories.module';

@Module({
  imports: [RepositoriesModule],
  controllers: [AIChatController],
  providers: [
    AIChatService,
    GitHubToolsService,
    ProjectKnowledgeService,
    AnalysisCacheService,
    AIToolsService,
  ],
  exports: [AIChatService],
})
export class AIChatModule {}
