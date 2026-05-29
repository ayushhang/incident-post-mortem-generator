import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class SimilarityService {
  constructor(private prisma: PrismaService) {}

  // TODO: Implement similarity service methods
}
