// src/modules/clientes/clientes.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiQuery,
} from "@nestjs/swagger";
import { ClientesService } from "./clientes.service";
import { CreateClienteDto } from "./dto/create-cliente.dto";
import { PaginationDto } from "../../common/dto/pagination.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";

@ApiTags("clientes")
@ApiBearerAuth("access-token")
@UseGuards(JwtAuthGuard)
@Controller("clientes")
export class ClientesController {
  constructor(private readonly clientesService: ClientesService) {}

  @Post()
  @ApiOperation({ summary: "Cadastrar novo cliente" })
  create(@Body() dto: CreateClienteDto) {
    return this.clientesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: "Listar clientes com paginação e busca" })
  @ApiQuery({ name: "cidade", required: false })
  findAll(@Query() query: PaginationDto & { cidade?: string }) {
    return this.clientesService.findAll(query);
  }

  @Get("buscar")
  @ApiOperation({ summary: "Busca rápida de clientes por nome (autocomplete)" })
  @ApiQuery({ name: "nome", required: true })
  buscar(@Query("nome") nome: string) {
    return this.clientesService.buscarPorNome(nome);
  }

  @Get(":id")
  @ApiOperation({ summary: "Detalhes de um cliente com histórico de locações" })
  findOne(@Param("id") id: string) {
    return this.clientesService.findOne(id);
  }

  @Put(":id")
  @ApiOperation({ summary: "Atualizar dados do cliente" })
  update(@Param("id") id: string, @Body() dto: CreateClienteDto) {
    return this.clientesService.update(id, dto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Remover cliente (soft delete)" })
  remove(@Param("id") id: string) {
    return this.clientesService.remove(id);
  }
}
