import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../common/prisma/prisma.service";
import {
  CreateIncidentRequest,
  UpdateIncidentRequest,
  IncidentListRequest,
  IncidentListResponse,
  IncidentDto,
  UserRole,
} from "@incidents/shared";

@Injectable()
export class IncidentsService {
  constructor(private prisma: PrismaService) {}

  async create(input: CreateIncidentRequest, userId: string): Promise<IncidentDto> {
    const incident = await this.prisma.incident.create({
      data: {
        title: input.title,
        description: input.description,
        severity: input.severity,
        serviceAffected: input.serviceAffected,
        environment: input.environment,
        startTime: new Date(input.startTime),
        endTime: input.endTime ? new Date(input.endTime) : null,
        isOngoing: input.isOngoing,
        usersAffected: input.usersAffected,
        revenueImpact: input.revenueImpact,
        regionsAffected: input.regionsAffected,
        internalTeams: input.internalTeams,
        slaTarget: input.slaTarget,
        createdBy: userId,
      },
      include: {
        createdByUser: true,
      },
    });

    return this.mapToDto(incident);
  }

  async findAll(
    filters: IncidentListRequest,
    _userRole: any
  ): Promise<IncidentListResponse> {
    const skip = (filters.page - 1) * filters.limit;

    const whereClause: any = {};
    if (filters.status) whereClause.status = filters.status;
    if (filters.severity) whereClause.severity = filters.severity;
    if (filters.search) {
      whereClause.OR = [
        { title: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const [incidents, total] = await Promise.all([
      this.prisma.incident.findMany({
        where: whereClause,
        skip,
        take: filters.limit,
        orderBy: {
          [filters.sortBy || "createdAt"]: filters.sortOrder || "desc",
        },
        include: {
          createdByUser: true,
        },
      }),
      this.prisma.incident.count({ where: whereClause }),
    ]);

    return {
      data: incidents.map((i: any) => this.mapToDto(i)),
      total,
      page: filters.page,
      limit: filters.limit,
      totalPages: Math.ceil(total / filters.limit),
    };
  }

  async findById(id: string): Promise<IncidentDto> {
    const incident = await this.prisma.incident.findUnique({
      where: { id },
      include: {
        createdByUser: true,
      },
    });

    if (!incident) {
      throw new NotFoundException("Incident not found");
    }

    return this.mapToDto(incident);
  }

  async update(
    id: string,
    input: UpdateIncidentRequest,
    userId: string,
    userRole: UserRole
  ): Promise<IncidentDto> {
    const incident = await this.prisma.incident.findUnique({
      where: { id },
    });

    if (!incident) {
      throw new NotFoundException("Incident not found");
    }

    // Check authorization
    if (incident.createdBy !== userId && userRole === UserRole.VIEWER) {
      throw new ForbiddenException("Not authorized to update this incident");
    }

    const updated = await this.prisma.incident.update({
      where: { id },
      data: {
        title: input.title,
        description: input.description,
        status: input.status,
        severity: input.severity,
        endTime: input.endTime ? new Date(input.endTime) : undefined,
        isOngoing: input.isOngoing,
        usersAffected: input.usersAffected,
        revenueImpact: input.revenueImpact,
        updatedAt: new Date(),
      },
      include: {
        createdByUser: true,
      },
    });

    return this.mapToDto(updated);
  }

  async delete(id: string, userId: string, userRole: UserRole): Promise<void> {
    const incident = await this.prisma.incident.findUnique({
      where: { id },
    });

    if (!incident) {
      throw new NotFoundException("Incident not found");
    }

    if (incident.createdBy !== userId && userRole === UserRole.VIEWER) {
      throw new ForbiddenException("Not authorized to delete this incident");
    }

    await this.prisma.incident.delete({
      where: { id },
    });
  }

  private mapToDto(incident: any): IncidentDto {
    const toNullableISOString = (date: any): string | null => {
      if (!date) return null;
      if (typeof date === "string") return date;
      return date instanceof Date ? date.toISOString() : new Date(date).toISOString();
    };

    const toRequiredISOString = (date: any): string => {
      const value = toNullableISOString(date);
      if (!value) {
        throw new Error(`Incident ${incident.id} has an invalid required date field`);
      }

      return value;
    };

    return {
      id: incident.id,
      title: incident.title,
      description: incident.description,
      status: incident.status,
      severity: incident.severity,
      serviceAffected: incident.serviceAffected,
      environment: incident.environment,
      startTime: toRequiredISOString(incident.startTime),
      endTime: toNullableISOString(incident.endTime),
      isOngoing: incident.isOngoing,
      durationMinutes: incident.durationMinutes,
      usersAffected: incident.usersAffected,
      revenueImpact: incident.revenueImpact,
      createdAt: toRequiredISOString(incident.createdAt),
      updatedAt: toRequiredISOString(incident.updatedAt),
      createdBy: incident.createdByUser ? {
        id: incident.createdByUser.id,
        email: incident.createdByUser.email,
        name: incident.createdByUser.name,
        role: incident.createdByUser.role,
        createdAt: toRequiredISOString(incident.createdByUser.createdAt),
      } : {
        id: "system",
        email: "system@incident.local",
        name: "System",
        role: "ADMIN",
        createdAt: toRequiredISOString(incident.createdAt),
      },
      status_label: incident.status,
      severity_label: incident.severity,
    };
  }
}
