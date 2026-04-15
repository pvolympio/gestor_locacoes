// src/modules/clientes/clientes.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { PartialType } from "@nestjs/swagger";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateClienteDto } from "./dto/create-cliente.dto";
import { PaginationDto, paginate } from "../../common/dto/pagination.dto";

// CORRIGIDO: PartialType torna todos os campos opcionais automaticamente
// e mantém a integração com Swagger (ao contrário de class extension manual)
class UpdateClienteDto extends PartialType(CreateClienteDto) {}

@Injectable()
export class ClientesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateClienteDto) {
    if (dto.cpf) {
      const existe = await this.prisma.cliente.findUnique({
        where: { cpf: dto.cpf },
      });
      if (existe)
        throw new ConflictException("Já existe um cliente com este CPF.");
    }
    return this.prisma.cliente.create({ data: dto });
  }

  async findAll(query: PaginationDto & { cidade?: string }) {
    const where: any = { ativo: true };

    if (query.search) {
      where.OR = [
        { nome: { contains: query.search, mode: "insensitive" } },
        { telefone: { contains: query.search } },
        { email: { contains: query.search, mode: "insensitive" } },
        { cpf: { contains: query.search } },
      ];
    }

    if (query.cidade) {
      where.cidade = { contains: query.cidade, mode: "insensitive" };
    }

    const skip = Number(query.skip ?? 0);
    const take = Number(query.limit ?? 20);
    const orderField = query.orderBy ?? "nome";
    const orderDir = query.order ?? "asc";

    const [data, total] = await Promise.all([
      this.prisma.cliente.findMany({
        where,
        skip,
        take,
        orderBy: { [orderField]: orderDir },
        include: {
          _count: { select: { locacoes: true } },
        },
      }),
      this.prisma.cliente.count({ where }),
    ]);

    return paginate(data, total, query);
  }

  // CORRIGIDO: sem take: 10 — histórico completo disponível via endpoint /locacoes?clienteId=
  async findOne(id: string) {
    const cliente = await this.prisma.cliente.findUnique({
      where: { id },
      include: {
        _count: { select: { locacoes: true } },
      },
    });

    if (!cliente) throw new NotFoundException("Cliente não encontrado.");
    return cliente;
  }

  async update(id: string, dto: Partial<UpdateClienteDto>) {
    await this.findOne(id);
    return this.prisma.cliente.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.cliente.update({
      where: { id },
      data: { ativo: false },
    });
  }

  async buscarPorNome(nome: string) {
    return this.prisma.cliente.findMany({
      where: {
        ativo: true,
        nome: { contains: nome, mode: "insensitive" },
      },
      select: { id: true, nome: true, telefone: true, email: true },
      take: 10,
    });
  }
}
