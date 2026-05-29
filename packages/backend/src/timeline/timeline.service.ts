import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../common/prisma/prisma.service";
import {
  TimelineEventDto,
  TimelineMetricsDto,
  CreateTimelineEventRequest,
} from "@incidents/shared";

@Injectable()
export class TimelineService {
  constructor(private prisma: PrismaService) {}

  async getTimeline(incidentId: string): Promise<TimelineEventDto[]> {
    const incident = await this.prisma.incident.findUnique({
      where: { id: incidentId },
    });

    if (!incident) {
      throw new NotFoundException("Incident not found");
    }

    const events = await this.prisma.timelineEvent.findMany({
      where: { incidentId },
      orderBy: { timestamp: "asc" },
    });

    return events.map((e: any) => this.mapToDto(e));
  }

  async getMetrics(incidentId: string): Promise<TimelineMetricsDto> {
    const incident = await this.prisma.incident.findUnique({
      where: { id: incidentId },
      include: { timeline: true },
    });

    if (!incident) {
      throw new NotFoundException("Incident not found");
    }

    const events = incident.timeline;
    if (events.length === 0) {
      return {
        mttd: null,
        mtte: null,
        mttr: null,
        totalDuration: null,
        timeToComm: null,
        eventCount: 0,
        classificationBreakdown: {
          DETECTION: 0,
          ESCALATION: 0,
          INVESTIGATION: 0,
          MITIGATION: 0,
          RESOLUTION: 0,
          COMMUNICATION: 0,
          OTHER: 0,
        },
      };
    }

    const sortedEvents = [...events].sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );

    const classificationBreakdown = {
      DETECTION: 0,
      ESCALATION: 0,
      INVESTIGATION: 0,
      MITIGATION: 0,
      RESOLUTION: 0,
      COMMUNICATION: 0,
      OTHER: 0,
    };

    sortedEvents.forEach((e: any) => {
      classificationBreakdown[e.classification as keyof typeof classificationBreakdown]++;
    });

    const detectionEvent = sortedEvents.find((e) => e.classification === "DETECTION");
    const escalationEvent = sortedEvents.find((e) => e.classification === "ESCALATION");
    const resolutionEvent = sortedEvents.find((e) => e.classification === "RESOLUTION");
    const communicationEvent = sortedEvents.find(
      (e) => e.classification === "COMMUNICATION"
    );

    let mttd: number | null = null;
    let mtte: number | null = null;
    let mttr: number | null = null;
    let timeToComm: number | null = null;

    if (detectionEvent && escalationEvent) {
      mttd = Math.floor(
        (escalationEvent.timestamp.getTime() - incident.startTime.getTime()) /
          (1000 * 60)
      );
    } else if (detectionEvent) {
      mttd = Math.floor(
        (detectionEvent.timestamp.getTime() - incident.startTime.getTime()) /
          (1000 * 60)
      );
    }

    if (escalationEvent && resolutionEvent) {
      mtte = Math.floor(
        (resolutionEvent.timestamp.getTime() - escalationEvent.timestamp.getTime()) /
          (1000 * 60)
      );
    }

    if (incident.endTime) {
      mttr = Math.floor(
        (incident.endTime.getTime() - incident.startTime.getTime()) /
          (1000 * 60)
      );
    }

    if (incident.startTime && communicationEvent) {
      timeToComm = Math.floor(
        (communicationEvent.timestamp.getTime() - incident.startTime.getTime()) /
          (1000 * 60)
      );
    }

    return {
      mttd,
      mtte,
      mttr,
      totalDuration: mttr,
      timeToComm,
      eventCount: events.length,
      classificationBreakdown,
    };
  }

  async createEvent(
    incidentId: string,
    input: CreateTimelineEventRequest
  ): Promise<TimelineEventDto> {
    const incident = await this.prisma.incident.findUnique({
      where: { id: incidentId },
    });

    if (!incident) {
      throw new NotFoundException("Incident not found");
    }

    const event = await this.prisma.timelineEvent.create({
      data: {
        incidentId,
        timestamp: new Date(input.timestamp),
        canonicalTime: new Date(input.timestamp),
        description: input.description,
        classification: input.classification,
        extractedBy: "manual",
        confidence: 1.0,
      },
    });

    return this.mapToDto(event);
  }

  async updateEvent(
    incidentId: string,
    eventId: string,
    input: Partial<CreateTimelineEventRequest>
  ): Promise<TimelineEventDto> {
    const event = await this.prisma.timelineEvent.findFirst({
      where: { id: eventId, incidentId },
    });

    if (!event) {
      throw new NotFoundException("Event not found");
    }

    const updated = await this.prisma.timelineEvent.update({
      where: { id: eventId },
      data: {
        timestamp: input.timestamp ? new Date(input.timestamp) : undefined,
        description: input.description,
        classification: input.classification,
        updatedAt: new Date(),
      },
    });

    return this.mapToDto(updated);
  }

  async deleteEvent(incidentId: string, eventId: string): Promise<void> {
    const event = await this.prisma.timelineEvent.findFirst({
      where: { id: eventId, incidentId },
    });

    if (!event) {
      throw new NotFoundException("Event not found");
    }

    await this.prisma.timelineEvent.delete({
      where: { id: eventId },
    });
  }

  private mapToDto(event: any): TimelineEventDto {
    return {
      id: event.id,
      timestamp: event.timestamp.toISOString(),
      canonicalTime: event.canonicalTime.toISOString(),
      description: event.description,
      classification: event.classification,
      sourceReference: event.sourceReference,
      extractedBy: event.extractedBy,
      confidence: event.confidence,
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString(),
    };
  }
}
