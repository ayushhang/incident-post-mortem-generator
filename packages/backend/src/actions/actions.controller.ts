import { Controller, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ActionsService } from './actions.service';

@ApiTags('actions')
@Controller('api/v1/actions')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class ActionsController {
  constructor(private actionsService: ActionsService) {}

  // TODO: Implement actions endpoints
}
