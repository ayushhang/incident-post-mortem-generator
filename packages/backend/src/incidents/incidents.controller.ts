import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { IncidentsService } from "./incidents.service";
import {
  CreateIncidentRequest,
  UpdateIncidentRequest,
  IncidentListRequest,
} from "@incidents/shared";

@ApiTags("incidents")
@Controller("api/v1/incidents")
@UseGuards(AuthGuard("jwt"))
@ApiBearerAuth()
export class IncidentsController {
  constructor(private incidentsService: IncidentsService) {}

  @Post()
  @ApiOperation({ summary: "Create a new incident" })
  async create(@Body() input: CreateIncidentRequest, @Req() req: any) {
    return this.incidentsService.create(input, req.user.sub);
  }

  @Get()
  @ApiOperation({ summary: "List all incidents" })
  async list(@Query() filters: IncidentListRequest, @Req() req: any) {
    return this.incidentsService.findAll(
      {
        page: filters.page || 1,
        limit: filters.limit || 20,
        status: filters.status,
        severity: filters.severity,
        search: filters.search,
        sortBy: (filters.sortBy as any) || "createdAt",
        sortOrder: (filters.sortOrder as any) || "desc",
      },
      req.user.role
    );
  }

  @Get(":id")
  @ApiOperation({ summary: "Get incident details" })
  async findById(@Param("id") id: string) {
    return this.incidentsService.findById(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update incident" })
  async update(
    @Param("id") id: string,
    @Body() input: UpdateIncidentRequest,
    @Req() req: any
  ) {
    return this.incidentsService.update(id, input, req.user.sub, req.user.role);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete incident" })
  async delete(@Param("id") id: string, @Req() req: any) {
    await this.incidentsService.delete(id, req.user.sub, req.user.role);
    return { success: true };
  }
}
