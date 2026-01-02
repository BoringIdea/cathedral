import { Module } from '@nestjs/common';
import { RepositoriesController } from './repositories.controller';
import { RepositoriesService } from './repositories.service';
import { CacheModule } from '../shared/cache.module';
import { AuthModule } from '../auth/auth.module';
@Module({
  imports: [CacheModule, AuthModule],
  controllers: [RepositoriesController],
  providers: [RepositoriesService],
  exports: [RepositoriesService], // Export for use by AdminController
})
export class RepositoriesModule {}
