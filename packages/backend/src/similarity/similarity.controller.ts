import { Controller, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SimilarityService } from './similarity.service';

@ApiTags('similarity')
@Controller('api/v1/similarity')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class SimilarityController {
  constructor(private similarityService: SimilarityService) {}

  // TODO: Implement similarity endpoints
}
