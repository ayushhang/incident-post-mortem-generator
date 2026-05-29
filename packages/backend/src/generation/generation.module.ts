import { Module } from '@nestjs/common';
import { GenerationService } from './generation.service';
import { GenerationController } from './generation.controller';
import { PrismaModule } from '../common/prisma/prisma.module';
import { LLMService } from '../common/llm/llm.service';

@Module({
  imports: [PrismaModule],
  providers: [GenerationService, LLMService],
  controllers: [GenerationController],
  exports: [GenerationService],
})
export class GenerationModule {}
