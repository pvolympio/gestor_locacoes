// src/modules/dashboard/dashboard.controller.ts
import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiQuery,
} from "@nestjs/swagger";
import { DashboardService } from "./dashboard.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";

@ApiTags("dashboard")
@ApiBearerAuth("access-token")
@UseGuards(JwtAuthGuard)
@Controller("dashboard")
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @ApiOperation({ summary: "Métricas gerais — cards do dashboard principal" })
  getMetricas() {
    return this.dashboardService.getMetricas();
  }

  @Get("atividades")
  @ApiOperation({ summary: "Feed de atividades recentes (últimas locações)" })
  @ApiQuery({ name: "limite", required: false, example: 10 })
  getAtividades(@Query("limite") limite?: string) {
    return this.dashboardService.getAtividadesRecentes(
      limite ? parseInt(limite) : 10,
    );
  }

  @Get("itens-populares")
  @ApiOperation({ summary: "Itens mais alugados do acervo" })
  @ApiQuery({ name: "limite", required: false, example: 10 })
  getItensMaisAlugados(@Query("limite") limite?: string) {
    return this.dashboardService.getItensMaisAlugados(
      limite ? parseInt(limite) : 10,
    );
  }

  @Get("atrasadas")
  @ApiOperation({ summary: "Locações atrasadas com dados do cliente" })
  getAtrasadas() {
    return this.dashboardService.getLocacoesAtrasadas();
  }

  @Get("disponibilidade")
  @ApiOperation({
    summary: "Disponibilidade do acervo em um período específico",
  })
  @ApiQuery({ name: "dataInicio", example: "2026-04-10" })
  @ApiQuery({ name: "dataFim", example: "2026-04-12" })
  getDisponibilidade(
    @Query("dataInicio") dataInicio: string,
    @Query("dataFim") dataFim: string,
  ) {
    return this.dashboardService.getDisponibilidadePorPeriodo(
      dataInicio,
      dataFim,
    );
  }

  @Get("grafico-mensal")
  @ApiOperation({
    summary: "Evolução de locações por mês (para gráfico de linha)",
  })
  @ApiQuery({
    name: "meses",
    required: false,
    example: 6,
    description: "Quantos meses anteriores incluir",
  })
  getGraficoMensal(@Query("meses") meses?: string) {
    return this.dashboardService.getLocacoesPorMes(meses ? parseInt(meses) : 6);
  }
}
