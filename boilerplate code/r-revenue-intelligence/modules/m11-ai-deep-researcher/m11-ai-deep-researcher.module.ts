import { Module } from '@nestjs/common';
import { PrismaService } from './database/prisma.service';
import { AiDeepResearcherService } from './services/ai-deep-researcher.service';
import { AiDeepResearcherController } from './controllers/ai-deep-researcher.controller';

@Module({
  controllers: [AiDeepResearcherController],
  providers: [AiDeepResearcherService, PrismaService],
  exports: [AiDeepResearcherService],
})
export class M11AiDeepResearcherModule {}
