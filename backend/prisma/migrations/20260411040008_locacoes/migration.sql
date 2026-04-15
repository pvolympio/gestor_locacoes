-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'OPERADOR');

-- CreateEnum
CREATE TYPE "AcervoStatus" AS ENUM ('DISPONIVEL', 'PARCIALMENTE', 'ALUGADO', 'INATIVO');

-- CreateEnum
CREATE TYPE "LocacaoStatus" AS ENUM ('PENDENTE', 'CONFIRMADA', 'ATIVA', 'ATRASADA', 'FINALIZADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "EventoTipo" AS ENUM ('RETIRADA', 'DEVOLUCAO', 'RESERVA', 'LEMBRETE', 'OUTRO');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'OPERADOR',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "refreshToken" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "telefone" TEXT,
    "email" TEXT,
    "cpf" TEXT,
    "endereco" TEXT,
    "cidade" TEXT,
    "observacoes" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "cor" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "acervo" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "categoriaId" TEXT,
    "quantidadeTotal" INTEGER NOT NULL DEFAULT 1,
    "quantidadeAtual" INTEGER NOT NULL DEFAULT 1,
    "status" "AcervoStatus" NOT NULL DEFAULT 'DISPONIVEL',
    "codigoInterno" TEXT,
    "observacoes" TEXT,
    "imagemUrl" TEXT,
    "valorLocacao" DECIMAL(10,2),
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "criadoPorId" TEXT,

    CONSTRAINT "acervo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "locacoes" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "dataRetirada" TIMESTAMP(3) NOT NULL,
    "dataDevolucao" TIMESTAMP(3) NOT NULL,
    "dataDevolvido" TIMESTAMP(3),
    "status" "LocacaoStatus" NOT NULL DEFAULT 'CONFIRMADA',
    "observacoes" TEXT,
    "valorTotal" DECIMAL(10,2),
    "desconto" DECIMAL(10,2),
    "valorFinal" DECIMAL(10,2),
    "formaPagamento" TEXT,
    "pago" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "criadoPorId" TEXT,

    CONSTRAINT "locacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itens_locacao" (
    "id" TEXT NOT NULL,
    "locacaoId" TEXT NOT NULL,
    "acervoId" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL DEFAULT 1,
    "observacao" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "itens_locacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eventos" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3),
    "diaInteiro" BOOLEAN NOT NULL DEFAULT false,
    "tipo" "EventoTipo" NOT NULL DEFAULT 'OUTRO',
    "cor" TEXT,
    "locacaoId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "criadoPorId" TEXT,

    CONSTRAINT "eventos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historico_acervo" (
    "id" TEXT NOT NULL,
    "acervoId" TEXT NOT NULL,
    "acao" TEXT NOT NULL,
    "detalhe" TEXT,
    "quantidadeAntes" INTEGER,
    "quantidadeDepois" INTEGER,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historico_acervo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_cpf_key" ON "clientes"("cpf");

-- CreateIndex
CREATE INDEX "clientes_nome_idx" ON "clientes"("nome");

-- CreateIndex
CREATE INDEX "clientes_telefone_idx" ON "clientes"("telefone");

-- CreateIndex
CREATE UNIQUE INDEX "categorias_nome_key" ON "categorias"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "acervo_codigoInterno_key" ON "acervo"("codigoInterno");

-- CreateIndex
CREATE INDEX "acervo_nome_idx" ON "acervo"("nome");

-- CreateIndex
CREATE INDEX "acervo_categoriaId_idx" ON "acervo"("categoriaId");

-- CreateIndex
CREATE INDEX "acervo_status_idx" ON "acervo"("status");

-- CreateIndex
CREATE INDEX "locacoes_clienteId_idx" ON "locacoes"("clienteId");

-- CreateIndex
CREATE INDEX "locacoes_status_idx" ON "locacoes"("status");

-- CreateIndex
CREATE INDEX "locacoes_dataRetirada_idx" ON "locacoes"("dataRetirada");

-- CreateIndex
CREATE INDEX "locacoes_dataDevolucao_idx" ON "locacoes"("dataDevolucao");

-- CreateIndex
CREATE INDEX "itens_locacao_locacaoId_idx" ON "itens_locacao"("locacaoId");

-- CreateIndex
CREATE INDEX "itens_locacao_acervoId_idx" ON "itens_locacao"("acervoId");

-- CreateIndex
CREATE UNIQUE INDEX "itens_locacao_locacaoId_acervoId_key" ON "itens_locacao"("locacaoId", "acervoId");

-- CreateIndex
CREATE INDEX "eventos_dataInicio_idx" ON "eventos"("dataInicio");

-- CreateIndex
CREATE INDEX "eventos_locacaoId_idx" ON "eventos"("locacaoId");

-- CreateIndex
CREATE INDEX "historico_acervo_acervoId_idx" ON "historico_acervo"("acervoId");

-- AddForeignKey
ALTER TABLE "acervo" ADD CONSTRAINT "acervo_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "categorias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acervo" ADD CONSTRAINT "acervo_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "locacoes" ADD CONSTRAINT "locacoes_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "locacoes" ADD CONSTRAINT "locacoes_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_locacao" ADD CONSTRAINT "itens_locacao_locacaoId_fkey" FOREIGN KEY ("locacaoId") REFERENCES "locacoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_locacao" ADD CONSTRAINT "itens_locacao_acervoId_fkey" FOREIGN KEY ("acervoId") REFERENCES "acervo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos" ADD CONSTRAINT "eventos_locacaoId_fkey" FOREIGN KEY ("locacaoId") REFERENCES "locacoes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos" ADD CONSTRAINT "eventos_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historico_acervo" ADD CONSTRAINT "historico_acervo_acervoId_fkey" FOREIGN KEY ("acervoId") REFERENCES "acervo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
