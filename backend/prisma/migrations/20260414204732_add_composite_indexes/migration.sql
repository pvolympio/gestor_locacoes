-- CreateIndex
CREATE INDEX "itens_locacao_acervoId_locacaoId_idx" ON "itens_locacao"("acervoId", "locacaoId");

-- CreateIndex
CREATE INDEX "locacoes_status_dataDevolucao_idx" ON "locacoes"("status", "dataDevolucao");
