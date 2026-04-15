// src/modules/dashboard/dashboard.service.ts
import { Injectable } from "@nestjs/common";
import { LocacaoStatus, AcervoStatus } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

// ── Cache em memória ─────────────────────────────────────────
// TTL de 2 minutos para dados que mudam raramente durante o dia.
// Garante que múltiplos usuários simultâneos não disparem as mesmas
// queries pesadas ao banco — sem nenhuma dependência extra (Redis, etc.).
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class InMemoryCache {
  private store = new Map<string, CacheEntry<unknown>>();

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.data as T;
  }

  set<T>(key: string, data: T, ttlMs: number): void {
    this.store.set(key, { data, expiresAt: Date.now() + ttlMs });
  }

  invalidate(prefix: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) this.store.delete(key);
    }
  }
}

const TTL_METRICAS   = 2 * 60 * 1000;  // 2 min — muda pouco durante o dia
const TTL_GRAFICO    = 5 * 60 * 1000;  // 5 min — dados históricos
const TTL_POPULARES  = 5 * 60 * 1000;  // 5 min — ranking de itens
const TTL_ATRASADAS  = 60 * 1000;      // 1 min — pode urgir

@Injectable()
export class DashboardService {
  private cache = new InMemoryCache();

  constructor(private prisma: PrismaService) {}

  // ── Invalida o cache após operações que alteram dados ────────
  // Chame este método antes do return em createLocacao, finalizar, cancelar
  invalidarCache() {
    this.cache.invalidate("dashboard:");
  }

  // ── Métricas principais do dashboard ────────────────────────
  async getMetricas() {
    const cached = this.cache.get<ReturnType<typeof this._computeMetricas>>(
      "dashboard:metricas",
    );
    if (cached) return cached;

    const resultado = await this._computeMetricas();
    this.cache.set("dashboard:metricas", resultado, TTL_METRICAS);
    return resultado;
  }

  private async _computeMetricas() {
    const agora = new Date();
    const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
    const fimMes = new Date(
      agora.getFullYear(),
      agora.getMonth() + 1,
      0,
      23,
      59,
      59,
    );
    const mesPassadoInicio = new Date(
      agora.getFullYear(),
      agora.getMonth() - 1,
      1,
    );
    const mesPassadoFim = new Date(
      agora.getFullYear(),
      agora.getMonth(),
      0,
      23,
      59,
      59,
    );

    const [
      totalItensAcervo,
      itensDisponiveis,
      itensAlugados,
      totalLocacoes,
      locacoesAtivas,
      locacoesAtrasadas,
      locacoesMesAtual,
      locacoesMesPassado,
      totalClientes,
      proximasDevolucoesHoje,
      proximasDevolucoesAmanha,
    ] = await Promise.all([
      // Acervo
      this.prisma.acervo.count({ where: { ativo: true } }),
      this.prisma.acervo.count({
        where: { ativo: true, status: AcervoStatus.DISPONIVEL },
      }),
      this.prisma.acervo.count({
        where: {
          ativo: true,
          status: { in: [AcervoStatus.ALUGADO, AcervoStatus.PARCIALMENTE] },
        },
      }),

      // Locações gerais
      this.prisma.locacao.count(),
      this.prisma.locacao.count({
        where: {
          status: { in: [LocacaoStatus.ATIVA, LocacaoStatus.CONFIRMADA] },
        },
      }),
      this.prisma.locacao.count({ where: { status: LocacaoStatus.ATRASADA } }),

      // Locações deste mês vs mês passado
      this.prisma.locacao.count({
        where: { criadoEm: { gte: inicioMes, lte: fimMes } },
      }),
      this.prisma.locacao.count({
        where: { criadoEm: { gte: mesPassadoInicio, lte: mesPassadoFim } },
      }),

      // Clientes
      this.prisma.cliente.count({ where: { ativo: true } }),

      // Devoluções
      this.prisma.locacao.count({
        where: {
          status: {
            in: [
              LocacaoStatus.ATIVA,
              LocacaoStatus.CONFIRMADA,
              LocacaoStatus.ATRASADA,
            ],
          },
          dataDevolucao: {
            gte: new Date(agora.toDateString()),
            lt: new Date(new Date(agora).setDate(agora.getDate() + 1)),
          },
        },
      }),
      this.prisma.locacao.count({
        where: {
          status: { in: [LocacaoStatus.ATIVA, LocacaoStatus.CONFIRMADA] },
          dataDevolucao: {
            gte: new Date(new Date(agora).setDate(agora.getDate() + 1)),
            lt: new Date(new Date(agora).setDate(agora.getDate() + 2)),
          },
        },
      }),
    ]);

    const variacaoLocacoes =
      locacoesMesPassado > 0
        ? (
            ((locacoesMesAtual - locacoesMesPassado) / locacoesMesPassado) *
            100
          ).toFixed(1)
        : null;

    return {
      acervo: {
        total: totalItensAcervo,
        disponiveis: itensDisponiveis,
        alugados: itensAlugados,
        taxaOcupacao:
          totalItensAcervo > 0
            ? ((itensAlugados / totalItensAcervo) * 100).toFixed(1)
            : "0",
      },
      locacoes: {
        total: totalLocacoes,
        ativas: locacoesAtivas,
        atrasadas: locacoesAtrasadas,
        mesAtual: locacoesMesAtual,
        mesPassado: locacoesMesPassado,
        variacaoPercentual: variacaoLocacoes,
      },
      clientes: {
        total: totalClientes,
      },
      alertas: {
        devolucoesHoje: proximasDevolucoesHoje,
        devolucoesAmanha: proximasDevolucoesAmanha,
        itensAtrasados: locacoesAtrasadas,
      },
    };
  }

  // ── Locações recentes (feed de atividade) ────────────────────
  // Sem cache — sempre dados frescos (feed em tempo real)
  async getAtividadesRecentes(limite = 10) {
    return this.prisma.locacao.findMany({
      take: limite,
      orderBy: { criadoEm: "desc" },
      include: {
        cliente: { select: { id: true, nome: true } },
        itens: {
          include: { acervo: { select: { nome: true } } },
          take: 3,
        },
      },
    });
  }

  // ── Itens mais alugados ───────────────────────────────────────
  async getItensMaisAlugados(limite = 10) {
    const cacheKey = `dashboard:populares:${limite}`;
    const cached = this.cache.get<Awaited<ReturnType<typeof this._computePopulares>>>(cacheKey);
    if (cached) return cached;

    const resultado = await this._computePopulares(limite);
    this.cache.set(cacheKey, resultado, TTL_POPULARES);
    return resultado;
  }

  private async _computePopulares(limite: number) {
    const resultado = await this.prisma.itemLocacao.groupBy({
      by: ["acervoId"],
      _sum: { quantidade: true },
      _count: { locacaoId: true },
      orderBy: { _count: { locacaoId: "desc" } },
      take: limite,
    });

    const acervos = await this.prisma.acervo.findMany({
      where: { id: { in: resultado.map((r) => r.acervoId) } },
      select: {
        id: true,
        nome: true,
        categoria: { select: { nome: true, cor: true } },
      },
    });

    return resultado.map((r) => ({
      acervo: acervos.find((a) => a.id === r.acervoId),
      totalLocacoes: r._count.locacaoId,
      totalUnidades: r._sum.quantidade,
    }));
  }

  // ── Locações atrasadas com detalhes ──────────────────────────
  async getLocacoesAtrasadas() {
    const cacheKey = "dashboard:atrasadas";
    const cached = this.cache.get<Awaited<ReturnType<typeof this._computeAtrasadas>>>(cacheKey);
    if (cached) return cached;

    const resultado = await this._computeAtrasadas();
    this.cache.set(cacheKey, resultado, TTL_ATRASADAS);
    return resultado;
  }

  private async _computeAtrasadas() {
    return this.prisma.locacao.findMany({
      where: { status: LocacaoStatus.ATRASADA },
      orderBy: { dataDevolucao: "asc" },
      include: {
        cliente: { select: { id: true, nome: true, telefone: true } },
        itens: { include: { acervo: { select: { id: true, nome: true } } } },
      },
    });
  }

  // ── Disponibilidade do acervo no período ─────────────────────
  async getDisponibilidadePorPeriodo(dataInicio: string, dataFim: string) {
    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);

    const locacoesNoPeriodo = await this.prisma.itemLocacao.findMany({
      where: {
        locacao: {
          status: {
            in: [
              LocacaoStatus.CONFIRMADA,
              LocacaoStatus.ATIVA,
              LocacaoStatus.ATRASADA,
            ],
          },
          AND: [
            { dataRetirada: { lt: fim } },
            { dataDevolucao: { gt: inicio } },
          ],
        },
      },
      include: {
        acervo: { select: { id: true, nome: true, quantidadeTotal: true } },
      },
    });

    // Agrupa por item e soma quantidades alocadas
    const mapa = new Map<
      string,
      { nome: string; total: number; alocado: number }
    >();
    for (const item of locacoesNoPeriodo) {
      const existing = mapa.get(item.acervoId);
      if (existing) {
        existing.alocado += item.quantidade;
      } else {
        mapa.set(item.acervoId, {
          nome: item.acervo.nome,
          total: item.acervo.quantidadeTotal,
          alocado: item.quantidade,
        });
      }
    }

    return Array.from(mapa.entries()).map(([id, v]) => ({
      acervoId: id,
      nome: v.nome,
      quantidadeTotal: v.total,
      quantidadeAlocada: v.alocado,
      quantidadeDisponivel: Math.max(0, v.total - v.alocado),
    }));
  }

  // ── Locações por mês (gráfico de evolução) ───────────────────
  async getLocacoesPorMes(meses = 6) {
    const cacheKey = `dashboard:grafico:${meses}`;
    const cached = this.cache.get<{ mes: string; total: number }[]>(cacheKey);
    if (cached) return cached;

    const resultado = await this._computeGrafico(meses);
    this.cache.set(cacheKey, resultado, TTL_GRAFICO);
    return resultado;
  }

  private async _computeGrafico(meses: number) {
    const inicio = new Date();
    inicio.setMonth(inicio.getMonth() - (meses - 1));
    inicio.setDate(1);
    inicio.setHours(0, 0, 0, 0);

    type RawRow = { mes: Date; total: bigint };

    const rows = await this.prisma.$queryRaw<RawRow[]>`
      SELECT
        date_trunc('month', "criadoEm") AS mes,
        COUNT(*)::int                   AS total
      FROM locacoes
      WHERE "criadoEm" >= ${inicio}
      GROUP BY 1
      ORDER BY 1 ASC
    `;

    // Garante que todos os meses apareçam mesmo sem dados
    const resultado = [];
    for (let i = meses - 1; i >= 0; i--) {
      const agora = new Date();
      const ano = agora.getFullYear();
      const mes = agora.getMonth() - i;
      const dt = new Date(ano, mes, 1);

      const found = rows.find(
        (r) =>
          r.mes.getFullYear() === dt.getFullYear() &&
          r.mes.getMonth() === dt.getMonth(),
      );

      resultado.push({
        mes: dt.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
        total: found ? Number(found.total) : 0,
      });
    }

    return resultado;
  }
}
