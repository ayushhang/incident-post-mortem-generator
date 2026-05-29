import { Test, TestingModule } from "@nestjs/testing";
import { AuthService } from "../src/auth/auth.service";
import { PrismaService } from "../src/common/prisma/prisma.service";
import { JwtService } from "@nestjs/jwt";
import { ConflictException, UnauthorizedException } from "@nestjs/common";

describe("AuthService", () => {
  let service: AuthService;
  let prismaService: PrismaService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              create: jest.fn(),
              findUnique: jest.fn(),
              count: jest.fn(),
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
  });

  describe("register", () => {
    it("should register a new user successfully", async () => {
      const registerDto = {
        email: "test@example.com",
        name: "Test User",
        password: "Password123",
      };

      const mockUser = {
        id: "1",
        email: registerDto.email,
        name: registerDto.name,
        role: "ADMIN",
      };

      jest.spyOn(prismaService.user, "findUnique").mockResolvedValueOnce(null);
      jest.spyOn(prismaService.user, "count").mockResolvedValueOnce(0);
      jest.spyOn(prismaService.user, "create").mockResolvedValueOnce(mockUser);
      jest.spyOn(jwtService, "sign").mockReturnValueOnce("token");

      const result = await service.register(registerDto);

      expect(result.accessToken).toBe("token");
      expect(result.user.email).toBe(registerDto.email);
    });

    it("should throw ConflictException if email already exists", async () => {
      const registerDto = {
        email: "existing@example.com",
        name: "Test User",
        password: "Password123",
      };

      jest.spyOn(prismaService.user, "findUnique").mockResolvedValueOnce({
        id: "1",
        email: registerDto.email,
      });

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException
      );
    });

    it("should throw BadRequestException if password is too short", async () => {
      const registerDto = {
        email: "test@example.com",
        name: "Test User",
        password: "short",
      };

      jest.spyOn(prismaService.user, "findUnique").mockResolvedValueOnce(null);

      await expect(service.register(registerDto)).rejects.toThrow();
    });
  });

  describe("login", () => {
    it("should login successfully with valid credentials", async () => {
      const loginDto = {
        email: "test@example.com",
        password: "Password123",
      };

      const mockUser = {
        id: "1",
        email: loginDto.email,
        password:
          "$2b$10$abc123def456ghi789jkl", // bcrypt hash
        isActive: true,
      };

      jest.spyOn(prismaService.user, "findUnique").mockResolvedValueOnce(mockUser);
      jest.spyOn(jwtService, "sign").mockReturnValueOnce("token");

      // Mock bcrypt comparison
      jest.mock("bcrypt", () => ({
        compare: jest.fn().mockResolvedValueOnce(true),
      }));

      const result = await service.login(loginDto);

      expect(result.accessToken).toBe("token");
    });

    it("should throw UnauthorizedException if user not found", async () => {
      const loginDto = {
        email: "notfound@example.com",
        password: "Password123",
      };

      jest.spyOn(prismaService.user, "findUnique").mockResolvedValueOnce(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException
      );
    });
  });
});
