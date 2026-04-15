// src/modules/locacoes/locacoes.module.ts
import { Module } from "@nestjs/common";
import { LocacoesController } from "./locacoes.controller";
import { LocacoesService } from "./locacoes.service";
import { AcervoModule } from "../acervo/acervo.module";
import { AgendaModule } from "../agenda/agenda.module";
import { DashboardModule } from "../dashboard/dashboard.module";

@Module({
  imports: [AcervoModule, AgendaModule, DashboardModule],
  controllers: [LocacoesController],
  providers: [LocacoesService],
  exports: [LocacoesService],
})
export class LocacoesModule {}
