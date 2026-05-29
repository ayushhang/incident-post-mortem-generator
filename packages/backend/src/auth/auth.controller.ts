import { Controller, Post, Get, Body, UseGuards, Req } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { AuthLoginRequest, AuthRegisterRequest, AuthResponse } from "@incidents/shared";

@ApiTags("auth")
@Controller("api/v1/auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post("register")
  @ApiOperation({ summary: "Register a new user" })
  async register(@Body() input: AuthRegisterRequest): Promise<AuthResponse> {
    return this.authService.register(input);
  }

  @Post("login")
  @ApiOperation({ summary: "Login user" })
  async login(@Body() input: AuthLoginRequest): Promise<AuthResponse> {
    return this.authService.login(input);
  }

  @Get("me")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get current user" })
  async getCurrentUser(@Req() req: any) {
    return this.authService.validateUser(req.user.sub);
  }
}
