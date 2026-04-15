// src/main.ts
import { NestFactory, Reflector } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import {
  ValidationPipe,
  ClassSerializerInterceptor,
  Logger,
} from "@nestjs/common";
import { join } from "path";
import { existsSync, mkdirSync } from "fs";
import { ConfigService } from "@nestjs/config";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { ResponseInterceptor } from "./common/interceptors/response.interceptor";
import { LoggingInterceptor } from "./common/interceptors/logging.interceptor";

async function bootstrap() {
  const logger = new Logger("Bootstrap");
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ["error", "warn", "log", "debug"],
  });

  // Garante que a pasta de uploads existe
  const uploadsDir = join(process.cwd(), "uploads");
  if (!existsSync(uploadsDir)) mkdirSync(uploadsDir, { recursive: true });

  // Serve arquivos de imagem como estáticos: GET /uploads/acervo/arquivo.jpg
  app.useStaticAssets(uploadsDir, { prefix: "/uploads" });

  const configService = app.get(ConfigService);
  const port = configService.get<number>("PORT", 3000);
  const apiPrefix = configService.get<string>("API_PREFIX", "api/v1");
  const nodeEnv = configService.get<string>("NODE_ENV", "development");
  const isDev = nodeEnv !== "production";

  app.setGlobalPrefix(apiPrefix);

  // ── CORS — em desenvolvimento aceita qualquer localhost ──
  app.enableCors({
    origin: isDev
      ? (origin, cb) => cb(null, true)
      : (configService.get<string>("CORS_ORIGINS", "") || "")
          .split(",")
          .map((o) => o.trim()),
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const reflector = app.get(Reflector);
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new ResponseInterceptor(reflector),
    new ClassSerializerInterceptor(reflector),
  );

  if (isDev) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle("Sistema de Locações API")
      .setDescription("API completa para gestão de acervo, locações e agenda.")
      .setVersion("1.0.0")
      .addBearerAuth(
        { type: "http", scheme: "bearer", bearerFormat: "JWT" },
        "access-token",
      )
      .addTag("auth", "Autenticação e tokens")
      .addTag("acervo", "Gestão do acervo de itens")
      .addTag("locacoes", "Controle de locações")
      .addTag("clientes", "Cadastro de clientes")
      .addTag("agenda", "Agenda e eventos")
      .addTag("dashboard", "Métricas e indicadores")
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup("docs", app, document, {
      swaggerOptions: { persistAuthorization: true },
    });

    logger.log(`📚 Swagger: http://localhost:${port}/docs`);
  }

  await app.listen(port);
  logger.log(`🚀 Servidor rodando em: http://localhost:${port}`);
  logger.log(`🌐 API: http://localhost:${port}/${apiPrefix}`);
  logger.log(`🌍 Ambiente: ${nodeEnv}`);
}

bootstrap();
