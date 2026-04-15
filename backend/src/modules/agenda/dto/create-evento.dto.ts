// src/modules/agenda/dto/create-evento.dto.ts
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from "class-validator";
import { EventoTipo } from "@prisma/client";
import { PaginationDto } from "../../../common/dto/pagination.dto";

export class CreateEventoDto {
  @ApiProperty({ example: "Retirada — Fernanda" })
  @IsString()
  titulo: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  descricao?: string;

  @ApiProperty({ example: "2026-04-10T10:00:00.000Z" })
  @IsDateString()
  dataInicio: string;

  @ApiPropertyOptional({ example: "2026-04-12T18:00:00.000Z" })
  @IsOptional()
  @IsDateString()
  dataFim?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  diaInteiro?: boolean;

  @ApiPropertyOptional({ enum: EventoTipo, default: EventoTipo.OUTRO })
  @IsOptional()
  @IsEnum(EventoTipo)
  tipo?: EventoTipo;

  @ApiPropertyOptional({ example: "#6366f1" })
  @IsOptional()
  @IsString()
  cor?: string;

  @ApiPropertyOptional({ description: "ID da locação relacionada" })
  @IsOptional()
  @IsUUID()
  locacaoId?: string;
}

export class EventoQueryDto extends PaginationDto {
  @ApiPropertyOptional({ example: "2026-04-01" })
  @IsOptional()
  @IsDateString()
  dataInicio?: string;

  @ApiPropertyOptional({ example: "2026-04-30" })
  @IsOptional()
  @IsDateString()
  dataFim?: string;

  @ApiPropertyOptional({ enum: EventoTipo })
  @IsOptional()
  @IsEnum(EventoTipo)
  tipo?: EventoTipo;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  locacaoId?: string;
}
