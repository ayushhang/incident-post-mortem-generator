import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "../common/prisma/prisma.service";

@Injectable()
export class ExportService {
  private readonly logger = new Logger(ExportService.name);

  constructor(private prisma: PrismaService) {}

  async exportMarkdown(incidentId: string): Promise<string> {
    try {
      this.logger.log(`Exporting markdown for incident: ${incidentId}`);

      const incident = await this.prisma.incident.findUnique({
        where: { id: incidentId },
        include: { postmortem: true, createdByUser: true },
      });

      if (!incident) {
        this.logger.error(`Incident not found: ${incidentId}`);
        throw new NotFoundException("Incident not found");
      }

      if (!incident.postmortem) {
        this.logger.warn(
          `No postmortem found for incident: ${incidentId}. Generating default markdown.`
        );
        return this.generateDefaultMarkdown(incident);
      }

      const doc = incident.postmortem;
      const cleanText = (text: string | null | undefined): string => {
        if (!text) return "";
        return text
          // Remove markdown formatting
          .replace(/\*\*/g, "")                    // Remove bold **
          .replace(/\*\*\*/g, "")                  // Remove bold italic ***
          .replace(/\*\*\*\*/g, "")                // Remove extra bold
          .replace(/\*/g, "")                      // Remove all asterisks
          .replace(/#{1,6}\s+/g, "")               // Remove headers
          .replace(/##\s+/g, "")                   // Remove ## headers
          .replace(/###\s+/g, "")                  // Remove ### headers
          .replace(/####\s+/g, "")                 // Remove #### headers
          .replace(/\[.*?\]/g, "")                 // Remove brackets
          .replace(/---/g, "")                     // Remove dividers
          .replace(/\|.*?\|/g, "")                 // Remove table pipes
          .replace(/\`\`\`/g, "")                  // Remove code blocks
          .replace(/\`/g, "")                      // Remove inline code
          .replace(/>\s+/g, "")                    // Remove blockquotes
          .replace(/[*_~]/g, "")                   // Remove all formatting chars
          .replace(/^#{1,6}\s+/gm, "")             // Remove markdown headers
          .replace(/\n{3,}/g, "\n\n")              // Clean up extra newlines
          .trim();
      };

      const markdown = `INCIDENT POST-MORTEM REPORT
${"=".repeat(60)}

INCIDENT: ${incident.title}
Generated: ${new Date().toLocaleString()}

---

KEY INFORMATION
${"-".repeat(60)}
Date: ${new Date(incident.startTime).toLocaleDateString()}
Severity: ${incident.severity}
Status: ${incident.status}
Duration: ${incident.durationMinutes ? incident.durationMinutes + " minutes" : "Ongoing"}
Users Affected: ${incident.usersAffected || "Unknown"}
Revenue Impact: $${incident.revenueImpact || "Unknown"}
Service: ${incident.serviceAffected || "N/A"}
Environment: ${incident.environment || "N/A"}
Created By: ${incident.createdByUser?.name || incident.createdByUser?.email || "System"}

---

EXECUTIVE SUMMARY
${"-".repeat(60)}
${cleanText(doc.executiveSummary) || "No summary available"}

---

ROOT CAUSE ANALYSIS
${"-".repeat(60)}
${cleanText(doc.rootCauseAnalysis) || "Analysis pending"}

---

CONTRIBUTING FACTORS
${"-".repeat(60)}
${cleanText(doc.contributingFactors) || "No contributing factors identified"}

---

FIVE WHYS ANALYSIS
${"-".repeat(60)}
${cleanText(doc.whyAnalysis) || "Analysis pending"}

---

WHAT WENT WELL
${"-".repeat(60)}
${cleanText(doc.whatWentWell) || "Review pending"}

---

AREAS FOR IMPROVEMENT
${"-".repeat(60)}
${cleanText(doc.whatCouldImprove) || "Recommendations pending"}

---

CORRECTIVE AND PREVENTIVE ACTIONS
${"-".repeat(60)}
${cleanText(doc.correctiveActions) || "Actions to be determined"}

---

CONFIDENCE ASSESSMENT
${"-".repeat(60)}
${cleanText(doc.confidence) || "Assessment pending"}

---

OPEN QUESTIONS
${"-".repeat(60)}
${cleanText(doc.openQuestions) || "No outstanding questions"}

---

ADDITIONAL NOTES
${"-".repeat(60)}
Blameless Review: ${doc.blamelessReview || "Approved for blameless language"}
SLA Assessment: ${doc.slaNote || "Not applicable"}

---

End of Report
Generated: ${new Date().toISOString()}
Confidential - Internal Use Only
`;

      this.logger.log(`Successfully exported markdown for incident: ${incidentId}`);
      return markdown;
    } catch (error) {
      this.logger.error(`Failed to export markdown for incident ${incidentId}:`, error);

      if (
        error instanceof NotFoundException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        error instanceof Error
          ? `Failed to export markdown: ${error.message}`
          : "Failed to export markdown due to an unexpected error"
      );
    }
  }

  async exportPDF(incidentId: string): Promise<Buffer> {
    try {
      this.logger.log(`Exporting PDF for incident: ${incidentId}`);

      const markdown = await this.exportMarkdown(incidentId);

      this.logger.warn(
        `PDF export not fully implemented for incident ${incidentId}. Returning markdown as text.`
      );

      return Buffer.from(
        `PDF export not fully implemented. Use markdown export instead.\n\n${markdown}`
      );
    } catch (error) {
      this.logger.error(`Failed to export PDF for incident ${incidentId}:`, error);

      if (
        error instanceof NotFoundException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        error instanceof Error
          ? `Failed to export PDF: ${error.message}`
          : "Failed to export PDF due to an unexpected error"
      );
    }
  }

  private generateDefaultMarkdown(incident: any): string {
    return `INCIDENT REPORT
${"=".repeat(60)}

INCIDENT: ${incident.title}
Generated: ${new Date().toLocaleString()}

---

KEY INFORMATION
${"-".repeat(60)}
Date: ${new Date(incident.startTime).toLocaleDateString()}
Severity: ${incident.severity}
Status: ${incident.status}
Duration: ${incident.durationMinutes ? incident.durationMinutes + " minutes" : "Ongoing"}
Users Affected: ${incident.usersAffected || "Unknown"}
Revenue Impact: $${incident.revenueImpact || "Unknown"}
Service: ${incident.serviceAffected || "N/A"}
Environment: ${incident.environment || "N/A"}
Created By: ${incident.createdByUser?.name || incident.createdByUser?.email || "System"}

---

DESCRIPTION
${"-".repeat(60)}
${incident.description || "No description provided"}

---

INCIDENT DETAILS
${"-".repeat(60)}
Service Affected: ${incident.serviceAffected || "N/A"}
Environment: ${incident.environment || "N/A"}
Regions Affected: ${incident.regionsAffected || "N/A"}
Teams Involved: ${incident.internalTeams || "N/A"}
Created At: ${new Date(incident.createdAt).toLocaleString()}

---

STATUS
${"-".repeat(60)}
Post-Mortem Analysis: Not Yet Generated

To generate a detailed post-mortem analysis with root cause analysis,
contributing factors, and corrective actions, please complete the
post-mortem generation in the application.

---

End of Report
Generated: ${new Date().toISOString()}
Confidential - Internal Use Only
`;
  }
}
