import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "../common/prisma/prisma.service";
import { LLMService } from "../common/llm/llm.service";
import { PostmortemDocumentDto } from "@incidents/shared";

@Injectable()
export class GenerationService {
  private readonly logger = new Logger(GenerationService.name);

  constructor(
    private prisma: PrismaService,
    private llmService: LLMService
  ) {}

  async generatePostmortem(incidentId: string): Promise<PostmortemDocumentDto> {
    try {
      this.logger.log(`Starting postmortem generation for incident: ${incidentId}`);

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
        this.logger.error(`Incident not found: ${incidentId}`);
        throw new NotFoundException("Incident not found");
      }

      const timelineText = incident.timeline
        .map(
          (e: any) =>
            `[${e.timestamp.toISOString()}] ${e.classification}: ${e.description}`
        )
        .join("\n");

      const sourcesText = incident.sources
        .map((s: any) => `${s.sourceType}:\n${s.content}`)
        .join("\n\n");

      const basePrompt = `
You are an expert incident post-mortem analyst. Analyze this incident and provide detailed, blameless insights.

INCIDENT: ${incident.title}
SEVERITY: ${incident.severity}
START: ${incident.startTime.toISOString()}
END: ${incident.endTime?.toISOString() || "ONGOING"}

TIMELINE:
${timelineText || "No timeline events available"}

SOURCES:
${sourcesText || "No sources available"}

REQUIREMENTS:
- Be blameless (focus on systems, processes, not people)
- Be specific and actionable
- Cite evidence from sources
`;

      this.logger.debug("Starting parallel LLM generation for postmortem sections");

      const sections = await Promise.allSettled([
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

      const sectionValues = sections.map((result, index) => {
        if (result.status === "fulfilled") {
          return result.value;
        } else {
          this.logger.warn(
            `Failed to generate section ${index}: ${result.reason.message}`
          );
          return `[Section ${index} generation failed: ${result.reason.message}]`;
        }
      });

      this.logger.log("Creating/updating postmortem document in database");

      const postmortem = await this.prisma.postmortemDocument.upsert({
        where: { incidentId },
        update: {
          executiveSummary: sectionValues[0],
          rootCauseAnalysis: sectionValues[1],
          contributingFactors: sectionValues[2],
          whyAnalysis: sectionValues[3],
          whatWentWell: sectionValues[4],
          whatCouldImprove: sectionValues[5],
          correctiveActions: sectionValues[6],
          confidence: sectionValues[7],
          openQuestions: sectionValues[8],
          generatedBy: "llm",
          generatedAt: new Date(),
          updatedAt: new Date(),
        },
        create: {
          incidentId,
          executiveSummary: sectionValues[0],
          rootCauseAnalysis: sectionValues[1],
          contributingFactors: sectionValues[2],
          whyAnalysis: sectionValues[3],
          whatWentWell: sectionValues[4],
          whatCouldImprove: sectionValues[5],
          correctiveActions: sectionValues[6],
          confidence: sectionValues[7],
          openQuestions: sectionValues[8],
          generatedBy: "llm",
          generatedAt: new Date(),
        },
      });

      this.logger.log(
        `Successfully generated postmortem for incident: ${incidentId}`
      );
      return this.mapToDto(postmortem);
    } catch (error) {
      this.logger.error(
        `Failed to generate postmortem for incident ${incidentId}:`,
        error
      );

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException(
        error instanceof Error
          ? `Failed to generate postmortem: ${error.message}`
          : "Failed to generate postmortem due to an unexpected error"
      );
    }
  }

  private async generateExecutiveSummary(prompt: string): Promise<string> {
    try {
      return await this.llmService.generate(
        `${prompt}

Write ONLY plain text (no markdown, no bold, no asterisks, no headers). Write 2-3 paragraphs about what happened, the business impact, and how it was resolved. Simple sentences only.`,
        { maxTokens: 300 }
      );
    } catch (error) {
      this.logger.warn("Failed to generate executive summary");
      return "Executive summary generation encountered an issue. Please review the incident details manually.";
    }
  }

  private async generateRootCauseAnalysis(prompt: string): Promise<string> {
    try {
      return await this.llmService.generate(
        `${prompt}

Write ONLY plain text (no markdown, no formatting, no symbols). Explain the PRIMARY systemic root cause in 2-3 paragraphs. Be specific and factual. No bold text, no asterisks, no headers.`,
        { maxTokens: 800 }
      );
    } catch (error) {
      this.logger.warn("Failed to generate root cause analysis");
      return "Root cause analysis generation encountered an issue. Please refer to incident logs and timeline for investigation details.";
    }
  }

  private async generateContributingFactors(prompt: string): Promise<string> {
    try {
      return await this.llmService.generate(
        `${prompt}

Write ONLY plain text (no markdown, no formatting). List 3-5 contributing factors in simple sentences. Each factor on its own line. No bold, no asterisks, no headers, no special formatting.`,
        { maxTokens: 600 }
      );
    } catch (error) {
      this.logger.warn("Failed to generate contributing factors");
      return "Contributing factors analysis pending. Review incident context and system state during the incident.";
    }
  }

  private async generateWhyAnalysis(prompt: string): Promise<string> {
    try {
      return await this.llmService.generate(
        `${prompt}

Write ONLY plain text. Perform 5 Whys analysis. Format as: Why 1? Because... Why 2? Because... etc. Stop at systemic level. NO markdown, NO bold, NO asterisks, NO headers, NO special formatting. Just plain sentences.`,
        { maxTokens: 800 }
      );
    } catch (error) {
      this.logger.warn("Failed to generate why analysis");
      return "Five Whys analysis generation encountered an issue. Perform manual analysis using the timeline and incident details.";
    }
  }

  private async generateWhatWentWell(prompt: string): Promise<string> {
    try {
      return await this.llmService.generate(
        `${prompt}

Write ONLY plain text (no markdown, no formatting, no symbols). List what went well during incident response in 2-3 paragraphs. Be specific about positive actions. NO bold, NO asterisks, NO headers, NO special formatting.`,
        { maxTokens: 600 }
      );
    } catch (error) {
      this.logger.warn("Failed to generate what went well section");
      return "Positive actions and lessons learned to be documented during post-incident review.";
    }
  }

  private async generateWhatCouldImprove(prompt: string): Promise<string> {
    try {
      return await this.llmService.generate(
        `${prompt}

Write ONLY plain text (no markdown, no formatting). List specific, actionable improvements in 2-3 paragraphs. Be concrete, not vague. NO bold, NO asterisks, NO headers, NO special formatting. Just clear sentences.`,
        { maxTokens: 800 }
      );
    } catch (error) {
      this.logger.warn("Failed to generate improvements section");
      return "Improvement opportunities to be identified through team collaboration during the post-incident review.";
    }
  }

  private async generateCorrectiveActions(prompt: string): Promise<string> {
    try {
      return await this.llmService.generate(
        `${prompt}

Write ONLY plain text (no markdown, no formatting, no symbols). List 3-4 corrective actions. For each action write: What needs to be done, Why it will help, Who should own it, When should it be done. Format as plain paragraphs. NO bold, NO asterisks, NO headers, NO special formatting.`,
        { maxTokens: 1000 }
      );
    } catch (error) {
      this.logger.warn("Failed to generate corrective actions");
      return "Corrective actions to be developed with engineering and product teams. Focus on systemic improvements to prevent recurrence.";
    }
  }

  private async generateConfidenceScore(prompt: string): Promise<string> {
    try {
      return await this.llmService.generate(
        `${prompt}

Write ONLY plain text (no markdown, no formatting). Assess confidence in the analysis in 2 paragraphs. Discuss evidence strength, assumptions made, and missing information. NO bold, NO asterisks, NO headers, NO special formatting.`,
        { maxTokens: 500 }
      );
    } catch (error) {
      this.logger.warn("Failed to generate confidence assessment");
      return "Confidence assessment: Analysis based on available logs and timeline. Additional forensic data may improve confidence in findings.";
    }
  }

  private async generateOpenQuestions(prompt: string): Promise<string> {
    try {
      return await this.llmService.generate(
        `${prompt}

Write ONLY plain text (no markdown, no formatting). List unanswered questions and missing data in 2 paragraphs. NO bold, NO asterisks, NO headers, NO special formatting. Just plain text questions.`,
        { maxTokens: 500 }
      );
    } catch (error) {
      this.logger.warn("Failed to generate open questions");
      return "Open questions and gaps to be addressed through follow-up investigation and log analysis.";
    }
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
