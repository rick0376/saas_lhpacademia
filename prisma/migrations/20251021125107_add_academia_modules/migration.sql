-- CreateEnum
CREATE TYPE "GrupoMuscular" AS ENUM ('PEITO', 'COSTAS', 'OMBROS', 'BICEPS', 'TRICEPS', 'PERNAS', 'GLUTEOS', 'ABDOMEN', 'PANTURRILHA', 'ANTEBRACO', 'CARDIO', 'FUNCIONAL');

-- CreateEnum
CREATE TYPE "DiaSemana" AS ENUM ('SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA', 'SABADO', 'DOMINGO');

-- CreateTable
CREATE TABLE "alunos" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT,
    "telefone" TEXT,
    "dataNascimento" TIMESTAMP(3),
    "foto" TEXT,
    "objetivo" TEXT,
    "observacoes" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "clienteId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alunos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medidas" (
    "id" TEXT NOT NULL,
    "alunoId" TEXT NOT NULL,
    "peso" DOUBLE PRECISION NOT NULL,
    "altura" DOUBLE PRECISION NOT NULL,
    "peito" DOUBLE PRECISION,
    "cintura" DOUBLE PRECISION,
    "quadril" DOUBLE PRECISION,
    "bracoDireito" DOUBLE PRECISION,
    "bracoEsquerdo" DOUBLE PRECISION,
    "coxaDireita" DOUBLE PRECISION,
    "coxaEsquerda" DOUBLE PRECISION,
    "panturrilhaDireita" DOUBLE PRECISION,
    "panturrilhaEsquerda" DOUBLE PRECISION,
    "observacoes" TEXT,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "medidas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "avaliacoes" (
    "id" TEXT NOT NULL,
    "alunoId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "observacoes" TEXT,
    "arquivo" TEXT,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "avaliacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercicios" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "grupoMuscular" "GrupoMuscular" NOT NULL,
    "descricao" TEXT,
    "video" TEXT,
    "imagem" TEXT,
    "equipamento" TEXT,
    "clienteId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exercicios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "treinos" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "alunoId" TEXT NOT NULL,
    "objetivo" TEXT,
    "observacoes" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "dataInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataFim" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "treinos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "treino_exercicios" (
    "id" TEXT NOT NULL,
    "treinoId" TEXT NOT NULL,
    "exercicioId" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,
    "series" INTEGER NOT NULL,
    "repeticoes" TEXT NOT NULL,
    "carga" TEXT,
    "descanso" TEXT,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "treino_exercicios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cronogramas" (
    "id" TEXT NOT NULL,
    "treinoId" TEXT NOT NULL,
    "diaSemana" "DiaSemana" NOT NULL,
    "horaInicio" TEXT,
    "horaFim" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cronogramas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "execucoes_treino" (
    "id" TEXT NOT NULL,
    "treinoId" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "observacoes" TEXT,
    "completo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "execucoes_treino_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "execucoes_exercicio" (
    "id" TEXT NOT NULL,
    "execucaoTreinoId" TEXT NOT NULL,
    "exercicioNome" TEXT NOT NULL,
    "series" INTEGER NOT NULL,
    "repeticoes" TEXT NOT NULL,
    "carga" TEXT,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "execucoes_exercicio_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cronogramas_treinoId_diaSemana_key" ON "cronogramas"("treinoId", "diaSemana");

-- AddForeignKey
ALTER TABLE "alunos" ADD CONSTRAINT "alunos_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medidas" ADD CONSTRAINT "medidas_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "alunos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avaliacoes" ADD CONSTRAINT "avaliacoes_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "alunos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercicios" ADD CONSTRAINT "exercicios_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "treinos" ADD CONSTRAINT "treinos_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "alunos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "treino_exercicios" ADD CONSTRAINT "treino_exercicios_treinoId_fkey" FOREIGN KEY ("treinoId") REFERENCES "treinos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "treino_exercicios" ADD CONSTRAINT "treino_exercicios_exercicioId_fkey" FOREIGN KEY ("exercicioId") REFERENCES "exercicios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cronogramas" ADD CONSTRAINT "cronogramas_treinoId_fkey" FOREIGN KEY ("treinoId") REFERENCES "treinos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "execucoes_treino" ADD CONSTRAINT "execucoes_treino_treinoId_fkey" FOREIGN KEY ("treinoId") REFERENCES "treinos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "execucoes_exercicio" ADD CONSTRAINT "execucoes_exercicio_execucaoTreinoId_fkey" FOREIGN KEY ("execucaoTreinoId") REFERENCES "execucoes_treino"("id") ON DELETE CASCADE ON UPDATE CASCADE;
