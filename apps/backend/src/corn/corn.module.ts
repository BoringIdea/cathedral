import { Module } from '@nestjs/common';
import { CornService } from './corn.service';

@Module({
  providers: [CornService],
})
export class CornModule {}
