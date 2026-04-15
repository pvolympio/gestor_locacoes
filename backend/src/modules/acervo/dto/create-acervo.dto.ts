// src/modules/acervo/dto/create-acervo.dto.ts
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from "class-validator";
import { Type } from "class-transformer";

export class CreateAcervoDto {
  @ApiProperty({ example: "Trio de Cilindros" })
  @IsString()
  nome: string;

  @ApiPropertyOptional({ example: "Conjunto decorativo com 3 cilindros" })
  @IsOptional()
  @IsString()
  descricao?: string;

  @ApiPropertyOptional({ description: "ID da categoria" })
  @IsOptional()
  @IsUUID()
  categoriaId?: string;

  @ApiProperty({ example: 1, description: "Quantidade total no estoque" })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  quantidadeTotal: number;

  @ApiPropertyOptional({ example: "TRICIO-001" })
  @IsOptional()
  @IsString()
  codigoInterno?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observacoes?: string;

  @ApiPropertyOptional({
    example: "25.00",
    description: "Valor da locação por evento",
  })
  @IsOptional()
  valorLocacao?: string;
}

// ── Query filters para listagem ──────────────────────────────
import { AcervoStatus } from "@prisma/client";
import { IsEnum } from "class-validator";
import { PaginationDto } from "../../../common/dto/pagination.dto";

export class AcervoQueryDto extends PaginationDto {
  @ApiPropertyOptional({ enum: AcervoStatus })
  @IsOptional()
  @IsEnum(AcervoStatus)
  status?: AcervoStatus;

  @ApiPropertyOptional({ description: "Filtrar por categoria (ID)" })
  @IsOptional()
  @IsUUID()
  categoriaId?: string;

  @ApiPropertyOptional({
    description: "Somente itens disponíveis",
    default: false,
  })
  @IsOptional()
  apenasDisponiveis?: boolean;
}
