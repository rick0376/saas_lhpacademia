-- AlterTable
ALTER TABLE "treinos" ADD COLUMN     "clienteId" TEXT;

-- AddForeignKey
ALTER TABLE "treinos" ADD CONSTRAINT "treinos_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
