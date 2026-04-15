// src/modules/agenda/agenda.controller.ts
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
import { AgendaService } from "./agenda.service";
import { CreateEventoDto, EventoQueryDto } from "./dto/create-evento.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

@ApiTags("agenda")
@ApiBearerAuth("access-token")
@UseGuards(JwtAuthGuard)
@Controller("agenda")
export class AgendaController {
  constructor(private readonly agendaService: AgendaService) {}

  @Post()
  @ApiOperation({ summary: "Criar evento manual na agenda" })
  create(@Body() dto: CreateEventoDto, @CurrentUser("id") userId: string) {
    return this.agendaService.create(dto, userId);
  }

  @Get()
  @ApiOperation({ summary: "Listar eventos com filtros" })
  findAll(@Query() query: EventoQueryDto) {
    return this.agendaService.findAll(query);
  }

  @Get("mes")
  @ApiOperation({
    summary: "Todos os eventos de um mês (ideal para calendário)",
  })
  @ApiQuery({ name: "ano", example: 2026 })
  @ApiQuery({
    name: "mes",
    example: 4,
    description: "1 = Janeiro ... 12 = Dezembro",
  })
  eventosPorMes(@Query("ano") ano: string, @Query("mes") mes: string) {
    return this.agendaService.eventosPorMes(parseInt(ano), parseInt(mes));
  }

  @Get("devolucoes-hoje")
  @ApiOperation({ summary: "Locações com devolução prevista para hoje" })
  devolucoesHoje() {
    return this.agendaService.proximasDevolucoesHoje();
  }

  @Get(":id")
  @ApiOperation({ summary: "Detalhe de um evento" })
  findOne(@Param("id") id: string) {
    return this.agendaService.findOne(id);
  }

  @Put(":id")
  @ApiOperation({ summary: "Atualizar evento" })
  update(@Param("id") id: string, @Body() dto: Partial<CreateEventoDto>) {
    return this.agendaService.update(id, dto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Remover evento" })
  remove(@Param("id") id: string) {
    return this.agendaService.remove(id);
  }
}
