// src/modules/locacoes/dto/create-locacao.dto.ts
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
  ArrayMinSize,
} from "class-validator";
import { Type } from "class-transformer";

export class ItemLocacaoDto {
  @ApiProperty({ description: "ID do item do acervo" })
  @IsUUID()
  acervoId: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  quantidade: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observacao?: string;
}

export class CreateLocacaoDto {
  @ApiProperty({ description: "ID do cliente" })
  @IsUUID()
  clienteId: string;

  @ApiProperty({
    example: "2026-04-10",
    description: "Data de retirada (ISO 8601)",
  })
  @IsDateString()
  dataRetirada: string;

  @ApiProperty({
    example: "2026-04-12",
    description: "Data prevista de devolução",
  })
  @IsDateString()
  dataDevolucao: string;

  @ApiProperty({ type: [ItemLocacaoDto], description: "Itens a locar" })
  @IsArray()
  @ArrayMinSize(1, { message: "Informe ao menos um item." })
  @ValidateNested({ each: true })
  @Type(() => ItemLocacaoDto)
  itens: ItemLocacaoDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observacoes?: string;

  @ApiPropertyOptional({ example: "150.00" })
  @IsOptional()
  valorTotal?: string;

  @ApiPropertyOptional({ example: "0.00" })
  @IsOptional()
  desconto?: string;

  @ApiPropertyOptional({ example: "Pix" })
  @IsOptional()
  @IsString()
  formaPagamento?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  pago?: boolean;
}

// ── Query filters ─────────────────────────────────────────
import { LocacaoStatus } from "@prisma/client";
import { IsEnum } from "class-validator";
import { PaginationDto } from "../../../common/dto/pagination.dto";

export class LocacaoQueryDto extends PaginationDto {
  @ApiPropertyOptional({ enum: LocacaoStatus })
  @IsOptional()
  @IsEnum(LocacaoStatus)
  status?: LocacaoStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  clienteId?: string;

  @ApiPropertyOptional({ example: "2026-04-01" })
  @IsOptional()
  @IsDateString()
  dataInicio?: string;

  @ApiPropertyOptional({ example: "2026-04-30" })
  @IsOptional()
  @IsDateString()
  dataFim?: string;

  @ApiPropertyOptional({ description: "Filtrar locações atrasadas" })
  @IsOptional()
  atrasadas?: boolean;
}
