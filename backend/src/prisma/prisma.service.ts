// src/prisma/prisma.service.ts
import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const isDev = process.env.NODE_ENV !== "production";
    super({
      log: isDev
        ? [
            { emit: "event", level: "query" },
            { emit: "stdout", level: "error" },
            { emit: "stdout", level: "warn" },
          ]
        : [
            // Em produção: só erros e warnings — sem overhead de query log
            { emit: "stdout", level: "error" },
            { emit: "stdout", level: "warn" },
          ],
    });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log("✅ Conectado ao banco de dados PostgreSQL");
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log("🔌 Desconectado do banco de dados");
  }

  /** Limpa todas as tabelas em ordem (útil em testes) */
  async cleanDatabase() {
    if (process.env.NODE_ENV === "production") {
      throw new Error("cleanDatabase não pode ser executado em produção");
    }
    const tableNames = [
      "historico_acervo",
      "itens_locacao",
      "eventos",
      "locacoes",
      "acervo",
      "clientes",
      "categorias",
      "users",
    ];
    for (const tableName of tableNames) {
      await this.$executeRawUnsafe(
        `TRUNCATE TABLE "${tableName}" RESTART IDENTITY CASCADE;`,
      );
    }
  }
}
