/*
  Warnings:

  - Added the required column `alunoId` to the `execucoes_treino` table without a default value. This is not possible if the table is not empty.
  - Added the required column `intensidade` to the `execucoes_treino` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "execucoes_exercicio" ADD COLUMN     "treinoExercicioId" TEXT;

-- AlterTable
ALTER TABLE "execucoes_treino" ADD COLUMN     "alunoId" TEXT NOT NULL,
ADD COLUMN     "intensidade" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "execucoes_treino_treinoId_idx" ON "execucoes_treino"("treinoId");

-- CreateIndex
CREATE INDEX "execucoes_treino_alunoId_idx" ON "execucoes_treino"("alunoId");

-- CreateIndex
CREATE INDEX "execucoes_treino_data_idx" ON "execucoes_treino"("data");

-- AddForeignKey
ALTER TABLE "execucoes_treino" ADD CONSTRAINT "execucoes_treino_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "alunos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
