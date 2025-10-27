import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface Exercício {
  id: string;
  nome: string;
  series: number;
  reps: string;
  descanso: string;
  descricao?: string;
  fotoExecucao?: string;
}

interface TreinoDetalhes {
  nome: string;
  descricao: string;
  exercicios: Exercício[];
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> } // ✅ Promise
) {
  const { id } = await params; // ✅ Await aqui
  const alunoId = req.nextUrl.searchParams.get("alunoId");

  if (!alunoId) {
    return NextResponse.json({ error: "alunoId ausente" }, { status: 400 });
  }

  /* --- (opcional) verificação de sessão; descomente quando next-auth estiver estável ---
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).aluno?.id !== alunoId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  ------------------------------------------------------------------------------- */

  // consulta única pelo ID; depois valida se o treino pertence ao aluno
  const treino = await prisma.treino.findUnique({
    where: { id }, // ✅ Usa id ao invés de params.id
    select: {
      nome: true,
      descricao: true,
      alunoId: true,
      exercicios: {
        include: {
          exercicio: {
            select: {
              id: true,
              nome: true,
              descricao: true,
              imagem: true,
            },
          },
        },
        orderBy: { ordem: "asc" },
      },
    },
  });

  if (!treino || treino.alunoId !== alunoId) {
    return NextResponse.json(
      { error: "Treino não encontrado" },
      { status: 404 }
    );
  }

  const detalhes: TreinoDetalhes = {
    nome: treino.nome,
    descricao: treino.descricao ?? "Sem descrição.",
    exercicios: treino.exercicios.map((ex: any) => ({
      id: ex.id,
      nome: ex.exercicio.nome,
      series: ex.series,
      reps: ex.repeticoes,
      descanso: ex.descanso ?? "N/A",
      descricao: ex.exercicio.descricao ?? ex.observacoes ?? "Sem descrição.",
      fotoExecucao: ex.exercicio.imagem ?? undefined,
    })),
  };

  return NextResponse.json(detalhes);
}
