// src/common/dto/pagination.dto.ts
import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, Min, Max } from "class-validator";

export class PaginationDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number) // converte string → number antes da validação
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ default: "criadoEm" })
  @IsOptional()
  @IsString()
  orderBy?: string = "criadoEm";

  @ApiPropertyOptional({ enum: ["asc", "desc"], default: "desc" })
  @IsOptional()
  @IsString()
  order?: "asc" | "desc" = "desc";

  // CORRIGIDO: garante que skip e limit são sempre inteiros
  get skip(): number {
    return (Number(this.page ?? 1) - 1) * Number(this.limit ?? 20);
  }

  get takeNum(): number {
    return Number(this.limit ?? 20);
  }
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export function paginate<T>(
  data: T[],
  total: number,
  dto: PaginationDto,
): PaginatedResult<T> {
  const page = Number(dto.page ?? 1);
  const limit = Number(dto.limit ?? 20);
  const totalPages = Math.ceil(total / limit);
  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
}
