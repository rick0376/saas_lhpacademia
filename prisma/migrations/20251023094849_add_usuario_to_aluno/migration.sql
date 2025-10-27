/*
  Warnings:

  - A unique constraint covering the columns `[usuarioId]` on the table `alunos` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "alunos" ADD COLUMN     "usuarioId" TEXT;

-- AlterTable
ALTER TABLE "medidas" ADD COLUMN     "fotos" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateIndex
CREATE UNIQUE INDEX "alunos_usuarioId_key" ON "alunos"("usuarioId");

-- AddForeignKey
ALTER TABLE "alunos" ADD CONSTRAINT "alunos_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
