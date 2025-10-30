/*
  Warnings:

  - Added the required column `updatedAt` to the `avaliacoes` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "avaliacoes" ADD COLUMN     "altura" DOUBLE PRECISION,
ADD COLUMN     "circunferenciaCintura" DOUBLE PRECISION,
ADD COLUMN     "circunferenciaQuadril" DOUBLE PRECISION,
ADD COLUMN     "cirurgias" TEXT,
ADD COLUMN     "diabetes" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "dobrasCutaneas" JSONB,
ADD COLUMN     "doencasArticulares" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "forcaSupino" DOUBLE PRECISION,
ADD COLUMN     "fumante" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "historicoMedico" TEXT,
ADD COLUMN     "imc" DOUBLE PRECISION,
ADD COLUMN     "objetivos" TEXT,
ADD COLUMN     "percentualGordura" DOUBLE PRECISION,
ADD COLUMN     "peso" DOUBLE PRECISION,
ADD COLUMN     "pranchaTempo" INTEGER,
ADD COLUMN     "praticaAnterior" TEXT,
ADD COLUMN     "repeticoesFlexoes" INTEGER,
ADD COLUMN     "testeCooper" DOUBLE PRECISION,
ADD COLUMN     "testeSentarEsticar" DOUBLE PRECISION,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "vo2Max" DOUBLE PRECISION;
