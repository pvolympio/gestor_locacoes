// src/modules/acervo/acervo.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from "@nestjs/swagger";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { extname } from "path";
import { existsSync, mkdirSync } from "fs";
import { AcervoService } from "./acervo.service";
import { CreateAcervoDto, AcervoQueryDto } from "./dto/create-acervo.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

const UPLOAD_DIR = "uploads/acervo";

// Garante que o diretório existe ao carregar o módulo
if (!existsSync(UPLOAD_DIR)) mkdirSync(UPLOAD_DIR, { recursive: true });

const multerStorage = diskStorage({
  destination: UPLOAD_DIR,
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `${unique}${extname(file.originalname).toLowerCase()}`);
  },
});

const imageFilter = (
  _req: unknown,
  file: Express.Multer.File,
  cb: (error: Error | null, acceptFile: boolean) => void,
) => {
  if (!file.mimetype.match(/^image\/(jpeg|png|webp|gif)$/)) {
    return cb(
      new BadRequestException("Apenas imagens JPG, PNG, WEBP ou GIF são permitidas."),
      false,
    );
  }
  cb(null, true);
};

@ApiTags("acervo")
@ApiBearerAuth("access-token")
@UseGuards(JwtAuthGuard)
@Controller("acervo")
export class AcervoController {
  constructor(private readonly acervoService: AcervoService) {}

  @Post()
  @ApiOperation({ summary: "Adicionar item ao acervo" })
  create(@Body() dto: CreateAcervoDto, @CurrentUser("id") userId: string) {
    return this.acervoService.create(dto, userId);
  }

  @Get()
  @ApiOperation({ summary: "Listar acervo com filtros, busca e paginação" })
  findAll(@Query() query: AcervoQueryDto) {
    return this.acervoService.findAll(query);
  }

  @Get("categorias")
  @ApiOperation({ summary: "Listar todas as categorias" })
  categorias() {
    return this.acervoService.listarCategorias();
  }

  @Get(":id/disponibilidade")
  @ApiOperation({
    summary: "Verificar disponibilidade de um item em um período",
  })
  @ApiQuery({ name: "dataInicio", required: true, example: "2026-04-10" })
  @ApiQuery({ name: "dataFim", required: true, example: "2026-04-12" })
  @ApiQuery({ name: "quantidade", required: false, example: 1 })
  @ApiQuery({ name: "excluirLocacaoId", required: false })
  verificarDisponibilidade(
    @Param("id") id: string,
    @Query("dataInicio") dataInicio: string,
    @Query("dataFim") dataFim: string,
    @Query("quantidade") quantidade = "1",
    @Query("excluirLocacaoId") excluirLocacaoId?: string,
  ) {
    return this.acervoService.verificarDisponibilidade(
      id,
      parseInt(quantidade),
      new Date(dataInicio),
      new Date(dataFim),
      excluirLocacaoId,
    );
  }

  @Get(":id")
  @ApiOperation({ summary: "Detalhes de um item do acervo com histórico" })
  findOne(@Param("id") id: string) {
    return this.acervoService.findOne(id);
  }

  @Put(":id")
  @ApiOperation({ summary: "Atualizar item do acervo" })
  update(
    @Param("id") id: string,
    @Body() dto: Partial<CreateAcervoDto>,
  ) {
    return this.acervoService.update(id, dto);
  }

  // ── Upload de imagem ─────────────────────────────────────
  @Patch(":id/imagem")
  @ApiOperation({ summary: "Fazer upload ou remover a foto do item" })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: { file: { type: "string", format: "binary" } },
    },
  })
  @UseInterceptors(
    FileInterceptor("file", {
      storage: multerStorage,
      fileFilter: imageFilter,
      limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    }),
  )
  uploadImagem(
    @Param("id") id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException("Nenhum arquivo enviado.");
    const imagemUrl = `/${UPLOAD_DIR}/${file.filename}`;
    return this.acervoService.setImagem(id, imagemUrl);
  }

  @Delete(":id/imagem")
  @ApiOperation({ summary: "Remover a foto do item" })
  removeImagem(@Param("id") id: string) {
    return this.acervoService.setImagem(id, null);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Desativar item do acervo (soft delete)" })
  remove(@Param("id") id: string) {
    return this.acervoService.remove(id);
  }
}
