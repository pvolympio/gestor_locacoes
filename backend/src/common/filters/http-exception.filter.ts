// src/common/filters/http-exception.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Request, Response } from "express";
import { Prisma } from "@prisma/client";

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = "Erro interno do servidor";
    let errors: any = null;

    // ── HttpException (erros da aplicação) ───────────────────
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === "string") {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === "object") {
        const resp = exceptionResponse as any;
        message = resp.message || message;
        // class-validator retorna array de erros
        if (Array.isArray(resp.message)) {
          errors = resp.message;
          message = "Dados inválidos. Verifique os campos e tente novamente.";
        }
      }
    }

    // ── Erros do Prisma ──────────────────────────────────────
    else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      switch (exception.code) {
        case "P2002":
          status = HttpStatus.CONFLICT;
          message =
            "Este registro já existe. Verifique os dados e tente novamente.";
          break;
        case "P2025":
          status = HttpStatus.NOT_FOUND;
          message = "Registro não encontrado.";
          break;
        case "P2003":
          status = HttpStatus.BAD_REQUEST;
          message = "Referência inválida. Verifique os dados relacionados.";
          break;
        default:
          status = HttpStatus.BAD_REQUEST;
          message = "Erro ao processar a solicitação.";
      }
    }

    // ── Log do erro ──────────────────────────────────────────
    const isServerError = status >= 500;
    if (isServerError) {
      this.logger.error(
        `[${request.method}] ${request.url} → ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else {
      this.logger.warn(
        `[${request.method}] ${request.url} → ${status}: ${message}`,
      );
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      message,
      errors,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
