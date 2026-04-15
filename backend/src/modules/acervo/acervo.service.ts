// src/modules/acervo/acervo.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { AcervoStatus, Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateAcervoDto, AcervoQueryDto } from "./dto/create-acervo.dto";
import { paginate } from "../../common/dto/pagination.dto";

@Injectable()
export class AcervoService {
  constructor(private prisma: PrismaService) {}

  // ── Criar item ───────────────────────────────────────────
  async create(dto: CreateAcervoDto, criadoPorId: string) {
    if (dto.codigoInterno) {
      const existe = await this.prisma.acervo.findUnique({
        where: { codigoInterno: dto.codigoInterno },
      });
      if (existe)
        throw new ConflictException(
          "Já existe um item com este código interno.",
        );
    }

    const item = await this.prisma.acervo.create({
      data: {
        ...dto,
        quantidadeAtual: dto.quantidadeTotal,
        status:
          dto.quantidadeTotal > 0
            ? AcervoStatus.DISPONIVEL
            : AcervoStatus.INATIVO,
        criadoPorId,
      },
      include: { categoria: true },
    });

    await this.registrarHistorico(
      item.id,
      "CRIADO",
      `Item "${item.nome}" adicionado ao acervo`,
      0,
      item.quantidadeTotal,
    );
    return item;
  }

  // ── Listar com filtros ───────────────────────────────────
  async findAll(query: AcervoQueryDto) {
    const where: Prisma.AcervoWhereInput = { ativo: true };

    if (query.search) {
      where.OR = [
        { nome: { contains: query.search, mode: "insensitive" } },
        { codigoInterno: { contains: query.search, mode: "insensitive" } },
        { descricao: { contains: query.search, mode: "insensitive" } },
      ];
    }

    if (query.status) where.status = query.status;
    if (query.categoriaId) where.categoriaId = query.categoriaId;
    if (query.apenasDisponiveis) {
      where.quantidadeAtual = { gt: 0 };
      where.status = { not: AcervoStatus.INATIVO };
    }

    const orderBy: Prisma.AcervoOrderByWithRelationInput =
      query.orderBy === "categoria"
        ? { categoria: { nome: query.order ?? "asc" } }
        : { [query.orderBy ?? "nome"]: query.order ?? "asc" };

    const [data, total] = await Promise.all([
      this.prisma.acervo.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy,
        include: {
          categoria: { select: { id: true, nome: true, cor: true } },
          _count: { select: { itensLocacao: true } },
        },
      }),
      this.prisma.acervo.count({ where }),
    ]);

    return paginate(data, total, query);
  }

  // ── Detalhe de um item ───────────────────────────────────
  async findOne(id: string) {
    const item = await this.prisma.acervo.findUnique({
      where: { id },
      include: {
        categoria: true,
        historico: { orderBy: { criadoEm: "desc" }, take: 20 },
        itensLocacao: {
          where: {
            locacao: { status: { in: ["CONFIRMADA", "ATIVA", "ATRASADA"] } },
          },
          include: {
            locacao: {
              select: {
                id: true,
                dataRetirada: true,
                dataDevolucao: true,
                status: true,
                cliente: { select: { id: true, nome: true } },
              },
            },
          },
          take: 10,
        },
      },
    });

    if (!item) throw new NotFoundException("Item do acervo não encontrado.");
    return item;
  }

  // ── Atualizar item ───────────────────────────────────────
  async update(id: string, dto: Partial<CreateAcervoDto>) {
    const item = await this.findOne(id);
    const quantidadeAntes = item.quantidadeTotal;
    const novaQuantidade = dto.quantidadeTotal ?? item.quantidadeTotal;

    // Recalcula disponível proporcionalmente
    const emUso = item.quantidadeTotal - item.quantidadeAtual;
    const novaAtual = Math.max(0, novaQuantidade - emUso);

    const updated = await this.prisma.acervo.update({
      where: { id },
      data: {
        ...dto,
        quantidadeTotal: novaQuantidade,
        quantidadeAtual: novaAtual,
        status: this.calcularStatus(novaQuantidade, novaAtual),
      },
      include: { categoria: true },
    });

    if (
      dto.quantidadeTotal !== undefined &&
      dto.quantidadeTotal !== quantidadeAntes
    ) {
      await this.registrarHistorico(
        id,
        "QUANTIDADE_ALTERADA",
        `Quantidade alterada de ${quantidadeAntes} para ${novaQuantidade}`,
        quantidadeAntes,
        novaQuantidade,
      );
    }

    return updated;
  }

  // ── Desativar item ───────────────────────────────────────
  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.acervo.update({
      where: { id },
      data: { ativo: false, status: AcervoStatus.INATIVO },
    });
  }

  // ── Verificar disponibilidade para um período ────────────
  async verificarDisponibilidade(
    acervoId: string,
    quantidade: number,
    dataInicio: Date,
    dataFim: Date,
    excluirLocacaoId?: string,
  ) {
    // PERF: findUnique leve — só o que a verificação precisa,
    // sem carregar histórico, categoria ou locacões vinculadas
    const item = await this.prisma.acervo.findUnique({
      where: { id: acervoId },
      select: { status: true, quantidadeTotal: true },
    });

    if (!item) return { disponivel: false, quantidadeDisponivel: 0, conflitos: [] };
    if (item.status === AcervoStatus.INATIVO) {
      return { disponivel: false, quantidadeDisponivel: 0, conflitos: [] };
    }

    const locacoesConflitantes = await this.prisma.itemLocacao.findMany({
      where: {
        acervoId,
        locacao: {
          id: excluirLocacaoId ? { not: excluirLocacaoId } : undefined,
          status: { in: ["CONFIRMADA", "ATIVA", "ATRASADA"] },
          AND: [
            { dataRetirada: { lt: dataFim } },
            { dataDevolucao: { gt: dataInicio } },
          ],
        },
      },
      include: {
        locacao: {
          select: {
            id: true,
            dataRetirada: true,
            dataDevolucao: true,
            status: true,
            cliente: { select: { nome: true } },
          },
        },
      },
    });

    const totalEmUso = locacoesConflitantes.reduce(
      (s, i) => s + i.quantidade,
      0,
    );
    const quantidadeDisponivel = item.quantidadeTotal - totalEmUso;

    return {
      disponivel: quantidadeDisponivel >= quantidade,
      quantidadeDisponivel,
      conflitos: locacoesConflitantes.map((c) => c.locacao),
    };
  }

  // ── Listar categorias ────────────────────────────────────
  async listarCategorias() {
    return this.prisma.categoria.findMany({
      include: { _count: { select: { itens: true } } },
      orderBy: { nome: "asc" },
    });
  }

  // ── Helpers públicos ─────────────────────────────────────

  /** Registra qualquer ação no histórico do acervo */
  async registrarHistorico(
    acervoId: string,
    acao: string,
    detalhe: string,
    antes: number,
    depois: number,
  ) {
    await this.prisma.historicoAcervo.create({
      data: {
        acervoId,
        acao,
        detalhe,
        quantidadeAntes: antes,
        quantidadeDepois: depois,
      },
    });
  }

  /**
   * CORRIGIDO: Recalcula quantidadeAtual e status com base nas locações ativas.
   * Usa $transaction para evitar race condition entre chamadas paralelas.
   */
  async atualizarDisponibilidade(acervoId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const item = await tx.acervo.findUnique({ where: { id: acervoId } });
      if (!item || !item.ativo) return;

      const agora = new Date();

      // Soma tudo que está alocado em locações ativas no momento atual
      const resultado = await tx.itemLocacao.aggregate({
        where: {
          acervoId,
          locacao: {
            status: { in: ["CONFIRMADA", "ATIVA", "ATRASADA"] },
            dataRetirada: { lte: agora },
            dataDevolucao: { gte: agora },
          },
        },
        _sum: { quantidade: true },
      });

      const quantidadeEmUso = resultado._sum.quantidade ?? 0;
      const quantidadeAtual = Math.max(
        0,
        item.quantidadeTotal - quantidadeEmUso,
      );
      const status = this.calcularStatus(item.quantidadeTotal, quantidadeAtual);

      await tx.acervo.update({
        where: { id: acervoId },
        data: { quantidadeAtual, status },
      });
    });
  }

  // ── Imagem do item ───────────────────────────────────────
  async setImagem(id: string, imagemUrl: string | null) {
    const item = await this.findOne(id);

    // Remove arquivo antigo do disco se existir
    if (item.imagemUrl) {
      const { existsSync, unlinkSync } = await import("fs");
      const oldPath = item.imagemUrl.startsWith("/")
        ? item.imagemUrl.slice(1)
        : item.imagemUrl;
      if (existsSync(oldPath)) {
        try { unlinkSync(oldPath); } catch { /* ignora se falhar */ }
      }
    }

    return this.prisma.acervo.update({
      where: { id },
      data: { imagemUrl },
    });
  }

  // ── Helper privado ───────────────────────────────────────
  private calcularStatus(total: number, atual: number): AcervoStatus {
    if (total === 0) return AcervoStatus.INATIVO;
    if (atual === 0) return AcervoStatus.ALUGADO;
    if (atual < total) return AcervoStatus.PARCIALMENTE;
    return AcervoStatus.DISPONIVEL;
  }
}

