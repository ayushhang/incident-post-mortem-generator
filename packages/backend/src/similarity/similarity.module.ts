import { Module } from '@nestjs/common';
import { SimilarityService } from './similarity.service';
import { SimilarityController } from './similarity.controller';
import { PrismaModule } from '../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [SimilarityService],
  controllers: [SimilarityController],
  exports: [SimilarityService],
})
export class SimilarityModule {}
