"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const auth_service_1 = require("../src/auth/auth.service");
const prisma_service_1 = require("../src/common/prisma/prisma.service");
const jwt_1 = require("@nestjs/jwt");
const common_1 = require("@nestjs/common");
describe("AuthService", () => {
    let service;
    let prismaService;
    let jwtService;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                auth_service_1.AuthService,
                {
                    provide: prisma_service_1.PrismaService,
                    useValue: {
                        user: {
                            create: jest.fn(),
                            findUnique: jest.fn(),
                            count: jest.fn(),
                        },
                    },
                },
                {
                    provide: jwt_1.JwtService,
                    useValue: {
                        sign: jest.fn(),
                    },
                },
            ],
        }).compile();
        service = module.get(auth_service_1.AuthService);
        prismaService = module.get(prisma_service_1.PrismaService);
        jwtService = module.get(jwt_1.JwtService);
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
            await expect(service.register(registerDto)).rejects.toThrow(common_1.ConflictException);
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
                password: "$2b$10$abc123def456ghi789jkl", // bcrypt hash
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
            await expect(service.login(loginDto)).rejects.toThrow(common_1.UnauthorizedException);
        });
    });
});
//# sourceMappingURL=auth.service.spec.js.map