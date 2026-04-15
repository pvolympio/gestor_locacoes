// src/modules/locacoes/locacoes.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Res,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags, ApiBody } from "@nestjs/swagger";
import { Response } from "express";
import { LocacoesService } from "./locacoes.service";
import { CreateLocacaoDto, LocacaoQueryDto } from "./dto/create-locacao.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

@ApiTags("locacoes")
@ApiBearerAuth("access-token")
@UseGuards(JwtAuthGuard)
@Controller("locacoes")
export class LocacoesController {
  constructor(private readonly locacoesService: LocacoesService) {}

  @Post()
  @ApiOperation({
    summary: "Criar nova locação (valida conflitos automaticamente)",
  })
  create(@Body() dto: CreateLocacaoDto, @CurrentUser("id") userId: string) {
    return this.locacoesService.create(dto, userId);
  }

  @Get()
  @ApiOperation({
    summary: "Listar locações com filtros avançados e paginação",
  })
  findAll(@Query() query: LocacaoQueryDto) {
    return this.locacoesService.findAll(query);
  }

  @Get("export")
  @ApiOperation({ summary: "Exportar locações como CSV" })
  @HttpCode(HttpStatus.OK)
  async exportCsv(
    @Query() query: LocacaoQueryDto,
    @Res() res: Response,
  ) {
    const csv = await this.locacoesService.exportCsv(query);
    const filename = `locacoes-${new Date().toISOString().split("T")[0]}.csv`;
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send("\uFEFF" + csv); // BOM UTF-8 para Excel
  }

  @Get(":id")
  @ApiOperation({ summary: "Detalhes completos de uma locação" })
  findOne(@Param("id") id: string) {
    return this.locacoesService.findOne(id);
  }

  @Put(":id")
  @ApiOperation({ summary: "Atualizar locação (revalida disponibilidade)" })
  update(
    @Param("id") id: string,
    @Body() dto: Partial<CreateLocacaoDto>,
  ) {
    return this.locacoesService.update(id, dto);
  }

  @Patch(":id/finalizar")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Finalizar locação — devolve itens ao acervo" })
  @ApiBody({
    schema: { properties: { observacoes: { type: "string" } } },
    required: false,
  })
  finalizar(@Param("id") id: string, @Body("observacoes") obs?: string) {
    return this.locacoesService.finalizar(id, obs);
  }

  @Patch(":id/cancelar")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Cancelar locação" })
  @ApiBody({
    schema: { properties: { motivo: { type: "string" } } },
    required: false,
  })
  cancelar(@Param("id") id: string, @Body("motivo") motivo?: string) {
    return this.locacoesService.cancelar(id, motivo);
  }
}
