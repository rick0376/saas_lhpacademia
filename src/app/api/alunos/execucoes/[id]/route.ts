import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const { intensidade, observacoes, completo, data, exercicios } = body;

    const execucaoAtualizada = await prisma.execucaoTreino.update({
      where: { id },
      data: {
        intensidade,
        observacoes,
        completo,
        data: data ? new Date(data) : undefined,
      },
    });

    if (exercicios && Array.isArray(exercicios)) {
      await prisma.execucaoExercicio.deleteMany({
        where: { execucaoTreinoId: id },
      });

      if (exercicios.length > 0) {
        await prisma.execucaoExercicio.createMany({
          data: exercicios.map((ex: any) => ({
            execucaoTreinoId: id,
            exercicioNome: ex.nome,
            series: ex.series,
            repeticoes: ex.repeticoes,
            carga: ex.carga || null,
            observacoes: ex.observacoes || null,
          })),
        });
      }
    }

    return NextResponse.json({
      success: true,
      execucao: execucaoAtualizada,
    });
  } catch (error) {
    console.error("Erro ao atualizar execução:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar execução" },
      { status: 500 }
    );
  }
}
