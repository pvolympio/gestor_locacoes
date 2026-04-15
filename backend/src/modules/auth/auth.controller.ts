// src/modules/auth/auth.controller.ts
import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Public } from "../../common/decorators/public.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { UserRole } from "@prisma/client";

@ApiTags("auth")
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Fazer login e obter tokens JWT" })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post("registro")
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth("access-token")
  @ApiOperation({ summary: "Criar novo usuário (apenas ADMIN)" })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Renovar tokens usando refresh token" })
  refresh(@Body() body: { userId: string; refreshToken: string }) {
    return this.authService.refreshTokens(body.userId, body.refreshToken);
  }

  @Post("logout")
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth("access-token")
  @ApiOperation({ summary: "Fazer logout (invalida o refresh token)" })
  logout(@CurrentUser("id") userId: string) {
    return this.authService.logout(userId);
  }

  @Get("perfil")
  @ApiBearerAuth("access-token")
  @ApiOperation({ summary: "Dados do usuário autenticado" })
  perfil(@CurrentUser("id") userId: string) {
    return this.authService.perfil(userId);
  }
}
