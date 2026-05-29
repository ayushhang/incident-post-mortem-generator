import { Controller, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { HealthService } from './health.service';

@ApiTags('health')
@Controller('api/v1/health')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class HealthController {
  constructor(private healthService: HealthService) {}

  // TODO: Implement health endpoints
}
