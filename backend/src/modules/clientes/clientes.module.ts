// src/modules/clientes/clientes.module.ts
import { Module } from "@nestjs/common";
import { ClientesController } from "./clientes.controller";
import { ClientesService } from "./clientes.service";

@Module({
  controllers: [ClientesController],
  providers: [ClientesService],
  exports: [ClientesService],
})
export class ClientesModule {}
