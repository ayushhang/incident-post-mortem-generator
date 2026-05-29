import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../common/prisma/prisma.service";
import { LLMService } from "../common/llm/llm.service";
import { PostmortemDocumentDto } from "@incidents/shared";

@Injectable()
export class GenerationService {
  constructor(
    private prisma: PrismaService,
    private llmService: LLMService
  ) {}

  async generatePostmortem(incidentId: string): Promise<PostmortemDocumentDto> {
    const incident = await this.prisma.incident.findUnique({
      where: { id: incidentId },
      include: {
        sources: true,
        timeline: {
          orderBy: { timestamp: "asc" },
        },
      },
    });

    if (!incident) {
      throw new NotFoundException("Incident not found");
    }

    const timelineText = incident.timeline
      .map(
        (e: any) =>
          `[${e.timestamp.toISOString()}] ${e.classification}: ${e.description}`
      )
      .join("\n");

    const sourcesText = incident.sources.map((s: any) => `${s.sourceType}:\n${s.content}`).join("\n\n");

    const basePrompt = `
You are an expert incident post-mortem analyst. Analyze this incident and provide detailed, blameless insights.

INCIDENT: ${incident.title}
SEVERITY: ${incident.severity}
START: ${incident.startTime.toISOString()}
END: ${incident.endTime?.toISOString() || "ONGOING"}

TIMELINE:
${timelineText}

SOURCES:
${sourcesText}

REQUIREMENTS:
- Be blameless (focus on systems, processes, not people)
- Be specific and actionable
- Cite evidence from sources
`;

    const sections = await Promise.all([
      this.generateExecutiveSummary(basePrompt),
      this.generateRootCauseAnalysis(basePrompt),
      this.generateContributingFactors(basePrompt),
      this.generateWhyAnalysis(basePrompt),
      this.generateWhatWentWell(basePrompt),
      this.generateWhatCouldImprove(basePrompt),
      this.generateCorrectiveActions(basePrompt),
      this.generateConfidenceScore(basePrompt),
      this.generateOpenQuestions(basePrompt),
    ]);

    const postmortem = await this.prisma.postmortemDocument.upsert({
      where: { incidentId },
      update: {
        executiveSummary: sections[0],
        rootCauseAnalysis: sections[1],
        contributingFactors: sections[2],
        whyAnalysis: sections[3],
        whatWentWell: sections[4],
        whatCouldImprove: sections[5],
        correctiveActions: sections[6],
        confidence: sections[7],
        openQuestions: sections[8],
        generatedBy: "llm",
        generatedAt: new Date(),
        updatedAt: new Date(),
      },
      create: {
        incidentId,
        executiveSummary: sections[0],
        rootCauseAnalysis: sections[1],
        contributingFactors: sections[2],
        whyAnalysis: sections[3],
        whatWentWell: sections[4],
        whatCouldImprove: sections[5],
        correctiveActions: sections[6],
        confidence: sections[7],
        openQuestions: sections[8],
        generatedBy: "llm",
        generatedAt: new Date(),
      },
    });

    return this.mapToDto(postmortem);
  }

  private async generateExecutiveSummary(prompt: string): Promise<string> {
    return this.llmService.generate(
      `${prompt}

Generate EXACTLY 3 concise sentences: what happened, impact, and resolution.`,
      { maxTokens: 300 }
    );
  }

  private async generateRootCauseAnalysis(prompt: string): Promise<string> {
    return this.llmService.generate(
      `${prompt}

Provide root cause analysis: PRIMARY systemic issue (NOT a person). Support with timeline evidence.`,
      { maxTokens: 800 }
    );
  }

  private async generateContributingFactors(prompt: string): Promise<string> {
    return this.llmService.generate(
      `${prompt}

List contributing factors: secondary failures, process gaps, dependencies.`,
      { maxTokens: 600 }
    );
  }

  private async generateWhyAnalysis(prompt: string): Promise<string> {
    return this.llmService.generate(
      `${prompt}

Perform 5 Whys analysis stopping at systemic/process level, not people.`,
      { maxTokens: 800 }
    );
  }

  private async generateWhatWentWell(prompt: string): Promise<string> {
    return this.llmService.generate(
      `${prompt}

What went well? Positive actions and why they helped.`,
      { maxTokens: 600 }
    );
  }

  private async generateWhatCouldImprove(prompt: string): Promise<string> {
    return this.llmService.generate(
      `${prompt}

What could improve? Be SPECIFIC and ACTIONABLE. Not "better monitoring" but concrete changes.`,
      { maxTokens: 800 }
    );
  }

  private async generateCorrectiveActions(prompt: string): Promise<string> {
    return this.llmService.generate(
      `${prompt}

Generate corrective actions with WHAT, WHY, WHO, WHEN, HOW for each.`,
      { maxTokens: 1000 }
    );
  }

  private async generateConfidenceScore(prompt: string): Promise<string> {
    return this.llmService.generate(
      `${prompt}

Provide confidence indicators: evidence strength, assumptions, missing information.`,
      { maxTokens: 500 }
    );
  }

  private async generateOpenQuestions(prompt: string): Promise<string> {
    return this.llmService.generate(
      `${prompt}

What questions remain unanswered? Missing logs, traces, unclear causes?`,
      { maxTokens: 500 }
    );
  }

  private mapToDto(postmortem: any): PostmortemDocumentDto {
    return {
      id: postmortem.id,
      incidentId: postmortem.incidentId,
      executiveSummary: postmortem.executiveSummary,
      metadata: postmortem.metadata,
      impactAssessment: postmortem.impactAssessment,
      timeline: postmortem.timeline,
      rootCauseAnalysis: postmortem.rootCauseAnalysis,
      contributingFactors: postmortem.contributingFactors,
      whyAnalysis: postmortem.whyAnalysis,
      whatWentWell: postmortem.whatWentWell,
      whatCouldImprove: postmortem.whatCouldImprove,
      correctiveActions: postmortem.correctiveActions,
      ownership: postmortem.ownership,
      confidence: postmortem.confidence,
      openQuestions: postmortem.openQuestions,
      blamelessReview: postmortem.blamelessReview,
      slaNote: postmortem.slaNote,
      generatedBy: postmortem.generatedBy,
      generatedAt: postmortem.generatedAt.toISOString(),
      editedAt: postmortem.editedAt?.toISOString() || null,
      createdAt: postmortem.createdAt.toISOString(),
      updatedAt: postmortem.updatedAt.toISOString(),
    };
  }
}
