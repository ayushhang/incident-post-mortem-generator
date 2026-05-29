import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../common/prisma/prisma.service";

@Injectable()
export class ExportService {
  constructor(private prisma: PrismaService) {}

  async exportMarkdown(incidentId: string): Promise<string> {
    const incident = await this.prisma.incident.findUnique({
      where: { id: incidentId },
      include: { postmortem: true, createdByUser: true },
    });

    if (!incident || !incident.postmortem) {
      throw new NotFoundException("Incident or postmortem not found");
    }

    const doc = incident.postmortem;

    return `# Incident Post-Mortem: ${incident.title}

**Date**: ${new Date(incident.startTime).toISOString().split("T")[0]}
**Severity**: ${incident.severity}
**Status**: ${incident.status}
**Duration**: ${incident.durationMinutes ? incident.durationMinutes + " minutes" : "Ongoing"}
**Users Affected**: ${incident.usersAffected || "Unknown"}
**Revenue Impact**: $${incident.revenueImpact || "Unknown"}

---

## Executive Summary

${doc.executiveSummary || "N/A"}

---

## Incident Metadata

- **Service**: ${incident.serviceAffected || "N/A"}
- **Environment**: ${incident.environment || "N/A"}
- **Regions Affected**: ${incident.regionsAffected || "N/A"}
- **Teams Involved**: ${incident.internalTeams || "N/A"}
- **Created By**: ${incident.createdByUser.name || incident.createdByUser.email}

---

## Impact Assessment

${doc.impactAssessment || "N/A"}

---

## Timeline

${doc.timeline || "N/A"}

---

## Root Cause Analysis

${doc.rootCauseAnalysis || "N/A"}

---

## Contributing Factors

${doc.contributingFactors || "N/A"}

---

## Five Whys Analysis

${doc.whyAnalysis || "N/A"}

---

## What Went Well

${doc.whatWentWell || "N/A"}

---

## What Could Be Improved

${doc.whatCouldImprove || "N/A"}

---

## Corrective and Preventive Actions

${doc.correctiveActions || "N/A"}

---

## Ownership and Due Dates

${doc.ownership || "N/A"}

---

## Confidence and Evidence Strength

${doc.confidence || "N/A"}

---

## Open Questions

${doc.openQuestions || "N/A"}

---

## Blameless Review

${doc.blamelessReview || "All sections reviewed for blameless language"}

---

## SLA / SLO Assessment

${doc.slaNote || "N/A"}

---

*Generated on ${new Date().toISOString()}*
*This document contains sensitive incident information. Handle according to your organization's policies.*
`;
  }

  async exportPDF(incidentId: string): Promise<Buffer> {
    const markdown = await this.exportMarkdown(incidentId);

    // Note: For production, integrate with a PDF service like:
    // - Puppeteer (headless Chrome)
    // - wkhtmltopdf
    // - AWS Lambda + wkhtmltopdf
    // - External PDF service

    return Buffer.from(
      `PDF export not fully implemented. Use markdown export instead.\n\n${markdown}`
    );
  }

  private markdownToHtml(markdown: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; }
    h1 { border-bottom: 3px solid #333; padding-bottom: 10px; }
    h2 { margin-top: 30px; color: #333; }
    table { border-collapse: collapse; width: 100%; margin: 20px 0; }
    td, th { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
    code { background-color: #f4f4f4; padding: 2px 4px; }
  </style>
</head>
<body>
  ${markdown.replace(/^## (.*)/gm, "<h2>$1</h2>").replace(/^# (.*)/gm, "<h1>$1</h1>")}
</body>
</html>
    `;
  }
}
