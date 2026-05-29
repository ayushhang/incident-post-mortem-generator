import { Controller, UseGuards, Post, Get, Param, Patch, Body } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { GenerationService } from "./generation.service";
import { UpdatePostmortemRequest } from "@incidents/shared";

@ApiTags("generation")
@Controller("api/v1/incidents/:incidentId/postmortem")
@UseGuards(AuthGuard("jwt"))
@ApiBearerAuth()
export class GenerationController {
  constructor(private generationService: GenerationService) {}

  @Post("generate")
  @ApiOperation({ summary: "Generate post-mortem from incident data" })
  async generate(@Param("incidentId") incidentId: string) {
    return this.generationService.generatePostmortem(incidentId);
  }

  @Get()
  @ApiOperation({ summary: "Get generated post-mortem" })
  async getPostmortem(@Param("incidentId") incidentId: string) {
    return this.generationService.generatePostmortem(incidentId);
  }

  @Patch()
  @ApiOperation({ summary: "Update post-mortem" })
  async updatePostmortem(
    @Param("incidentId") incidentId: string,
    @Body() input: UpdatePostmortemRequest
  ) {
    // TODO: Implement update logic
    return { success: true };
  }
}
