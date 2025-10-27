import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST - Adicionar exercício ao treino
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // ✅ Promise
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const {
      exercicioId,
      ordem,
      series,
      repeticoes,
      carga,
      descanso,
      observacoes,
    } = body;

    if (!exercicioId || !series || !repeticoes) {
      return NextResponse.json(
        { error: "Exercício, séries e repetições são obrigatórios" },
        { status: 400 }
      );
    }

    // ✅ Await params
    const { id } = await params;

    const treinoExercicio = await prisma.treinoExercicio.create({
      data: {
        treinoId: id,
        exercicioId,
        ordem: ordem || 1,
        series,
        repeticoes,
        carga: carga || null,
        descanso: descanso || null,
        observacoes: observacoes || null,
      },
      include: {
        exercicio: true,
      },
    });

    return NextResponse.json(treinoExercicio, { status: 201 });
  } catch (error) {
    console.error("Erro ao adicionar exercício:", error);
    return NextResponse.json(
      { error: "Erro ao adicionar exercício" },
      { status: 500 }
    );
  }
}

// DELETE - Remover exercício do treino
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const exercicioId = searchParams.get("exercicioId");

    if (!exercicioId) {
      return NextResponse.json(
        { error: "ID do exercício é obrigatório" },
        { status: 400 }
      );
    }

    // ✅ Verificar se o exercício existe antes de deletar
    const exercicioExiste = await prisma.treinoExercicio.findUnique({
      where: { id: exercicioId },
    });

    if (!exercicioExiste) {
      return NextResponse.json(
        { error: "Exercício não encontrado ou já foi removido" },
        { status: 404 }
      );
    }

    await prisma.treinoExercicio.delete({
      where: { id: exercicioId },
    });

    return NextResponse.json({ message: "Exercício removido com sucesso" });
  } catch (error) {
    console.error("Erro ao remover exercício:", error);
    return NextResponse.json(
      { error: "Erro ao remover exercício" },
      { status: 500 }
    );
  }
}
