import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PUT - Editar exercício do treino
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; exercicioId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id: treinoId, exercicioId } = await params;

    const body = await req.json();
    const { series, repeticoes, carga, descanso, observacoes } = body;

    // Valida se o treino existe
    const treino = await prisma.treino.findUnique({
      where: { id: treinoId },
    });

    if (!treino) {
      return NextResponse.json(
        { error: "Treino não encontrado" },
        { status: 404 }
      );
    }

    // Atualiza o exercício
    const treinoExercicio = await prisma.treinoExercicio.update({
      where: { id: exercicioId },
      data: {
        series,
        repeticoes,
        carga,
        descanso,
        observacoes,
      },
      include: {
        exercicio: true,
      },
    });

    return NextResponse.json(treinoExercicio, { status: 200 });
  } catch (error) {
    console.error("Erro ao atualizar exercício:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar exercício" },
      { status: 500 }
    );
  }
}
