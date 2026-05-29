import { Controller, UseGuards, Post, Param } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { ValidationService } from "./validation.service";

@ApiTags("validation")
@Controller("api/v1/incidents/:incidentId/validate")
@UseGuards(AuthGuard("jwt"))
@ApiBearerAuth()
export class ValidationController {
  constructor(private validationService: ValidationService) {}

  @Post()
  @ApiOperation({ summary: "Run quality gate validations" })
  async validate(@Param("incidentId") incidentId: string) {
    return this.validationService.validate(incidentId);
  }
}
