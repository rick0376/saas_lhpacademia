import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id: alunoId } = await params;

    // Buscar TODAS as execuções de treinos deste aluno
    const historico = await prisma.execucaoTreino.findMany({
      where: {
        alunoId: alunoId,
        // Se quiser filtrar apenas execuções completas, descomente abaixo:
        // completo: true
      },
      orderBy: {
        data: "desc", // Mais recentes primeiro
      },
      include: {
        exercicios: {
          select: {
            id: true,
            exercicioNome: true,
            series: true,
            repeticoes: true,
            carga: true,
          },
        },
      },
    });

    // Formatar os dados para o frontend
    const historicoFormatado = historico.map((exec) => ({
      id: exec.id,
      data: exec.data,
      intensidade: exec.intensidade,
      completo: exec.completo,
      totalExerciciosRealizados: exec.exercicios.length,
      exercicios: exec.exercicios.map((ex) => ({
        id: ex.id,
        exercicioNome: ex.exercicioNome,
        carga: ex.carga,
        series: ex.series,
        repeticoes: ex.repeticoes,
      })),
    }));

    return NextResponse.json(historicoFormatado, { status: 200 });
  } catch (error) {
    console.error("❌ Erro ao buscar histórico completo:", error);
    return NextResponse.json(
      { error: "Erro ao buscar histórico" },
      { status: 500 }
    );
  }
}
