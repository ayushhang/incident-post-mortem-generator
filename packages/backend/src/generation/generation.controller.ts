import {
  Controller,
  UseGuards,
  Post,
  Get,
  Param,
  Patch,
  Body,
  Logger,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { GenerationService } from "./generation.service";
import { UpdatePostmortemRequest } from "@incidents/shared";

@ApiTags("generation")
@Controller("api/v1/incidents/:incidentId/postmortem")
@UseGuards(AuthGuard("jwt"))
@ApiBearerAuth()
export class GenerationController {
  private readonly logger = new Logger(GenerationController.name);

  constructor(private generationService: GenerationService) {}

  @Post("generate")
  @ApiOperation({ summary: "Generate post-mortem from incident data" })
  async generate(@Param("incidentId") incidentId: string) {
    try {
      this.logger.log(`Postmortem generation requested for incident: ${incidentId}`);
      const result = await this.generationService.generatePostmortem(incidentId);
      this.logger.log(`Successfully generated postmortem for incident: ${incidentId}`);
      return result;
    } catch (error) {
      this.logger.error(
        `Failed to generate postmortem for incident ${incidentId}:`,
        error
      );
      throw error;
    }
  }

  @Get()
  @ApiOperation({ summary: "Get generated post-mortem" })
  async getPostmortem(@Param("incidentId") incidentId: string) {
    try {
      this.logger.log(`Postmortem retrieval requested for incident: ${incidentId}`);
      const result = await this.generationService.generatePostmortem(incidentId);
      return result;
    } catch (error) {
      this.logger.error(
        `Failed to get postmortem for incident ${incidentId}:`,
        error
      );
      throw error;
    }
  }

  @Patch()
  @ApiOperation({ summary: "Update post-mortem" })
  updatePostmortem(
    @Param("_incidentId") _incidentId: string,
    @Body() _input: UpdatePostmortemRequest
  ) {
    this.logger.warn("Postmortem update endpoint called - not yet implemented");
    return { success: true };
  }
}
