import { Test, TestingModule } from "@nestjs/testing";
import { IncidentsService } from "../src/incidents/incidents.service";
import { PrismaService } from "../src/common/prisma/prisma.service";
import { NotFoundException, ForbiddenException } from "@nestjs/common";
import { IncidentSeverity, UserRole } from "@incidents/shared";

describe("IncidentsService", () => {
  let service: IncidentsService;
  let prismaService: PrismaService;

  const mockUser = {
    id: "user-1",
    email: "test@example.com",
    name: "Test User",
    role: UserRole.EDITOR,
    isActive: true,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IncidentsService,
        {
          provide: PrismaService,
          useValue: {
            incident: {
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
              count: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<IncidentsService>(IncidentsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  describe("create", () => {
    it("should create a new incident", async () => {
      const createInput = {
        title: "Database Outage",
        severity: IncidentSeverity.CRITICAL,
        startTime: new Date().toISOString(),
      };

      const mockIncident = {
        id: "incident-1",
        ...createInput,
        createdBy: mockUser.id,
        createdByUser: mockUser,
      };

      jest.spyOn(prismaService.incident, "create").mockResolvedValueOnce(mockIncident);

      const result = await service.create(createInput as any, mockUser.id);

      expect(result.id).toBe("incident-1");
      expect(result.title).toBe("Database Outage");
      expect(prismaService.incident.create).toHaveBeenCalled();
    });
  });

  describe("findAll", () => {
    it("should return paginated incidents", async () => {
      const mockIncidents = [
        {
          id: "incident-1",
          title: "Outage",
          severity: IncidentSeverity.CRITICAL,
          createdByUser: mockUser,
        },
      ];

      jest.spyOn(prismaService.incident, "findMany").mockResolvedValueOnce(mockIncidents);
      jest.spyOn(prismaService.incident, "count").mockResolvedValueOnce(1);

      const result = await service.findAll(
        { page: 1, limit: 20 },
        UserRole.EDITOR
      );

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
    });

    it("should filter by severity", async () => {
      jest.spyOn(prismaService.incident, "findMany").mockResolvedValueOnce([]);
      jest.spyOn(prismaService.incident, "count").mockResolvedValueOnce(0);

      await service.findAll(
        { page: 1, limit: 20, severity: IncidentSeverity.HIGH },
        UserRole.VIEWER
      );

      expect(prismaService.incident.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            severity: IncidentSeverity.HIGH,
          }),
        })
      );
    });
  });

  describe("findById", () => {
    it("should find incident by ID", async () => {
      const mockIncident = {
        id: "incident-1",
        title: "Outage",
        createdByUser: mockUser,
      };

      jest
        .spyOn(prismaService.incident, "findUnique")
        .mockResolvedValueOnce(mockIncident);

      const result = await service.findById("incident-1");

      expect(result.id).toBe("incident-1");
      expect(prismaService.incident.findUnique).toHaveBeenCalledWith({
        where: { id: "incident-1" },
        include: { createdByUser: true },
      });
    });

    it("should throw NotFoundException if incident not found", async () => {
      jest.spyOn(prismaService.incident, "findUnique").mockResolvedValueOnce(null);

      await expect(service.findById("nonexistent")).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe("update", () => {
    it("should update incident if user is owner", async () => {
      const mockIncident = {
        id: "incident-1",
        createdBy: mockUser.id,
      };

      const updatedIncident = {
        ...mockIncident,
        title: "Updated Title",
        createdByUser: mockUser,
      };

      jest
        .spyOn(prismaService.incident, "findUnique")
        .mockResolvedValueOnce(mockIncident);
      jest
        .spyOn(prismaService.incident, "update")
        .mockResolvedValueOnce(updatedIncident);

      const result = await service.update(
        "incident-1",
        { title: "Updated Title" },
        mockUser.id,
        UserRole.EDITOR
      );

      expect(result.title).toBe("Updated Title");
    });

    it("should throw ForbiddenException if user is not owner and is VIEWER", async () => {
      const mockIncident = {
        id: "incident-1",
        createdBy: "other-user",
      };

      jest
        .spyOn(prismaService.incident, "findUnique")
        .mockResolvedValueOnce(mockIncident);

      await expect(
        service.update(
          "incident-1",
          { title: "Updated" },
          mockUser.id,
          UserRole.VIEWER
        )
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe("delete", () => {
    it("should delete incident if user is owner", async () => {
      const mockIncident = {
        id: "incident-1",
        createdBy: mockUser.id,
      };

      jest
        .spyOn(prismaService.incident, "findUnique")
        .mockResolvedValueOnce(mockIncident);
      jest.spyOn(prismaService.incident, "delete").mockResolvedValueOnce({});

      await service.delete("incident-1", mockUser.id, UserRole.EDITOR);

      expect(prismaService.incident.delete).toHaveBeenCalledWith({
        where: { id: "incident-1" },
      });
    });

    it("should throw NotFoundException if incident not found", async () => {
      jest.spyOn(prismaService.incident, "findUnique").mockResolvedValueOnce(null);

      await expect(
        service.delete("nonexistent", mockUser.id, UserRole.EDITOR)
      ).rejects.toThrow(NotFoundException);
    });
  });
});
