// src/app.module.ts
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { ScheduleModule } from "@nestjs/schedule";
import { APP_GUARD } from "@nestjs/core";

import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./modules/auth/auth.module";
import { AcervoModule } from "./modules/acervo/acervo.module";
import { LocacoesModule } from "./modules/locacoes/locacoes.module";
import { AgendaModule } from "./modules/agenda/agenda.module";
import { ClientesModule } from "./modules/clientes/clientes.module";
import { DashboardModule } from "./modules/dashboard/dashboard.module";
import { JwtAuthGuard } from "./common/guards/jwt-auth.guard";
import { RolesGuard } from "./common/guards/roles.guard";
import appConfig from "./config/app.config";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      envFilePath: [".env.local", ".env"],
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    ClientesModule,
    AcervoModule,
    LocacoesModule,
    AgendaModule,
    DashboardModule,
  ],
  providers: [
    // CORRIGIDO: Guards centralizados aqui, removidos do AuthModule
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
