import {
  Controller,
  UseGuards,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { TimelineService } from "./timeline.service";
import { CreateTimelineEventRequest } from "@incidents/shared";

@ApiTags("timeline")
@Controller("api/v1/incidents/:incidentId/timeline")
@UseGuards(AuthGuard("jwt"))
@ApiBearerAuth()
export class TimelineController {
  constructor(private timelineService: TimelineService) {}

  @Get()
  @ApiOperation({ summary: "Get incident timeline" })
  async getTimeline(@Param("incidentId") incidentId: string) {
    return this.timelineService.getTimeline(incidentId);
  }

  @Get("metrics")
  @ApiOperation({ summary: "Get timeline metrics (MTTD, MTTE, MTTR)" })
  async getMetrics(@Param("incidentId") incidentId: string) {
    return this.timelineService.getMetrics(incidentId);
  }

  @Post("events")
  @ApiOperation({ summary: "Add timeline event" })
  async createEvent(
    @Param("incidentId") incidentId: string,
    @Body() input: CreateTimelineEventRequest
  ) {
    return this.timelineService.createEvent(incidentId, input);
  }

  @Patch("events/:eventId")
  @ApiOperation({ summary: "Update timeline event" })
  async updateEvent(
    @Param("incidentId") incidentId: string,
    @Param("eventId") eventId: string,
    @Body() input: Partial<CreateTimelineEventRequest>
  ) {
    return this.timelineService.updateEvent(incidentId, eventId, input);
  }

  @Delete("events/:eventId")
  @ApiOperation({ summary: "Delete timeline event" })
  async deleteEvent(
    @Param("incidentId") incidentId: string,
    @Param("eventId") eventId: string
  ) {
    await this.timelineService.deleteEvent(incidentId, eventId);
    return { success: true };
  }
}
