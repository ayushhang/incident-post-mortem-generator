import { Controller, UseGuards, Post, Get, Param, Res } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { Response } from "express";
import { ExportService } from "./export.service";

@ApiTags("export")
@Controller("api/v1/incidents/:incidentId/export")
@UseGuards(AuthGuard("jwt"))
@ApiBearerAuth()
export class ExportController {
  constructor(private exportService: ExportService) {}

  @Get("markdown")
  @ApiOperation({ summary: "Export post-mortem as Markdown" })
  async exportMarkdown(
    @Param("incidentId") incidentId: string,
    @Res() res: Response
  ) {
    const markdown = await this.exportService.exportMarkdown(incidentId);
    res.setHeader("Content-Type", "text/markdown");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="postmortem-${incidentId}.md"`
    );
    res.send(markdown);
  }

  @Get("pdf")
  @ApiOperation({ summary: "Export post-mortem as PDF" })
  async exportPDF(
    @Param("incidentId") incidentId: string,
    @Res() res: Response
  ) {
    const pdf = await this.exportService.exportPDF(incidentId);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="postmortem-${incidentId}.pdf"`
    );
    res.send(pdf);
  }
}
