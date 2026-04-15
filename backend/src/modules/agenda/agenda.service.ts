// src/modules/agenda/agenda.service.ts
import { Injectable, NotFoundException } from "@nestjs/common";
import { EventoTipo, Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateEventoDto, EventoQueryDto } from "./dto/create-evento.dto";
import { paginate } from "../../common/dto/pagination.dto";

@Injectable()
export class AgendaService {
  constructor(private prisma: PrismaService) {}

  // ── Criar evento manual ──────────────────────────────────
  async create(dto: CreateEventoDto, criadoPorId: string) {
    return this.prisma.evento.create({
      data: {
        ...dto,
        dataInicio: new Date(dto.dataInicio),
        dataFim: dto.dataFim ? new Date(dto.dataFim) : null,
        criadoPorId,
      },
      include: {
        locacao: { select: { id: true, cliente: { select: { nome: true } } } },
      },
    });
  }

  // ── Listar eventos (com filtro de período para calendário) ─
  async findAll(query: EventoQueryDto) {
    const where: Prisma.EventoWhereInput = {};

    if (query.tipo) where.tipo = query.tipo;
    if (query.locacaoId) where.locacaoId = query.locacaoId;

    if (query.dataInicio || query.dataFim) {
      where.dataInicio = {};
      if (query.dataInicio) where.dataInicio.gte = new Date(query.dataInicio);
      if (query.dataFim) where.dataInicio.lte = new Date(query.dataFim);
    }

    if (query.search) {
      where.OR = [
        { titulo: { contains: query.search, mode: "insensitive" } },
        { descricao: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.evento.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { dataInicio: "asc" },
        include: {
          locacao: {
            select: {
              id: true,
              status: true,
              cliente: { select: { id: true, nome: true } },
            },
          },
        },
      }),
      this.prisma.evento.count({ where }),
    ]);

    return paginate(data, total, query);
  }

  // ── Eventos de um mês específico (para visualização de calendário) ─
  async eventosPorMes(ano: number, mes: number) {
    const inicio = new Date(ano, mes - 1, 1);
    const fim = new Date(ano, mes, 0, 23, 59, 59);

    const eventos = await this.prisma.evento.findMany({
      where: {
        OR: [
          { dataInicio: { gte: inicio, lte: fim } },
          { dataFim: { gte: inicio, lte: fim } },
          { AND: [{ dataInicio: { lte: inicio } }, { dataFim: { gte: fim } }] },
        ],
      },
      orderBy: { dataInicio: "asc" },
      include: {
        locacao: {
          select: {
            id: true,
            status: true,
            cliente: { select: { id: true, nome: true, telefone: true } },
          },
        },
      },
    });

    return eventos;
  }

  // ── Detalhe de um evento ─────────────────────────────────
  async findOne(id: string) {
    const evento = await this.prisma.evento.findUnique({
      where: { id },
      include: {
        locacao: {
          include: { cliente: true, itens: { include: { acervo: true } } },
        },
        criadoPor: { select: { id: true, nome: true } },
      },
    });

    if (!evento) throw new NotFoundException("Evento não encontrado.");
    return evento;
  }

  // ── Atualizar evento ─────────────────────────────────────
  async update(id: string, dto: Partial<CreateEventoDto>) {
    await this.findOne(id);
    return this.prisma.evento.update({
      where: { id },
      data: {
        ...dto,
        dataInicio: dto.dataInicio ? new Date(dto.dataInicio) : undefined,
        dataFim: dto.dataFim ? new Date(dto.dataFim) : undefined,
      },
    });
  }

  // ── Remover evento ───────────────────────────────────────
  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.evento.delete({ where: { id } });
    return { message: "Evento removido." };
  }

  // ── Cria eventos de RETIRADA e DEVOLUÇÃO automaticamente ─
  // Chamado internamente ao criar uma locação
  async criarEventosDeLocacao(
    locacaoId: string,
    dataRetirada: Date,
    dataDevolucao: Date,
    nomeCliente: string,
  ) {
    await this.prisma.evento.createMany({
      data: [
        {
          titulo: `📦 Retirada — ${nomeCliente}`,
          dataInicio: dataRetirada,
          dataFim: dataRetirada,
          diaInteiro: true,
          tipo: EventoTipo.RETIRADA,
          cor: "#10b981",
          locacaoId,
        },
        {
          titulo: `🔄 Devolução — ${nomeCliente}`,
          dataInicio: dataDevolucao,
          dataFim: dataDevolucao,
          diaInteiro: true,
          tipo: EventoTipo.DEVOLUCAO,
          cor: "#f59e0b",
          locacaoId,
        },
      ],
    });
  }

  // ── Próximas devoluções (para alertas no dashboard) ──────
  async proximasDevolucoesHoje() {
    const hoje = new Date();
    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);

    return this.prisma.locacao.findMany({
      where: {
        status: { in: ["ATIVA", "CONFIRMADA"] },
        dataDevolucao: { gte: hoje, lt: amanha },
      },
      include: { cliente: { select: { nome: true, telefone: true } } },
    });
  }
}
