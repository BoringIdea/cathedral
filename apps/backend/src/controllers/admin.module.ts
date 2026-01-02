import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { HealthCheckService } from '../services/health-check.service';
import { RepositoriesModule } from '../repositories/repositories.module';

@Module({
  imports: [RepositoriesModule],
  controllers: [AdminController],
  providers: [HealthCheckService],
})
export class AdminModule {}
