import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../common/prisma/prisma.service";
import {
  ValidationResponse,
  QualityCheckResult,
  QualityCheckType,
  IssueSeverity,
} from "@incidents/shared";

@Injectable()
export class ValidationService {
  private blameKeywords = [
    "failed to",
    "should have",
    "didn't",
    "wasn't",
    "incompetence",
    "mistake",
    "error by",
    "user error",
    "misconfigured by",
  ];

  private vagueTerms = [
    "improve",
    "better",
    "monitor",
    "check",
    "ensure",
    "investigate",
    "review",
    "consider",
    "evaluate",
  ];

  constructor(private prisma: PrismaService) {}

  async validate(incidentId: string): Promise<ValidationResponse> {
    const incident = await this.prisma.incident.findUnique({
      where: { id: incidentId },
      include: {
        postmortem: true,
        timeline: true,
      },
    });

    if (!incident) {
      throw new NotFoundException("Incident not found");
    }

    const checks: QualityCheckResult[] = [];

    // Run all quality checks
    checks.push(this.checkBlamelessLanguage(incident));
    checks.push(...this.checkVagueActionItems(incident));
    checks.push(this.checkTimelineConflicts(incident));
    checks.push(this.checkSLABreach(incident));
    checks.push(this.checkEvidenceStrength(incident));

    // Store results
    if (incident.postmortem) {
      await this.prisma.qualityGateResult.deleteMany({
        where: { postmortemId: incident.postmortem.id },
      });

      await this.prisma.qualityGateResult.createMany({
        data: checks.map((c) => ({
          postmortemId: incident.postmortem!.id,
          checkType: c.checkType,
          passed: c.passed,
          severity: c.severity,
          message: c.message,
          suggestions: c.suggestions,
        })),
      });
    }

    const allPassed = checks.every((c) => c.passed);
    const maxSeverity = checks.reduce((max, c) => {
      const severityOrder = { INFO: 0, WARNING: 1, ERROR: 2, CRITICAL: 3 };
      return severityOrder[c.severity] > severityOrder[max] ? c.severity : max;
    }, IssueSeverity.INFO);

    return {
      incidentId,
      passed: allPassed,
      overallSeverity: maxSeverity,
      checks,
      timestamp: new Date().toISOString(),
    };
  }

  private checkBlamelessLanguage(incident: any): QualityCheckResult {
    const content = [
      incident.postmortem?.rootCauseAnalysis || "",
      incident.postmortem?.contributingFactors || "",
      incident.postmortem?.correctiveActions || "",
    ].join(" ");

    const foundKeywords = this.blameKeywords.filter((kw) =>
      content.toLowerCase().includes(kw.toLowerCase())
    );

    return {
      checkType: QualityCheckType.BLAME_LANGUAGE,
      passed: foundKeywords.length === 0,
      severity: foundKeywords.length > 0 ? IssueSeverity.ERROR : IssueSeverity.INFO,
      message: foundKeywords.length > 0
        ? `Found blame language: ${foundKeywords.join(", ")}`
        : "No blame language detected",
      suggestions:
        foundKeywords.length > 0
          ? "Reframe to focus on systems and processes, not people"
          : null,
    };
  }

  private checkVagueActionItems(incident: any): QualityCheckResult[] {
    const actions = incident.postmortem?.correctiveActions || "";
    const lines = actions.split("\n");
    const vagueItems: string[] = [];

    lines.forEach((line: string) => {
      if (this.vagueTerms.some((term) => line.toLowerCase().includes(term))) {
        vagueItems.push(line.trim());
      }
    });

    return [
      {
        checkType: QualityCheckType.VAGUE_ACTION_ITEMS,
        passed: vagueItems.length === 0,
        severity: vagueItems.length > 0 ? IssueSeverity.WARNING : IssueSeverity.INFO,
        message:
          vagueItems.length > 0
            ? `Found ${vagueItems.length} vague action items`
            : "Action items are specific and measurable",
        suggestions:
          vagueItems.length > 0
            ? "Replace vague terms with specific metrics, tools, and owners"
            : null,
      },
    ];
  }

  private checkTimelineConflicts(incident: any): QualityCheckResult {
    const conflicts = incident.timeline?.filter(
      (e: any) => e.conflicts && e.conflicts.length > 0
    ) || [];

    return {
      checkType: QualityCheckType.TIMELINE_CONFLICTS,
      passed: conflicts.length === 0,
      severity: conflicts.length > 0 ? IssueSeverity.ERROR : IssueSeverity.INFO,
      message:
        conflicts.length > 0
          ? `Found ${conflicts.length} unresolved timeline conflicts`
          : "Timeline is consistent",
      suggestions: conflicts.length > 0 ? "Review and resolve timeline conflicts" : null,
    };
  }

  private checkSLABreach(incident: any): QualityCheckResult {
    if (!incident.slaTarget || !incident.endTime) {
      return {
        checkType: QualityCheckType.SLA_BREACH,
        passed: true,
        severity: IssueSeverity.INFO,
        message: "No SLA configured",
        suggestions: null,
      };
    }

    const durationMs = incident.endTime.getTime() - incident.startTime.getTime();
    const durationMinutes = durationMs / (1000 * 60);
    const breached = durationMinutes > incident.slaTarget;

    return {
      checkType: QualityCheckType.SLA_BREACH,
      passed: !breached,
      severity: breached ? IssueSeverity.CRITICAL : IssueSeverity.INFO,
      message: breached
        ? `MTTR ${Math.round(durationMinutes)}m exceeded SLA target ${incident.slaTarget}m`
        : `MTTR within SLA target`,
      suggestions: breached ? "Analyze why resolution took longer than expected" : null,
    };
  }

  private checkEvidenceStrength(incident: any): QualityCheckResult {
    const postmortem = incident.postmortem;
    const hasContent =
      postmortem?.rootCauseAnalysis &&
      postmortem?.contributingFactors &&
      postmortem?.correctiveActions;

    const sourceCount = incident.timeline?.length || 0;

    return {
      checkType: QualityCheckType.UNSUPPORTED_CLAIMS,
      passed: hasContent && sourceCount >= 3,
      severity:
        sourceCount < 3 || !hasContent ? IssueSeverity.WARNING : IssueSeverity.INFO,
      message:
        sourceCount < 3
          ? `Limited evidence: only ${sourceCount} timeline events`
          : "Sufficient evidence sources",
      suggestions:
        sourceCount < 3 ? "Add more timeline events or evidence sources" : null,
    };
  }
}
