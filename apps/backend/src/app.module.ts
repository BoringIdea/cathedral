import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { RepositoriesModule } from './repositories/repositories.module';
import { AdminModule } from './controllers/admin.module';
import { AIChatModule } from './ai-chat/ai-chat.module';
import { MulterModule } from '@nestjs/platform-express';
import { ScheduleModule } from '@nestjs/schedule';
import { CornModule } from './corn/corn.module';

@Module({
  imports: [
    AuthModule,
    CornModule,
    RepositoriesModule,
    AdminModule,
    AIChatModule,
    ScheduleModule.forRoot(),
    MulterModule.register({
      dest: './uploads',
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
