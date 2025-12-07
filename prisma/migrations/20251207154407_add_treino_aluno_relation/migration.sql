-- DropForeignKey
ALTER TABLE "public"."treinos" DROP CONSTRAINT "treinos_alunoId_fkey";

-- AlterTable
ALTER TABLE "treinos" ALTER COLUMN "alunoId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "treino_alunos" (
    "id" TEXT NOT NULL,
    "treinoId" TEXT NOT NULL,
    "alunoId" TEXT NOT NULL,
    "dataInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataFim" TIMESTAMP(3),
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "treino_alunos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "treino_alunos_alunoId_idx" ON "treino_alunos"("alunoId");

-- CreateIndex
CREATE INDEX "treino_alunos_treinoId_idx" ON "treino_alunos"("treinoId");

-- CreateIndex
CREATE UNIQUE INDEX "treino_alunos_treinoId_alunoId_key" ON "treino_alunos"("treinoId", "alunoId");

-- AddForeignKey
ALTER TABLE "treinos" ADD CONSTRAINT "treinos_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "alunos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "treino_alunos" ADD CONSTRAINT "treino_alunos_treinoId_fkey" FOREIGN KEY ("treinoId") REFERENCES "treinos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "treino_alunos" ADD CONSTRAINT "treino_alunos_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "alunos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
