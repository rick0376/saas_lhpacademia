/*
  Warnings:

  - Made the column `planoId` on table `clientes` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."clientes" DROP CONSTRAINT "clientes_planoId_fkey";

-- AlterTable
ALTER TABLE "clientes" ALTER COLUMN "planoId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_planoId_fkey" FOREIGN KEY ("planoId") REFERENCES "planos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
