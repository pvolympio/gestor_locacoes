// src/modules/auth/dto/register.dto.ts
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from "class-validator";
import { UserRole } from "@prisma/client";

export class RegisterDto {
  @ApiProperty({ example: "Maria Silva" })
  @IsString()
  nome: string;

  @ApiProperty({ example: "maria@sistema.com" })
  @IsEmail({}, { message: "Informe um e-mail válido." })
  email: string;

  @ApiProperty({ example: "senha123", minLength: 6 })
  @IsString()
  @MinLength(6, { message: "A senha deve ter no mínimo 6 caracteres." })
  senha: string;

  @ApiPropertyOptional({ enum: UserRole, default: UserRole.OPERADOR })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
