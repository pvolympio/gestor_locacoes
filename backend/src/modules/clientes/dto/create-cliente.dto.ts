// src/modules/clientes/dto/create-cliente.dto.ts
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsOptional, IsString } from "class-validator";

export class CreateClienteDto {
  @ApiProperty({ example: "Ana Paula Ferreira" })
  @IsString()
  nome: string;

  @ApiPropertyOptional({ example: "(35) 99999-0000" })
  @IsOptional()
  @IsString()
  telefone?: string;

  @ApiPropertyOptional({ example: "ana@email.com" })
  @IsOptional()
  @IsEmail({}, { message: "Informe um e-mail válido." })
  email?: string;

  @ApiPropertyOptional({ example: "123.456.789-00" })
  @IsOptional()
  @IsString()
  cpf?: string;

  @ApiPropertyOptional({ example: "Rua das Flores, 100" })
  @IsOptional()
  @IsString()
  endereco?: string;

  @ApiPropertyOptional({ example: "Itajubá" })
  @IsOptional()
  @IsString()
  cidade?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observacoes?: string;
}
