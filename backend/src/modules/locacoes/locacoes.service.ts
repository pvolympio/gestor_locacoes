// src/modules/locacoes/locacoes.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from "@nestjs/common";
import { LocacaoStatus, Prisma } from "@prisma/client";
import { Cron } from "@nestjs/schedule";
import { PrismaService } from "../../prisma/prisma.service";
import { AcervoService } from "../acervo/acervo.service";
import { AgendaService } from "../agenda/agenda.service";
import { DashboardService } from "../dashboard/dashboard.service";
import { CreateLocacaoDto, LocacaoQueryDto } from "./dto/create-locacao.dto";
import { paginate } from "../../common/dto/pagination.dto";

@Injectable()
export class LocacoesService {
  private readonly logger = new Logger(LocacoesService.name);

  constructor(
    private prisma: PrismaService,
    private acervoService: AcervoService,
    private agendaService: AgendaService,
    private dashboardService: DashboardService,
  ) {}

  // ── Criar Locação ────────────────────────────────────────
  async create(dto: CreateLocacaoDto, criadoPorId: string) {
    const dataRetirada = new Date(dto.dataRetirada);
    const dataDevolucao = new Date(dto.dataDevolucao);

    if (dataDevolucao <= dataRetirada) {
      throw new BadRequestException(
        "A data de devolução deve ser posterior à data de retirada.",
      );
    }

    // PERF: Verifica disponibilidade de todos os itens em paralelo
    const verificacoes = await Promise.all(
      dto.itens.map((item) =>
        this.acervoService.verificarDisponibilidade(
          item.acervoId,
          item.quantidade,
          dataRetirada,
          dataDevolucao,
        ).then((resultado) => ({ item, resultado })),
      ),
    );

    const conflitos: string[] = [];
    for (const { item, resultado } of verificacoes) {
      if (!resultado.disponivel) {
        const acervo = await this.prisma.acervo.findUnique({
          where: { id: item.acervoId },
          select: { nome: true },
        });
        conflitos.push(
          `"${acervo?.nome}" — disponível: ${resultado.quantidadeDisponivel}, solicitado: ${item.quantidade}`,
        );
      }
    }

    if (conflitos.length > 0) {
      throw new ConflictException(
        `Itens indisponíveis no período selecionado:\n${conflitos.join("\n")}`,
      );
    }

    const valorTotal = dto.valorTotal ? parseFloat(dto.valorTotal) : null;
    const desconto = dto.desconto ? parseFloat(dto.desconto) : 0;
    const valorFinal = valorTotal !== null ? valorTotal - desconto : null;

    const locacao = await this.prisma.$transaction(async (tx) => {
      return tx.locacao.create({
        data: {
          clienteId: dto.clienteId,
          dataRetirada,
          dataDevolucao,
          status: LocacaoStatus.CONFIRMADA,
          observacoes: dto.observacoes,
          valorTotal,
          desconto,
          valorFinal,
          formaPagamento: dto.formaPagamento,
          pago: dto.pago ?? false,
          criadoPorId,
          itens: {
            create: dto.itens.map((i) => ({
              acervoId: i.acervoId,
              quantidade: i.quantidade,
              observacao: i.observacao,
            })),
          },
        },
        include: {
          cliente: { select: { id: true, nome: true, telefone: true } },
          itens: { include: { acervo: { select: { id: true, nome: true } } } },
        },
      });
    });

    // Atualiza disponibilidade e registra histórico em paralelo
    await Promise.all(
      dto.itens.flatMap((item) => [
        this.acervoService.atualizarDisponibilidade(item.acervoId),
        this.acervoService.registrarHistorico(
          item.acervoId,
          "ALUGADO",
          `Alocado na locação #${locacao.id.slice(0, 8)} — cliente: ${locacao.cliente.nome}`,
          0,
          item.quantidade,
        ),
      ]),
    );

    // Cria eventos automáticos na agenda
    await this.agendaService.criarEventosDeLocacao(
      locacao.id,
      dataRetirada,
      dataDevolucao,
      locacao.cliente.nome,
    );

    // Invalida cache do dashboard após criação
    this.dashboardService.invalidarCache();
    return locacao;
  }

  // ── Listar locações com filtros ──────────────────────────
  async findAll(query: LocacaoQueryDto) {
    const where: Prisma.LocacaoWhereInput = {};

    if (query.status) where.status = query.status;
    if (query.clienteId) where.clienteId = query.clienteId;
    if (query.atrasadas) where.status = LocacaoStatus.ATRASADA;

    if (query.dataInicio || query.dataFim) {
      where.dataRetirada = {};
      if (query.dataInicio)
        (where.dataRetirada as any).gte = new Date(query.dataInicio);
      if (query.dataFim)
        (where.dataRetirada as any).lte = new Date(query.dataFim);
    }

    if (query.search) {
      where.cliente = { nome: { contains: query.search, mode: "insensitive" } };
    }

    const [data, total] = await Promise.all([
      this.prisma.locacao.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { [query.orderBy ?? "dataRetirada"]: query.order ?? "desc" },
        include: {
          cliente: { select: { id: true, nome: true, telefone: true } },
          itens: { include: { acervo: { select: { id: true, nome: true } } } },
        },
      }),
      this.prisma.locacao.count({ where }),
    ]);

    return paginate(data, total, query);
  }

  // ── Detalhes de uma locação ──────────────────────────────
  async findOne(id: string) {
    const locacao = await this.prisma.locacao.findUnique({
      where: { id },
      include: {
        cliente: true,
        itens: {
          include: { acervo: { include: { categoria: true } } },
        },
        eventos: true,
        criadoPor: { select: { id: true, nome: true } },
      },
    });

    if (!locacao) throw new NotFoundException("Locação não encontrada.");
    return locacao;
  }

  // ── Atualizar locação ────────────────────────────────────
  async update(id: string, dto: Partial<CreateLocacaoDto>) {
    const locacao = await this.findOne(id);

    if (["FINALIZADA", "CANCELADA"].includes(locacao.status)) {
      throw new BadRequestException(
        `Não é possível editar uma locação ${locacao.status.toLowerCase()}.`,
      );
    }

    const dataRetirada = dto.dataRetirada
      ? new Date(dto.dataRetirada)
      : locacao.dataRetirada;
    const dataDevolucao = dto.dataDevolucao
      ? new Date(dto.dataDevolucao)
      : locacao.dataDevolucao;

    if (dto.itens) {
      for (const item of dto.itens) {
        const { disponivel, quantidadeDisponivel } =
          await this.acervoService.verificarDisponibilidade(
            item.acervoId,
            item.quantidade,
            dataRetirada,
            dataDevolucao,
            id,
          );
        if (!disponivel) {
          const acervo = await this.prisma.acervo.findUnique({
            where: { id: item.acervoId },
            select: { nome: true },
          });
          throw new ConflictException(
            `Item "${acervo?.nome}" indisponível. Disponível: ${quantidadeDisponivel}`,
          );
        }
      }
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      if (dto.itens) {
        await tx.itemLocacao.deleteMany({ where: { locacaoId: id } });
        await tx.itemLocacao.createMany({
          data: dto.itens.map((i) => ({
            locacaoId: id,
            acervoId: i.acervoId,
            quantidade: i.quantidade,
          })),
        });
      }

      return tx.locacao.update({
        where: { id },
        data: {
          dataRetirada,
          dataDevolucao,
          observacoes: dto.observacoes ?? locacao.observacoes,
          formaPagamento: dto.formaPagamento ?? locacao.formaPagamento,
          pago: dto.pago ?? locacao.pago,
        },
        include: { cliente: true, itens: { include: { acervo: true } } },
      });
    });

    // Atualiza disponibilidade de todos os itens envolvidos em paralelo
    const todosIds = new Set([
      ...locacao.itens.map((i) => i.acervoId),
      ...(dto.itens?.map((i) => i.acervoId) ?? []),
    ]);
    await Promise.all(
      [...todosIds].map((acervoId) =>
        this.acervoService.atualizarDisponibilidade(acervoId),
      ),
    );

    return updated;
  }

  // ── Finalizar (devolver itens) ───────────────────────────
  async finalizar(id: string, observacoes?: string) {
    const locacao = await this.findOne(id);

    if (locacao.status === LocacaoStatus.FINALIZADA) {
      throw new BadRequestException("Esta locação já foi finalizada.");
    }
    if (locacao.status === LocacaoStatus.CANCELADA) {
      throw new BadRequestException(
        "Não é possível finalizar uma locação cancelada.",
      );
    }

    await this.prisma.locacao.update({
      where: { id },
      data: {
        status: LocacaoStatus.FINALIZADA,
        dataDevolvido: new Date(),
        observacoes: observacoes ?? locacao.observacoes,
      },
    });

    // Libera itens e registra histórico de devolução em paralelo
    await Promise.all(
      locacao.itens.flatMap((item) => [
        this.acervoService.atualizarDisponibilidade(item.acervoId),
        this.acervoService.registrarHistorico(
          item.acervoId,
          "DEVOLVIDO",
          `Devolvido via locação #${id.slice(0, 8)} — cliente: ${locacao.cliente.nome}`,
          item.quantidade,
          0,
        ),
      ]),
    );

    // Invalida cache do dashboard após finalização
    this.dashboardService.invalidarCache();
    return {
      message: "Locação finalizada com sucesso. Itens devolvidos ao acervo.",
    };
  }

  // ── Cancelar ─────────────────────────────────────────────
  async cancelar(id: string, motivo?: string) {
    const locacao = await this.findOne(id);

    if (locacao.status === LocacaoStatus.FINALIZADA) {
      throw new BadRequestException(
        "Não é possível cancelar uma locação já finalizada.",
      );
    }

    await this.prisma.locacao.update({
      where: { id },
      data: {
        status: LocacaoStatus.CANCELADA,
        observacoes: motivo
          ? `${locacao.observacoes ?? ""} | CANCELADO: ${motivo}`.trim()
          : locacao.observacoes,
      },
    });

    // Libera itens e registra histórico de cancelamento em paralelo
    await Promise.all(
      locacao.itens.flatMap((item) => [
        this.acervoService.atualizarDisponibilidade(item.acervoId),
        this.acervoService.registrarHistorico(
          item.acervoId,
          "CANCELADO",
          `Liberado por cancelamento da locação #${id.slice(0, 8)}`,
          item.quantidade,
          0,
        ),
      ]),
    );

    // Invalida cache do dashboard após cancelamento
    this.dashboardService.invalidarCache();
    return { message: "Locação cancelada." };
  }

  // ── CRON: Marca como ATRASADA quando vence ───────────────
  @Cron("0 * * * *")
  async atualizarLocacoesAtrasadas() {
    const { count } = await this.prisma.locacao.updateMany({
      where: {
        status: { in: [LocacaoStatus.CONFIRMADA, LocacaoStatus.ATIVA] },
        dataDevolucao: { lt: new Date() },
      },
      data: { status: LocacaoStatus.ATRASADA },
    });
    if (count > 0) {
      this.logger.warn(
        `⚠️  ${count} locação(ões) marcada(s) como ATRASADA automaticamente.`,
      );
    }
  }

  // ── CRON: Ativa locações na data de retirada ─────────────
  @Cron("0 * * * *")
  async ativarLocacoesNaDataRetirada() {
    const agora = new Date();
    const { count } = await this.prisma.locacao.updateMany({
      where: {
        status: LocacaoStatus.CONFIRMADA,
        dataRetirada: { lte: agora },
        dataDevolucao: { gte: agora },
      },
      data: { status: LocacaoStatus.ATIVA },
    });
    if (count > 0) {
      this.logger.log(`✅ ${count} locação(ões) ativada(s) automaticamente.`);
    }
  }

  // ── Exportar como CSV ────────────────────────────────────
  async exportCsv(query: LocacaoQueryDto): Promise<string> {
    // Busca sem paginação — todos os registros que casam com os filtros
    const where: Prisma.LocacaoWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.clienteId) where.clienteId = query.clienteId;
    if (query.atrasadas) where.status = LocacaoStatus.ATRASADA;
    if (query.dataInicio || query.dataFim) {
      where.dataRetirada = {};
      if (query.dataInicio) (where.dataRetirada as any).gte = new Date(query.dataInicio);
      if (query.dataFim) (where.dataRetirada as any).lte = new Date(query.dataFim);
    }
    if (query.search) {
      where.cliente = { nome: { contains: query.search, mode: "insensitive" } };
    }

    const locacoes = await this.prisma.locacao.findMany({
      where,
      orderBy: { dataRetirada: "desc" },
      include: {
        cliente: { select: { nome: true, telefone: true, email: true } },
        itens: { include: { acervo: { select: { nome: true } } } },
      },
    });

    const escape = (v: unknown) => {
      const s = String(v ?? "");
      return s.includes(",") || s.includes('"') || s.includes("\n")
        ? `"${s.replace(/"/g, '""')}"`
        : s;
    };

    const header = [
      "ID", "Cliente", "Telefone", "E-mail", "Itens",
      "Data Retirada", "Data Devolução", "Status", "Pago",
      "Valor Total", "Desconto", "Valor Final", "Forma Pagamento",
      "Criado Em",
    ].join(",");

    const fmt = (d: Date | string | null | undefined) =>
      d ? new Date(d).toLocaleDateString("pt-BR") : "";

    const rows = locacoes.map((l) =>
      [
        l.id.slice(0, 8),
        escape(l.cliente.nome),
        escape(l.cliente.telefone ?? ""),
        escape(l.cliente.email ?? ""),
        escape(l.itens.map((i) => `${i.quantidade}x ${i.acervo.nome}`).join("; ")),
        fmt(l.dataRetirada),
        fmt(l.dataDevolucao),
        l.status,
        l.pago ? "Sim" : "Não",
        l.valorTotal ? String(l.valorTotal) : "",
        l.desconto ? String(l.desconto) : "",
        l.valorFinal ? String(l.valorFinal) : "",
        escape(l.formaPagamento ?? ""),
        fmt(l.criadoEm),
      ].join(","),
    );

    return [header, ...rows].join("\r\n");
  }
}

