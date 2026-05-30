import { Controller, UseGuards, Get, Param, Res, Logger } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { Response } from "express";
import { ExportService } from "./export.service";

@ApiTags("export")
@Controller("api/v1/incidents/:incidentId/export")
@UseGuards(AuthGuard("jwt"))
@ApiBearerAuth()
export class ExportController {
  private readonly logger = new Logger(ExportController.name);

  constructor(private exportService: ExportService) {}

  @Get("markdown")
  @ApiOperation({ summary: "Export post-mortem as Markdown" })
  async exportMarkdown(
    @Param("incidentId") incidentId: string,
    @Res() res: Response
  ) {
    try {
      this.logger.log(`Markdown export requested for incident: ${incidentId}`);
      const markdown = await this.exportService.exportMarkdown(incidentId);

      res.setHeader("Content-Type", "text/markdown; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="postmortem-${incidentId}.md"`
      );
      res.setHeader("Content-Length", Buffer.byteLength(markdown, "utf-8"));
      res.send(markdown);

      this.logger.log(
        `Successfully exported markdown for incident: ${incidentId}`
      );
    } catch (error) {
      this.logger.error(
        `Failed to export markdown for incident ${incidentId}:`,
        error
      );
      throw error;
    }
  }

  @Get("pdf")
  @ApiOperation({ summary: "Export post-mortem as PDF" })
  async exportPDF(
    @Param("incidentId") incidentId: string,
    @Res() res: Response
  ) {
    try {
      this.logger.log(`PDF export requested for incident: ${incidentId}`);
      const pdf = await this.exportService.exportPDF(incidentId);

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="postmortem-${incidentId}.pdf"`
      );
      res.setHeader("Content-Length", pdf.length);
      res.send(pdf);

      this.logger.log(`Successfully exported PDF for incident: ${incidentId}`);
    } catch (error) {
      this.logger.error(`Failed to export PDF for incident ${incidentId}:`, error);
      throw error;
    }
  }
}
