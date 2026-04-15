// src/modules/auth/auth.service.ts
import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  ForbiddenException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "../../prisma/prisma.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { JwtPayload } from "./strategies/jwt.strategy";

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  // ── Login ────────────────────────────────────────────────
  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || !user.ativo) {
      throw new UnauthorizedException("E-mail ou senha incorretos.");
    }

    const senhaValida = await bcrypt.compare(dto.senha, user.senha);
    if (!senhaValida) {
      throw new UnauthorizedException("E-mail ou senha incorretos.");
    }

    const tokens = await this.gerarTokens(user.id, user.email, user.role);

    // Salva o refresh token hasheado no banco
    await this.salvarRefreshToken(user.id, tokens.refreshToken);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      usuario: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        role: user.role,
      },
    };
  }

  // ── Registro (apenas ADMIN pode criar outros usuários) ───
  async register(dto: RegisterDto) {
    const existe = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existe) {
      throw new ConflictException("Já existe um usuário com este e-mail.");
    }

    const senhaHash = await bcrypt.hash(dto.senha, 10);

    const user = await this.prisma.user.create({
      data: {
        nome: dto.nome,
        email: dto.email,
        senha: senhaHash,
        role: dto.role ?? "OPERADOR",
      },
      select: { id: true, nome: true, email: true, role: true, criadoEm: true },
    });

    return user;
  }

  // ── Refresh Token ────────────────────────────────────────
  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user || !user.refreshToken) {
      throw new ForbiddenException("Acesso negado. Faça login novamente.");
    }

    const tokenValido = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!tokenValido) {
      throw new ForbiddenException("Token inválido. Faça login novamente.");
    }

    const tokens = await this.gerarTokens(user.id, user.email, user.role);
    await this.salvarRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  // ── Logout ───────────────────────────────────────────────
  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
    return { message: "Logout realizado com sucesso." };
  }

  // ── Perfil do usuário logado ─────────────────────────────
  async perfil(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, nome: true, email: true, role: true, criadoEm: true },
    });
  }

  // ── Helpers privados ─────────────────────────────────────
  private async gerarTokens(userId: string, email: string, role: string) {
    const payload: JwtPayload = { sub: userId, email, role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get("jwt.secret"),
        expiresIn: this.configService.get("jwt.expiresIn"),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get("jwt.refreshSecret"),
        expiresIn: this.configService.get("jwt.refreshExpiresIn"),
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async salvarRefreshToken(userId: string, refreshToken: string) {
    const hash = await bcrypt.hash(refreshToken, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: hash },
    });
  }
}
