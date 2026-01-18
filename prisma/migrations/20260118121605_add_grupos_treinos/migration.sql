-- CreateTable
CREATE TABLE "grupos_treinos" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "clienteId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grupos_treinos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grupo_treino_itens" (
    "id" TEXT NOT NULL,
    "grupoTreinoId" TEXT NOT NULL,
    "treinoId" TEXT NOT NULL,

    CONSTRAINT "grupo_treino_itens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "grupos_treinos_clienteId_nome_key" ON "grupos_treinos"("clienteId", "nome");

-- CreateIndex
CREATE INDEX "grupo_treino_itens_treinoId_idx" ON "grupo_treino_itens"("treinoId");

-- CreateIndex
CREATE UNIQUE INDEX "grupo_treino_itens_grupoTreinoId_treinoId_key" ON "grupo_treino_itens"("grupoTreinoId", "treinoId");

-- AddForeignKey
ALTER TABLE "grupos_treinos" ADD CONSTRAINT "grupos_treinos_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grupo_treino_itens" ADD CONSTRAINT "grupo_treino_itens_grupoTreinoId_fkey" FOREIGN KEY ("grupoTreinoId") REFERENCES "grupos_treinos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grupo_treino_itens" ADD CONSTRAINT "grupo_treino_itens_treinoId_fkey" FOREIGN KEY ("treinoId") REFERENCES "treinos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
