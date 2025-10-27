-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'ALUNO';

-- AlterTable
ALTER TABLE "avaliacoes" ADD COLUMN     "resultado" TEXT,
ALTER COLUMN "tipo" DROP NOT NULL;

-- AlterTable
ALTER TABLE "treinos" ADD COLUMN     "descricao" TEXT;
