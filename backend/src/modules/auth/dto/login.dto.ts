// src/modules/auth/dto/login.dto.ts
import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, MinLength } from "class-validator";

export class LoginDto {
  @ApiProperty({ example: "admin@sistema.com" })
  @IsEmail({}, { message: "Informe um e-mail válido." })
  email: string;

  @ApiProperty({ example: "admin123" })
  @IsString()
  @MinLength(6, { message: "A senha deve ter no mínimo 6 caracteres." })
  senha: string;
}
