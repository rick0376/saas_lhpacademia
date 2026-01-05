/*
  Warnings:

  - Made the column `valor` on table `planos` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "planos" ALTER COLUMN "valor" SET NOT NULL;
