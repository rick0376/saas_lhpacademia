import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

interface Exercício {
  id: string;
  nome: string;
  series: number;
  reps: string;
  descanso: string;
  descricao?: string;
}

interface TreinoDetalhes {
  nome: string;
  descricao: string;
  exercicios: Exercício[];
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const session = await getServerSession();
    if (!session || !(session.user as any)?.aluno?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const alunoId = (session.user as any).aluno.id;
    const treinoId = id;

    const mockTreinos = {
      cmh3onknw00030g0ofc93a26w: {
        nome: "Treino de Peito Semanal",
        descricao: "Foco em hipertrofia do peitoral, ombros e tríceps.",
        exercicios: [
          {
            id: "ex1",
            nome: "Supino Reto com Barra",
            series: 4,
            reps: "8-12",
            descanso: "90s",
            descricao: "Use peso moderado, controle a descida.",
          },
          {
            id: "ex2",
            nome: "Flexões Inclinação",
            series: 3,
            reps: "12-15",
            descanso: "60s",
            descricao: "Mantenha corpo reto, foque no peitoral.",
          },
        ],
      },
    };

    const detalhes: TreinoDetalhes | null =
      mockTreinos[treinoId as keyof typeof mockTreinos] || null;

    if (!detalhes) {
      return NextResponse.json(
        { error: "Treino não encontrado para este aluno" },
        { status: 404 }
      );
    }

    return NextResponse.json(detalhes, { status: 200 });
  } catch (error: any) {
    console.error("Erro no GET /api/alunos/treinos/[id]/exercicios:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
