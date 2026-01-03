-- AlterTable
ALTER TABLE "clientes" ADD COLUMN     "extraAlunos" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "extraUsuarios" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "planoId" TEXT;

-- CreateTable
CREATE TABLE "planos" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "limiteUsuarios" INTEGER NOT NULL,
    "limiteAlunos" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "planos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "planos_nome_key" ON "planos"("nome");

-- AddForeignKey
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_planoId_fkey" FOREIGN KEY ("planoId") REFERENCES "planos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
